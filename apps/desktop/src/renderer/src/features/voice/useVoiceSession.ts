import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  VoiceState,
  VoiceStateInfo,
  VoiceTranscriptPayload,
  VoiceErrorPayload
} from '../../types/calby'
import { resampleTo16kMonoPcm, uint8ArrayToBase64 } from '../../lib/audio/audio-resampler'
import { PcmPlayer } from '../../lib/audio/pcm-player'

export interface DiagnosticInfo {
  micPermission: 'granted' | 'denied' | 'unknown'
  micStatus: 'connected' | 'not connected' | 'error'
  micDeviceLabel: string
  selectedDeviceId: string
  availableDevices: MediaDeviceInfo[]
  audioContextState: string
  audioWorkletState: string
  sampleRate: number
  channelCount: number
  micRmsLevel: number
  pcmChunksProduced: number
  pcmChunksSent: number
  geminiInputAudioAccepted: number
  inputTranscriptEvents: number
  geminiStatus: 'Connected' | 'Disconnected'
  lastGeminiEvent: string
  vadState: string
  outputChunksReceived: number
  outputPlaybackState: 'playing' | 'idle'
}

export interface UseVoiceSessionResult {
  state: VoiceState
  stateMetadata?: Record<string, unknown>
  userTranscript: string
  assistantTranscript: string
  error: VoiceErrorPayload | null
  audioLevels: number[] // 5 normalized bar heights [0..1]
  diagnostics: DiagnosticInfo
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  toggleListening: () => Promise<void>
  sendTextInput: (text: string) => Promise<void>
  finishTurn: () => Promise<void>
  interrupt: () => Promise<void>
  retry: () => Promise<void>
  testMicrophoneOnly: () => Promise<void>
  stopMicrophoneOnly: () => void
  selectMicrophoneDevice: (deviceId: string) => Promise<void>
}

/**
 * Reads which window currently owns the mic + Gemini Live session.
 * Defaults to `true` so existing behaviour is preserved whenever the preload
 * API is unavailable or the call fails.
 */
async function resolveVoiceOwnership(): Promise<boolean> {
  try {
    const res = await window.calby?.voice?.getOwner?.()
    if (res && res.ok) return res.data.isOwner
  } catch {
    // Older preload or transient IPC failure: assume ownership.
  }
  return true
}

// PCM chunks are approximately 21 ms at the usual 48 kHz capture rate. A
// short sound from speaker bleed is enough to cross an energy threshold, so a
// barge-in must be both louder and sustained longer than normal turn start.
// This deliberately leaves normal auto-VAD responsive while protecting model
// playback from being treated as a new user utterance.
const BARGE_IN_MIN_CONSECUTIVE_FRAMES = 12 // ~250 ms
const USER_SPEECH_MIN_CONSECUTIVE_FRAMES = 5 // ~105 ms
const BARGE_IN_MIN_RMS = 0.02
const BARGE_IN_NOISE_MULTIPLIER = 2.8
const BARGE_IN_COOLDOWN_MS = 1_200

export function useVoiceSession(): UseVoiceSessionResult {
  const [state, setState] = useState<VoiceState>('idle')
  const [stateMetadata, setStateMetadata] = useState<Record<string, unknown> | undefined>(undefined)
  const [userTranscript, setUserTranscript] = useState<string>('')
  const [assistantTranscript, setAssistantTranscript] = useState<string>('')
  const [error, setError] = useState<VoiceErrorPayload | null>(null)
  const [audioLevels, setAudioLevels] = useState<number[]>([0.15, 0.35, 0.6, 0.3, 0.15])

  const stateRef = useRef<VoiceState>('idle')
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Diagnostic State
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo>({
    micPermission: 'unknown',
    micStatus: 'not connected',
    micDeviceLabel: 'Default Microphone',
    selectedDeviceId: '',
    availableDevices: [],
    audioContextState: 'closed',
    audioWorkletState: 'inactive',
    sampleRate: 48000,
    channelCount: 1,
    micRmsLevel: 0,
    pcmChunksProduced: 0,
    pcmChunksSent: 0,
    geminiInputAudioAccepted: 0,
    inputTranscriptEvents: 0,
    geminiStatus: 'Disconnected',
    lastGeminiEvent: 'None',
    vadState: 'Ready to listen',
    outputChunksReceived: 0,
    outputPlaybackState: 'idle'
  })

  const micStreamRef = useRef<MediaStream | null>(null)
  const micAudioContextRef = useRef<AudioContext | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null)
  const pcmPlayerRef = useRef<PcmPlayer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isMicOnlyTestingRef = useRef<boolean>(false)
  const isTextDiagnosticRef = useRef<boolean>(false)
  const hasReceivedUserTranscriptRef = useRef<boolean>(false)
  const noAudioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pcmChunksProducedRef = useRef<number>(0)
  const selectedDeviceIdRef = useRef<string>('')
  const activeMicDeviceIdRef = useRef<string>('')
  /** Invalidates an asynchronous getUserMedia/worklet setup when it is stopped or restarted. */
  const micCaptureEpochRef = useRef<number>(0)
  /**
   * Exactly one window may own the mic + Gemini Live session at a time
   * (main window vs. the Quick Voice overlay). Defaults to `true` so behaviour
   * is unchanged whenever ownership arbitration is unavailable.
   */
  const isVoiceOwnerRef = useRef<boolean>(true)
  const ownershipPromiseRef = useRef<Promise<boolean> | null>(null)

  /** Shared initial ownership read so every mount effect agrees on the answer. */
  const getOwnership = useCallback((): Promise<boolean> => {
    if (!ownershipPromiseRef.current) {
      ownershipPromiseRef.current = resolveVoiceOwnership()
    }
    return ownershipPromiseRef.current
  }, [])

  // VAD tracking refs
  const isSpeechActiveRef = useRef<boolean>(false)
  const consecutiveSpeechFramesRef = useRef<number>(0)
  const silenceFramesRef = useRef<number>(0)
  const manualPushToTalkRef = useRef<boolean>(false)
  const noiseFloorRef = useRef<number>(0.003)
  const preRollBufferRef = useRef<string[]>([]) // last ~300ms chunks
  const lastBargeInAtRef = useRef<number>(0)
  const bargeInTriggeredRef = useRef<boolean>(false)
  /** Prevents silence/noise-only captures from being finalized as Gemini turns. */
  const hasUsableSpeechRef = useRef<boolean>(false)

  // Enumerate input microphones
  const refreshMicrophoneDevices = useCallback(async (): Promise<void> => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((d) => d.kind === 'audioinput')
      console.log(
        '[VOICE][MIC] Available audio inputs:',
        audioInputs.map((device) => ({
          deviceId: device.deviceId,
          label: device.label,
          groupId: device.groupId
        }))
      )
      setDiagnostics((prev) => ({ ...prev, availableDevices: audioInputs }))
    } catch (err) {
      console.error('[useVoiceSession] Device enumeration failed:', err)
    }
  }, [])

  useEffect(() => {
    void refreshMicrophoneDevices()
    if (window.calby?.settings?.getConfig) {
      void window.calby.settings.getConfig().then((res) => {
        if (res.ok && res.data.voice?.selectedMicDeviceId) {
          const savedId = res.data.voice.selectedMicDeviceId
          const finalId = savedId === 'default' ? '' : savedId
          selectedDeviceIdRef.current = finalId
          setDiagnostics((prev) => ({
            ...prev,
            selectedDeviceId: finalId
          }))
        }
      })
    }
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        void refreshMicrophoneDevices()
      })
    }
  }, [refreshMicrophoneDevices])

  // Initialize PCM Player
  useEffect(() => {
    pcmPlayerRef.current = new PcmPlayer(() => {
      // Audio playback finished
      setDiagnostics((prev) => ({ ...prev, outputPlaybackState: 'idle' }))
      setState((currentState) => {
        if (currentState === 'speaking') {
          return 'idle'
        }
        return currentState
      })
    })

    return () => {
      if (pcmPlayerRef.current) {
        pcmPlayerRef.current.close()
        pcmPlayerRef.current = null
      }
    }
  }, [])

  // Teardown microphone stream
  const stopMicrophoneCapture = useCallback(() => {
    // A pending getUserMedia() or AudioWorklet setup must not resurrect this
    // capture pipeline after ownership changes or a restart.
    micCaptureEpochRef.current += 1
    if (noAudioTimerRef.current) {
      clearTimeout(noAudioTimerRef.current)
      noAudioTimerRef.current = null
    }

    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.port.onmessage = null
      audioWorkletNodeRef.current.disconnect()
      audioWorkletNodeRef.current = null
    }

    if (micStreamRef.current) {
      for (const track of micStreamRef.current.getTracks()) {
        track.stop()
      }
      micStreamRef.current = null
    }
    activeMicDeviceIdRef.current = ''

    const micContext = micAudioContextRef.current
    micAudioContextRef.current = null
    if (micContext && micContext.state !== 'closed') {
      void micContext.close()
    }

    micAnalyserRef.current = null

    setDiagnostics((prev) => ({
      ...prev,
      micStatus: 'not connected',
      audioContextState: 'closed',
      audioWorkletState: 'inactive',
      micRmsLevel: 0
    }))
  }, [])

  // Start microphone capture and 16kHz resampling with local VAD
  const startMicrophoneCapture = useCallback(
    async (deviceId?: string): Promise<void> => {
      const requestedDeviceId = deviceId && deviceId !== 'default' ? deviceId : ''
      const currentStream = micStreamRef.current
      const hasLiveTrack = currentStream?.getAudioTracks().some((track) => track.readyState === 'live')
      if (hasLiveTrack && activeMicDeviceIdRef.current === requestedDeviceId) {
        return
      }

      stopMicrophoneCapture()
      const captureEpoch = micCaptureEpochRef.current
      pcmChunksProducedRef.current = 0

      try {
        const selectedDescription = requestedDeviceId
          ? `explicit (${requestedDeviceId})`
          : 'system default'
        console.log('[VOICE][MIC] Selected device:', selectedDescription)
        console.log('[VOICE][MIC] Requesting getUserMedia stream... deviceId:', requestedDeviceId || 'default')

        const constraints: MediaStreamConstraints = {
          audio:
            deviceId && deviceId !== 'default'
              ? {
                  deviceId: { exact: deviceId },
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                }
              : {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                }
        }

        // An explicit microphone must either be acquired exactly or fail
        // visibly. Falling back to a loose constraint can silently select the
        // laptop microphone and makes diagnostics misleading.
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        // The owner can change while the browser is showing the permission
        // prompt. Release that stale stream rather than creating a second
        // capture/VAD pipeline behind the new owner.
        if (captureEpoch !== micCaptureEpochRef.current || !isVoiceOwnerRef.current) {
          for (const track of stream.getTracks()) track.stop()
          return
        }

        micStreamRef.current = stream
        activeMicDeviceIdRef.current = requestedDeviceId

        const activeTrack = stream.getAudioTracks()[0]
        const deviceLabel = activeTrack?.label || 'Active Microphone'
        const trackSettings = activeTrack?.getSettings()
        console.log('[VOICE][MIC] Active track:', {
          label: activeTrack?.label || '',
          id: activeTrack?.id || '',
          readyState: activeTrack?.readyState || '',
          enabled: activeTrack?.enabled ?? false
        })
        console.log('[VOICE][MIC] Track settings:', {
          deviceId: trackSettings?.deviceId || '',
          sampleRate: trackSettings?.sampleRate,
          channelCount: trackSettings?.channelCount
        })

        setDiagnostics((prev) => ({
          ...prev,
          micPermission: 'granted',
          micStatus: 'connected',
          micDeviceLabel: deviceLabel,
          selectedDeviceId: deviceId || prev.selectedDeviceId
        }))
        // Refresh devices list so labels are populated after permission grant
        void refreshMicrophoneDevices()

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const micCtx = new AudioCtx()
        micAudioContextRef.current = micCtx
        console.log('[VOICE][MIC] AudioContext:', { sampleRate: micCtx.sampleRate, state: micCtx.state })
        console.log('[VOICE][MIC] PCM pipeline:', {
          sourceSampleRate: micCtx.sampleRate,
          targetSampleRate: 16000,
          channels: trackSettings?.channelCount ?? 1,
          geminiMimeType: 'audio/pcm;rate=16000'
        })

        if (captureEpoch !== micCaptureEpochRef.current || !isVoiceOwnerRef.current) {
          for (const track of stream.getTracks()) track.stop()
          if (micCtx.state !== 'closed') void micCtx.close()
          if (micStreamRef.current === stream) micStreamRef.current = null
          if (activeMicDeviceIdRef.current === requestedDeviceId) activeMicDeviceIdRef.current = ''
          if (micAudioContextRef.current === micCtx) micAudioContextRef.current = null
          return
        }

        setDiagnostics((prev) => ({
          ...prev,
          sampleRate: micCtx.sampleRate,
          audioContextState: micCtx.state
        }))

        const sourceNode = micCtx.createMediaStreamSource(stream)
        const analyser = micCtx.createAnalyser()
        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.5
        micAnalyserRef.current = analyser

        // Inline AudioWorklet code to extract live microphone samples with multi-channel selection
        const workletCode = `
          class PcmCaptureProcessor extends AudioWorkletProcessor {
            process(inputs) {
              const input = inputs[0];
              if (!input || input.length === 0) return true;

              let bestChannel = input[0];
              let maxSumSq = 0;
              for (let c = 0; c < input.length; c++) {
                const ch = input[c];
                if (!ch || ch.length === 0) continue;
                let sumSq = 0;
                for (let i = 0; i < ch.length; i++) {
                  sumSq += ch[i] * ch[i];
                }
                if (sumSq > maxSumSq) {
                  maxSumSq = sumSq;
                  bestChannel = ch;
                }
              }

              if (bestChannel && bestChannel.length > 0) {
                this.port.postMessage(bestChannel);
              }
              return true;
            }
          }
          registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
        `
        const blob = new Blob([workletCode], { type: 'application/javascript' })
        const workletUrl = URL.createObjectURL(blob)

        await micCtx.audioWorklet.addModule(workletUrl)
        URL.revokeObjectURL(workletUrl)

        if (captureEpoch !== micCaptureEpochRef.current || !isVoiceOwnerRef.current) {
          for (const track of stream.getTracks()) track.stop()
          if (micCtx.state !== 'closed') void micCtx.close()
          if (micStreamRef.current === stream) micStreamRef.current = null
          if (activeMicDeviceIdRef.current === requestedDeviceId) activeMicDeviceIdRef.current = ''
          if (micAudioContextRef.current === micCtx) micAudioContextRef.current = null
          return
        }

        const workletNode = new AudioWorkletNode(micCtx, 'pcm-capture-processor')
        audioWorkletNodeRef.current = workletNode

        // Connect source to analyser for visual spectrum
        sourceNode.connect(analyser)

        // Connect source directly to worklet
        sourceNode.connect(workletNode)

        // CRITICAL: Connect workletNode to audio destination via 0-gain node so Chrome Web Audio engine activates the worklet thread
        const silenceGain = micCtx.createGain()
        silenceGain.gain.value = 0
        workletNode.connect(silenceGain)
        silenceGain.connect(micCtx.destination)

        setDiagnostics((prev) => ({ ...prev, audioWorkletState: 'active' }))

        let audioAccumulator: number[] = []

        if (noAudioTimerRef.current) clearTimeout(noAudioTimerRef.current)
        noAudioTimerRef.current = setTimeout(() => {
          if (micStreamRef.current && pcmChunksProducedRef.current === 0) {
            console.error('[VOICE][MIC] No microphone audio chunks produced after 5s')
            setError({
              code: 'NO_MIC_FRAMES',
              message: 'Microphone input is not being received. Please check your microphone hardware.'
            })
          }
        }, 5000)

        workletNode.port.onmessage = (event: MessageEvent<Float32Array>): void => {
          // Never feed Gemini from a window that doesn't own the voice session.
          if (!isVoiceOwnerRef.current) return
          const inputData = event.data
          const sourceSampleRate = micCtx.sampleRate

          // Calculate real RMS volume level from physical audio samples
          let sumSq = 0
          for (let i = 0; i < inputData.length; i++) {
            const v = inputData[i]
            sumSq += v * v
          }
          const rms = Math.sqrt(sumSq / inputData.length)
          const normLevel = Math.min(1, Math.max(0, rms * 8.0))

          // Track background noise floor slowly
          noiseFloorRef.current = noiseFloorRef.current * 0.98 + rms * 0.02

          for (let i = 0; i < inputData.length; i++) {
            audioAccumulator.push(inputData[i])
          }

          // Accumulate ~1024 Float32 samples (~21ms @ 48kHz) before resampling to 16kHz PCM
          if (audioAccumulator.length >= 1024) {
            const float32Chunk = new Float32Array(audioAccumulator)
            audioAccumulator = []
            pcmChunksProducedRef.current += 1

            // Calculate peak amplitude of Float32 chunk
            let chunkPeak = 0
            for (let i = 0; i < float32Chunk.length; i++) {
              const abs = Math.abs(float32Chunk[i])
              if (abs > chunkPeak) chunkPeak = abs
            }

            // Preserve the original signal for VAD, but lift quiet physical
            // microphones before PCM conversion. Without this, a turn can be
            // locally detected yet remain below Gemini's transcription floor.
            if (chunkPeak > 0.001 && chunkPeak < 0.2) {
              const targetPeak = 0.45
              const boostMultiplier = Math.min(12.0, targetPeak / chunkPeak)
              for (let i = 0; i < float32Chunk.length; i++) {
                float32Chunk[i] *= boostMultiplier
              }
            }

            const { uint8Buffer } = resampleTo16kMonoPcm(float32Chunk, sourceSampleRate)
            const base64Chunk = uint8ArrayToBase64(uint8Buffer)

            setDiagnostics((prev) => ({
              ...prev,
              micRmsLevel: normLevel,
              pcmChunksProduced: prev.pcmChunksProduced + 1
            }))

            // Ignore Gemini session if in Mic-Only Test mode
            if (isMicOnlyTestingRef.current) {
              return
            }

            // === LOCAL VOICE ACTIVITY DETECTION (VAD) ===
            const speechThreshold = Math.max(0.008, noiseFloorRef.current * 1.8)
            const isSpeechDetected = rms > speechThreshold

            if (isSpeechDetected) {
              consecutiveSpeechFramesRef.current += 1

              // Speech confirmed (~40ms of continuous energy)
              if (consecutiveSpeechFramesRef.current >= 2) {
                silenceFramesRef.current = 0

                if (consecutiveSpeechFramesRef.current >= USER_SPEECH_MIN_CONSECUTIVE_FRAMES) {
                  hasUsableSpeechRef.current = true
                }

                // 1. Barge-in detection during speaking
                if (stateRef.current === 'speaking') {
                  const bargeInThreshold = Math.max(
                    BARGE_IN_MIN_RMS,
                    noiseFloorRef.current * BARGE_IN_NOISE_MULTIPLIER
                  )
                  const now = Date.now()
                  const isMeaningfulBargeIn =
                    rms >= bargeInThreshold &&
                    consecutiveSpeechFramesRef.current >= BARGE_IN_MIN_CONSECUTIVE_FRAMES
                  const isCooledDown = now - lastBargeInAtRef.current >= BARGE_IN_COOLDOWN_MS

                  if (isMeaningfulBargeIn && !bargeInTriggeredRef.current && isCooledDown) {
                    // Set every synchronous guard before mutating playback/state:
                    // AudioWorklet messages can arrive several times before React
                    // commits, which used to create repeated interrupts.
                    bargeInTriggeredRef.current = true
                    lastBargeInAtRef.current = now
                    isSpeechActiveRef.current = true
                    stateRef.current = 'listening'
                    console.log('[VOICE][VAD] Sustained user speech during playback -> Barge-in triggered')
                    void window.calby?.voice?.traceEvent?.('voice_detected', { mode: 'barge-in' })
                    if (pcmPlayerRef.current) {
                      pcmPlayerRef.current.interrupt()
                    }
                    void window.calby?.voice?.interrupt()
                    setState('listening')
                    // New turn started: drop the previous turn's transcripts.
                    setUserTranscript('')
                    setAssistantTranscript('')
                    setDiagnostics((prev) => ({ ...prev, vadState: 'Sustained speech (Barge-in)' }))
                  }
                } else if (
                  (stateRef.current === 'idle' || stateRef.current === 'action_result') &&
                  hasUsableSpeechRef.current
                ) {
                  // 2. Automatic start of user turn
                  console.log('[VOICE][VAD] Speech started -> Entering Listening state')
                  void window.calby?.voice?.traceEvent?.('voice_detected', { mode: 'auto' })
                  isSpeechActiveRef.current = true
                  bargeInTriggeredRef.current = false
                  stateRef.current = 'listening'
                  setState('listening')
                  // New turn started: drop the previous turn's transcripts.
                  setUserTranscript('')
                  setAssistantTranscript('')
                  setDiagnostics((prev) => ({ ...prev, vadState: 'Speech detected' }))

                  // Ensure session is active
                  void window.calby?.voice?.startSession()

                  // Flush pre-roll buffer so initial syllables are intact
                  if (preRollBufferRef.current.length > 0) {
                    for (const prChunk of preRollBufferRef.current) {
                      void window.calby?.voice?.sendAudioChunk(prChunk)
                    }
                    preRollBufferRef.current = []
                  }
                }
              }
            } else {
              consecutiveSpeechFramesRef.current = Math.max(0, consecutiveSpeechFramesRef.current - 1)

              // Check for end of speech turn if automatic listening is active
              if (isSpeechActiveRef.current && !manualPushToTalkRef.current && stateRef.current === 'listening') {
                silenceFramesRef.current += 1

                // ~1.3s of continuous silence after speech
                if (silenceFramesRef.current >= 62) {
                  console.log('[VOICE][VAD] Silence detected after speech -> Finalizing turn')
                  isSpeechActiveRef.current = false
                  silenceFramesRef.current = 0
                  consecutiveSpeechFramesRef.current = 0
                  bargeInTriggeredRef.current = false
                  stateRef.current = 'processing'
                  setState('processing')
                  setDiagnostics((prev) => ({ ...prev, vadState: 'Processing audio turn' }))
                  void window.calby?.voice?.finishTurn()
                }
              }
            }

            // Stream audio chunk to Gemini Live if in active speech or manual push-to-talk
            if (isSpeechActiveRef.current || manualPushToTalkRef.current) {
              setDiagnostics((prev) => ({
                ...prev,
                pcmChunksSent: prev.pcmChunksSent + 1,
                geminiInputAudioAccepted: prev.geminiInputAudioAccepted + 1
              }))
              void window.calby?.voice?.sendAudioChunk(base64Chunk)
            } else {
              // Maintain circular pre-roll buffer of last 6 chunks (~300ms)
              preRollBufferRef.current.push(base64Chunk)
              if (preRollBufferRef.current.length > 6) {
                preRollBufferRef.current.shift()
              }
            }
          }
        }
      } catch (err) {
        console.error('[VOICE][MIC] Microphone capture error:', err)
        const isPermissionError =
          err instanceof Error &&
          (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        const message = isPermissionError
          ? 'Microphone access is required to talk to Calby.'
          : 'Unable to access the selected microphone.'

        setDiagnostics((prev) => ({
          ...prev,
          micPermission: 'denied',
          micStatus: 'error'
        }))
        setError({
          code: isPermissionError ? 'MIC_PERMISSION_DENIED' : 'MIC_CAPTURE_FAILED',
          message
        })
        setState('error')
      }
    },
    [stopMicrophoneCapture, refreshMicrophoneDevices]
  )

  // Auto-start microphone capture on mount — only for the window that owns the
  // voice session, so two windows can never capture/send audio at once.
  useEffect(() => {
    let isMounted = true

    const initMic = async (): Promise<void> => {
      const isOwner = await getOwnership()
      if (!isMounted) return
      isVoiceOwnerRef.current = isOwner
      if (!isOwner) return

      let targetMicId = ''
      try {
        const cfg = await window.calby?.settings?.getConfig?.()
        if (cfg?.ok && cfg.data.voice?.selectedMicDeviceId) {
          const savedId = cfg.data.voice.selectedMicDeviceId
          targetMicId = savedId === 'default' ? '' : savedId
        }
      } catch {
        // use default
      }
      if (isMounted && isVoiceOwnerRef.current) {
        void startMicrophoneCapture(targetMicId)
      }
    }

    const startTimer = setTimeout(() => {
      void initMic()
    }, 0)

    return () => {
      isMounted = false
      clearTimeout(startTimer)
      stopMicrophoneCapture()
    }
  }, [getOwnership, startMicrophoneCapture, stopMicrophoneCapture])

  // Ownership handoff: taking over reopens the mic and resyncs state; losing it
  // releases the mic and stops playback so responses can't play twice.
  useEffect(() => {
    const voiceApi = window.calby?.voice
    if (!voiceApi || !voiceApi.onOwnerChanged) return

    const applyOwnership = (isOwner: boolean): void => {
      if (isOwner === isVoiceOwnerRef.current) return
      isVoiceOwnerRef.current = isOwner

      if (!isOwner) {
        if (pcmPlayerRef.current) {
          pcmPlayerRef.current.interrupt()
        }
        stopMicrophoneCapture()
        isSpeechActiveRef.current = false
        manualPushToTalkRef.current = false
        preRollBufferRef.current = []
        setState('idle')
        setStateMetadata(undefined)
        setUserTranscript('')
        setAssistantTranscript('')
        setError(null)
        setDiagnostics((prev) => ({
          ...prev,
          geminiStatus: 'Disconnected',
          vadState: 'Another window is handling voice',
          outputPlaybackState: 'idle'
        }))
        return
      }

      void window.calby.voice
        .getState()
        .then((res) => {
          if (!isVoiceOwnerRef.current || !res.ok) return
          setState(res.data.state)
          setStateMetadata(res.data.metadata)
        })
        .catch(() => undefined)

      void (async () => {
        let targetMicId = selectedDeviceIdRef.current
        try {
          const cfg = await window.calby?.settings?.getConfig?.()
          if (cfg?.ok && cfg.data.voice?.selectedMicDeviceId) {
            const savedId = cfg.data.voice.selectedMicDeviceId
            targetMicId = savedId === 'default' ? '' : savedId
          }
        } catch {
          // keep the currently selected device
        }
        if (isVoiceOwnerRef.current && !micStreamRef.current) {
          void startMicrophoneCapture(targetMicId)
        }
      })()
    }

    return voiceApi.onOwnerChanged((payload) => {
      applyOwnership(Boolean(payload && payload.isOwner))
    })
  }, [startMicrophoneCapture, stopMicrophoneCapture])

  // Subscribe to IPC voice events. Handlers only apply while this window owns
  // the voice session, so a non-owner can never play audio or show stale state.
  useEffect(() => {
    const voiceApi = window.calby?.voice
    if (!voiceApi) return

    let active = true
    const unsubs: Array<() => void> = []

    void (async () => {
      const isOwner = await getOwnership()
      if (!active) return
      isVoiceOwnerRef.current = isOwner

      // 1. Initial State — only the owning window reflects the session state.
      if (isOwner) {
        try {
          const res = await voiceApi.getState()
          if (active && isVoiceOwnerRef.current && res.ok) {
            setState(res.data.state)
            setStateMetadata(res.data.metadata)
          }
        } catch {
          // Fall through: subscriptions below still matter.
        }
      }
      if (!active) return

      // 2. State Changed
      unsubs.push(
        voiceApi.onStateChanged((info: VoiceStateInfo) => {
          if (!isVoiceOwnerRef.current) return
          setState(info.state)
          setStateMetadata(info.metadata)
          if (info.state === 'error' && info.metadata?.message) {
            setError({
              code: (info.metadata.code as string) || 'VOICE_ERROR',
              message: String(info.metadata.message)
            })
          } else if (info.state !== 'error') {
            setError(null)
          }
        })
      )

      // 3. Audio Chunk from Gemini (24kHz PCM)
      unsubs.push(
        voiceApi.onAudioChunk((base64Chunk: string) => {
          if (!isVoiceOwnerRef.current) return
          setDiagnostics((prev) => ({
            ...prev,
            lastGeminiEvent: 'model audio received',
            outputChunksReceived: prev.outputChunksReceived + 1,
            outputPlaybackState: 'playing'
          }))
          if (pcmPlayerRef.current) {
            pcmPlayerRef.current.playChunk(base64Chunk)
          }
        })
      )

      // 4. Transcripts
      unsubs.push(
        voiceApi.onTranscript((payload: VoiceTranscriptPayload) => {
          if (!isVoiceOwnerRef.current) return
          if (payload.role === 'user') {
            console.log(`[VOICE][USER] "${payload.text}"`)
            hasReceivedUserTranscriptRef.current = true
            setUserTranscript(payload.text)
            setDiagnostics((prev) => ({
              ...prev,
              lastGeminiEvent: 'input transcription',
              inputTranscriptEvents: prev.inputTranscriptEvents + 1,
              vadState: payload.isFinal ? 'Silence / turn ending' : 'Speech detected'
            }))
          } else {
            console.log(`[VOICE][GEMINI] outputTranscript="${payload.text}"`)
            setAssistantTranscript((prev) =>
              payload.isFinal ? payload.text : (prev ? prev + ' ' : '') + payload.text
            )
            setDiagnostics((prev) => ({
              ...prev,
              lastGeminiEvent: 'model text received'
            }))
          }
        })
      )

      // 5. Interrupted (Barge-in)
      unsubs.push(
        voiceApi.onInterrupted(() => {
          if (!isVoiceOwnerRef.current) return
          console.log('[VOICE][PLAYBACK] interrupted')
          if (pcmPlayerRef.current) {
            pcmPlayerRef.current.interrupt()
          }
          setAssistantTranscript('')
          setDiagnostics((prev) => ({
            ...prev,
            lastGeminiEvent: 'interrupted',
            outputPlaybackState: 'idle'
          }))
        })
      )

      // 6. Turn Complete
      unsubs.push(
        voiceApi.onTurnComplete(() => {
          if (!isVoiceOwnerRef.current) return
          console.log('[VOICE][GEMINI] turnComplete')
          setDiagnostics((prev) => ({
            ...prev,
            lastGeminiEvent: 'turn complete',
            vadState: 'Turn complete'
          }))
        })
      )

      // 7. Error
      unsubs.push(
        voiceApi.onError((err: VoiceErrorPayload) => {
          if (!isVoiceOwnerRef.current) return
          console.error('[VOICE][GEMINI] error:', err)
          setError(err)
          setState('error')
          setDiagnostics((prev) => ({
            ...prev,
            lastGeminiEvent: `error: ${err.message}`,
            geminiStatus: 'Disconnected'
          }))
          if (pcmPlayerRef.current) {
            pcmPlayerRef.current.interrupt()
          }
        })
      )
    })()

    return () => {
      active = false
      for (const unsub of unsubs) {
        unsub()
      }
    }
  }, [getOwnership])

  // Dynamic Audio Visualizer Animation Loop
  useEffect(() => {
    let lastTime = 0

    const updateAudioLevels = (timestamp: number): void => {
      // Throttle visualizer state update to ~30fps to minimize React overhead while keeping smooth movement
      if (timestamp - lastTime >= 33) {
        lastTime = timestamp
        let analyser: AnalyserNode | null = null

        if (state === 'listening') {
          analyser = micAnalyserRef.current
        } else if (state === 'speaking' && pcmPlayerRef.current) {
          analyser = pcmPlayerRef.current.getAnalyser()
        }

        if (analyser) {
          const bufferLength = analyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          analyser.getByteFrequencyData(dataArray)

          const binStep = Math.floor(bufferLength / 5)
          const levels = [
            Math.min(1, Math.max(0.1, (dataArray[0] || 0) / 255)),
            Math.min(1, Math.max(0.15, (dataArray[binStep] || 0) / 255)),
            Math.min(1, Math.max(0.2, (dataArray[binStep * 2] || 0) / 255)),
            Math.min(1, Math.max(0.15, (dataArray[binStep * 3] || 0) / 255)),
            Math.min(1, Math.max(0.1, (dataArray[binStep * 4] || 0) / 255))
          ]
          setAudioLevels(levels)
        } else {
          if (state === 'idle') {
            setAudioLevels([0.15, 0.35, 0.6, 0.3, 0.15])
          } else if (state === 'processing') {
            setAudioLevels([0.25, 0.5, 0.8, 0.5, 0.25])
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateAudioLevels)
    }

    animationFrameRef.current = requestAnimationFrame(updateAudioLevels)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [state])

  // Public Session Controls
  const startListening = useCallback(async (): Promise<void> => {
    if (!isVoiceOwnerRef.current) return
    if (!navigator.onLine) {
      setError({
        code: 'OFFLINE',
        message: 'Please check your internet connection and try again.'
      })
      setState('error')
      return
    }
    isMicOnlyTestingRef.current = false
    isTextDiagnosticRef.current = false
    hasReceivedUserTranscriptRef.current = false
    // Button/toggle listening opens a session but must not turn an empty
    // capture into a completed conversational turn.
    isSpeechActiveRef.current = manualPushToTalkRef.current
    hasUsableSpeechRef.current = false
    silenceFramesRef.current = 0
    setError(null)
    setUserTranscript('')
    setAssistantTranscript('')
    setState('listening')
    setDiagnostics((prev) => ({
      ...prev,
      geminiStatus: 'Connected',
      lastGeminiEvent: 'session starting',
      vadState: 'Listening'
    }))

    if (!micStreamRef.current) {
      let targetMicId = selectedDeviceIdRef.current
      try {
        const cfg = await window.calby?.settings?.getConfig?.()
        if (cfg?.ok && cfg.data.voice?.selectedMicDeviceId) {
          const savedId = cfg.data.voice.selectedMicDeviceId
          targetMicId = savedId === 'default' ? '' : savedId
        }
      } catch {
        // Use currently held ref
      }
      await startMicrophoneCapture(targetMicId)
    }

    await window.calby?.voice?.startSession()
  }, [startMicrophoneCapture])

  const finishTurn = useCallback(async (): Promise<void> => {
    if (!isVoiceOwnerRef.current) return
    isMicOnlyTestingRef.current = false
    isSpeechActiveRef.current = false
    silenceFramesRef.current = 0
    consecutiveSpeechFramesRef.current = 0
    if (!hasUsableSpeechRef.current && !isTextDiagnosticRef.current) {
      // Do not send a synthetic empty turn. Keeping the established Live
      // session listening avoids the <no speech>{pause} response cycle.
      setDiagnostics((prev) => ({ ...prev, vadState: 'Waiting for usable speech' }))
      stateRef.current = 'listening'
      setState('listening')
      return
    }
    hasUsableSpeechRef.current = false
    setDiagnostics((prev) => ({ ...prev, vadState: 'Processing audio turn' }))
    stateRef.current = 'processing'
    setState('processing')
    await window.calby?.voice?.finishTurn()
  }, [])

  const stopListening = useCallback(async (): Promise<void> => {
    if (!isVoiceOwnerRef.current) return
    isMicOnlyTestingRef.current = false
    isTextDiagnosticRef.current = false
    hasReceivedUserTranscriptRef.current = false
    isSpeechActiveRef.current = false
    silenceFramesRef.current = 0
    consecutiveSpeechFramesRef.current = 0
    hasUsableSpeechRef.current = false
    bargeInTriggeredRef.current = false
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.interrupt()
    }
    setState('idle')
    await window.calby?.voice?.stopSession()
  }, [])

  // Stop an active Live request when the operating system reports that the
  // network went away. The existing retry path reuses the normal startup flow
  // after connectivity returns.
  useEffect(() => {
    const handleOffline = (): void => {
      if (!isVoiceOwnerRef.current) return
      if (pcmPlayerRef.current) pcmPlayerRef.current.interrupt()
      stopMicrophoneCapture()
      void (async () => {
        await window.calby?.voice?.stopSession()
        setError({
          code: 'CONNECTION_LOST',
          message: 'Please check your internet and try again.'
        })
        setState('error')
      })()
    }
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
  }, [stopMicrophoneCapture])

  const toggleListening = useCallback(async (): Promise<void> => {
    if (!isVoiceOwnerRef.current) return
    if (state === 'speaking') {
      if (pcmPlayerRef.current) {
        pcmPlayerRef.current.interrupt()
      }
      await window.calby?.voice?.interrupt()
      await startListening()
    } else if (state === 'listening') {
      await finishTurn()
    } else {
      await startListening()
    }
  }, [state, startListening, finishTurn])

  const sendTextInput = useCallback(async (text: string): Promise<void> => {
    if (!isVoiceOwnerRef.current) return
    if (!navigator.onLine) {
      setError({
        code: 'OFFLINE',
        message: 'Please check your internet connection and try again.'
      })
      setState('error')
      return
    }
    isTextDiagnosticRef.current = true
    hasReceivedUserTranscriptRef.current = true
    setError(null)
    setUserTranscript(`[Text Diagnostic Only] ${text}`)
    setAssistantTranscript('')
    setDiagnostics((prev) => ({
      ...prev,
      geminiStatus: 'Connected',
      lastGeminiEvent: '[Text Diagnostic Only] sending text input'
    }))
    await window.calby?.voice?.sendTextInput(text)
  }, [])

  const interrupt = useCallback(async (): Promise<void> => {
    if (!isVoiceOwnerRef.current) return
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.interrupt()
    }
    await window.calby?.voice?.interrupt()
  }, [])

  const retry = useCallback(async (): Promise<void> => {
    if (!isVoiceOwnerRef.current) return
    setError(null)
    await startListening()
  }, [startListening])

  // Mic-Only Test Mode (Excludes Gemini Live)
  const testMicrophoneOnly = useCallback(async (): Promise<void> => {
    isMicOnlyTestingRef.current = true
    setError(null)
    await startMicrophoneCapture(selectedDeviceIdRef.current)
  }, [startMicrophoneCapture])

  const stopMicrophoneOnly = useCallback((): void => {
    isMicOnlyTestingRef.current = false
    stopMicrophoneCapture()
  }, [stopMicrophoneCapture])

  const selectMicrophoneDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      console.log('[VOICE][MIC] Selecting microphone deviceId:', deviceId)
      selectedDeviceIdRef.current = deviceId
      setDiagnostics((prev) => ({ ...prev, selectedDeviceId: deviceId }))
      if (micStreamRef.current) {
        await startMicrophoneCapture(deviceId)
      }
    },
    [startMicrophoneCapture]
  )

  // Global Spacebar Push-to-Talk and Escape cancellation key handlers
  useEffect(() => {
    let isSpacePressed = false

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!isVoiceOwnerRef.current) return
      const active = document.activeElement as HTMLElement | null
      if (
        active?.tagName === 'INPUT' ||
        active?.tagName === 'TEXTAREA' ||
        Boolean(active?.isContentEditable)
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        if (e.repeat || isSpacePressed) return
        isSpacePressed = true
        manualPushToTalkRef.current = true
        isSpeechActiveRef.current = true
        silenceFramesRef.current = 0

        if (stateRef.current === 'speaking') {
          void interrupt()
        }
        void startListening()
      } else if (e.code === 'Escape') {
        e.preventDefault()
        isSpacePressed = false
        manualPushToTalkRef.current = false
        isSpeechActiveRef.current = false
        void stopListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.code === 'Space') {
        e.preventDefault()
        isSpacePressed = false
        manualPushToTalkRef.current = false
        if (stateRef.current === 'listening') {
          void finishTurn()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startListening, finishTurn, stopListening, interrupt])

  return {
    state,
    stateMetadata,
    userTranscript,
    assistantTranscript,
    error,
    audioLevels,
    diagnostics,
    startListening,
    stopListening,
    toggleListening,
    sendTextInput,
    finishTurn,
    interrupt,
    retry,
    testMicrophoneOnly,
    stopMicrophoneOnly,
    selectMicrophoneDevice
  }
}
