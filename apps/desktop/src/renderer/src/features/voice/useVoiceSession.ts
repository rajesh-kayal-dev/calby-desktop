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

  // VAD tracking refs
  const isSpeechActiveRef = useRef<boolean>(false)
  const consecutiveSpeechFramesRef = useRef<number>(0)
  const silenceFramesRef = useRef<number>(0)
  const manualPushToTalkRef = useRef<boolean>(false)
  const noiseFloorRef = useRef<number>(0.01)
  const preRollBufferRef = useRef<string[]>([]) // last ~300ms chunks

  // Enumerate input microphones
  const refreshMicrophoneDevices = useCallback(async (): Promise<void> => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((d) => d.kind === 'audioinput')
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
          setDiagnostics((prev) => ({
            ...prev,
            selectedDeviceId: savedId === 'default' ? '' : savedId
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

    if (micAudioContextRef.current && micAudioContextRef.current.state !== 'closed') {
      void micAudioContextRef.current.close()
      micAudioContextRef.current = null
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
      stopMicrophoneCapture()

      try {
        console.log('[VOICE][MIC] Requesting getUserMedia stream... deviceId:', deviceId || 'default')

        const constraints = {
          audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            : {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        micStreamRef.current = stream

        const activeTrack = stream.getAudioTracks()[0]
        const deviceLabel = activeTrack?.label || 'Active Microphone'

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
          if (micStreamRef.current && diagnostics.pcmChunksProduced === 0) {
            console.error('[VOICE][MIC] No microphone audio chunks produced after 5s')
            setError({
              code: 'NO_MIC_FRAMES',
              message: 'Microphone input is not being received. Please check your microphone hardware.'
            })
          }
        }, 5000)

        workletNode.port.onmessage = (event: MessageEvent<Float32Array>): void => {
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

            // Calculate peak amplitude of Float32 chunk
            let chunkPeak = 0
            for (let i = 0; i < float32Chunk.length; i++) {
              const abs = Math.abs(float32Chunk[i])
              if (abs > chunkPeak) chunkPeak = abs
            }

            // Controlled software gain scaling for soft hardware inputs
            if (chunkPeak > 0.001 && chunkPeak < 0.2) {
              const targetPeak = 0.25
              const boostMultiplier = Math.min(4.0, targetPeak / chunkPeak)
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
            const speechThreshold = Math.max(0.02, noiseFloorRef.current * 2.2)
            const isSpeechDetected = rms > speechThreshold

            if (isSpeechDetected) {
              consecutiveSpeechFramesRef.current += 1

              // Speech confirmed (~60ms of continuous energy)
              if (consecutiveSpeechFramesRef.current >= 3) {
                silenceFramesRef.current = 0

                // 1. Barge-in detection during speaking
                if (stateRef.current === 'speaking') {
                  console.log('[VOICE][VAD] User speaking while assistant talking -> Barge-in triggered')
                  if (pcmPlayerRef.current) {
                    pcmPlayerRef.current.interrupt()
                  }
                  void window.calby?.voice?.interrupt()
                  isSpeechActiveRef.current = true
                  setState('listening')
                  setDiagnostics((prev) => ({ ...prev, vadState: 'Speech detected (Barge-in)' }))
                } else if (stateRef.current === 'idle' || stateRef.current === 'action_result') {
                  // 2. Automatic start of user turn
                  console.log('[VOICE][VAD] Speech started -> Entering Listening state')
                  isSpeechActiveRef.current = true
                  setState('listening')
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
                  setState('processing')
                  setDiagnostics((prev) => ({ ...prev, vadState: 'Processing audio turn' }))
                  void window.calby?.voice?.finishTurn()
                }
              }
            }

            // Stream audio chunk to Gemini Live if in active speech or manual push-to-talk
            if (isSpeechActiveRef.current || manualPushToTalkRef.current || stateRef.current === 'listening') {
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
    [stopMicrophoneCapture, refreshMicrophoneDevices, diagnostics.pcmChunksProduced]
  )

  // Auto-start microphone capture on mount
  useEffect(() => {
    let isMounted = true

    const initMic = async (): Promise<void> => {
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
      if (isMounted) {
        void startMicrophoneCapture(targetMicId)
      }
    }

    void initMic()

    return () => {
      isMounted = false
      stopMicrophoneCapture()
    }
  }, [startMicrophoneCapture, stopMicrophoneCapture])

  // Subscribe to IPC voice events
  useEffect(() => {
    if (!window.calby?.voice) return

    // 1. Initial State
    void window.calby.voice.getState().then((res) => {
      if (res.ok) {
        setState(res.data.state)
        setStateMetadata(res.data.metadata)
      }
    })

    // 2. State Changed
    const unsubState = window.calby.voice.onStateChanged((info: VoiceStateInfo) => {
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

    // 3. Audio Chunk from Gemini (24kHz PCM)
    const unsubAudio = window.calby.voice.onAudioChunk((base64Chunk: string) => {
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

    // 4. Transcripts
    const unsubTranscript = window.calby.voice.onTranscript((payload: VoiceTranscriptPayload) => {
      if (payload.role === 'user') {
        console.log(`[VOICE][GEMINI] inputTranscript="${payload.text}"`)
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
        setAssistantTranscript((prev) => (payload.isFinal ? payload.text : (prev ? prev + ' ' : '') + payload.text))
        setDiagnostics((prev) => ({
          ...prev,
          lastGeminiEvent: 'model text received'
        }))
      }
    })

    // 5. Interrupted (Barge-in)
    const unsubInterrupted = window.calby.voice.onInterrupted(() => {
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

    // 6. Turn Complete
    const unsubTurn = window.calby.voice.onTurnComplete(() => {
      console.log('[VOICE][GEMINI] turnComplete')
      setDiagnostics((prev) => ({
        ...prev,
        lastGeminiEvent: 'turn complete',
        vadState: 'Turn complete'
      }))
    })

    // 7. Error
    const unsubError = window.calby.voice.onError((err: VoiceErrorPayload) => {
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

    return () => {
      unsubState()
      unsubAudio()
      unsubTranscript()
      unsubInterrupted()
      unsubTurn()
      unsubError()
    }
  }, [])

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
    isMicOnlyTestingRef.current = false
    isTextDiagnosticRef.current = false
    hasReceivedUserTranscriptRef.current = false
    isSpeechActiveRef.current = true
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
      let targetMicId = diagnostics.selectedDeviceId
      try {
        const cfg = await window.calby?.settings?.getConfig?.()
        if (cfg?.ok && cfg.data.voice?.selectedMicDeviceId) {
          const savedId = cfg.data.voice.selectedMicDeviceId
          targetMicId = savedId === 'default' ? '' : savedId
        }
      } catch {
        // Use currently held state
      }
      await startMicrophoneCapture(targetMicId)
    }

    await window.calby?.voice?.startSession()
  }, [startMicrophoneCapture, diagnostics.selectedDeviceId])

  const finishTurn = useCallback(async (): Promise<void> => {
    isMicOnlyTestingRef.current = false
    isSpeechActiveRef.current = false
    silenceFramesRef.current = 0
    consecutiveSpeechFramesRef.current = 0
    setDiagnostics((prev) => ({ ...prev, vadState: 'Processing audio turn' }))
    setState('processing')
    await window.calby?.voice?.finishTurn()
  }, [])

  const stopListening = useCallback(async (): Promise<void> => {
    isMicOnlyTestingRef.current = false
    isTextDiagnosticRef.current = false
    hasReceivedUserTranscriptRef.current = false
    isSpeechActiveRef.current = false
    silenceFramesRef.current = 0
    consecutiveSpeechFramesRef.current = 0
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.interrupt()
    }
    setState('idle')
    await window.calby?.voice?.stopSession()
  }, [])

  const toggleListening = useCallback(async (): Promise<void> => {
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
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.interrupt()
    }
    await window.calby?.voice?.interrupt()
  }, [])

  const retry = useCallback(async (): Promise<void> => {
    setError(null)
    await startListening()
  }, [startListening])

  // Mic-Only Test Mode (Excludes Gemini Live)
  const testMicrophoneOnly = useCallback(async (): Promise<void> => {
    isMicOnlyTestingRef.current = true
    setError(null)
    await startMicrophoneCapture(diagnostics.selectedDeviceId)
  }, [startMicrophoneCapture, diagnostics.selectedDeviceId])

  const stopMicrophoneOnly = useCallback((): void => {
    isMicOnlyTestingRef.current = false
    stopMicrophoneCapture()
  }, [stopMicrophoneCapture])

  const selectMicrophoneDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      console.log('[VOICE][MIC] Selecting microphone deviceId:', deviceId)
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
