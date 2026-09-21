import { useState, useEffect, useRef, useCallback, type FC } from 'react'
import type { VoiceSettings, MicPermissionState } from '../types'
import { PcmPlayer } from '../../../lib/audio/pcm-player'

interface VoiceMicrophoneSettingsProps {
  voiceSettings?: VoiceSettings
  micState: MicPermissionState
  onUpdateVoice: (data: Partial<VoiceSettings>) => Promise<boolean>
  onOpenMicSettings?: () => void
}

interface VoiceOption {
  id: string
  label: string
}

const VOICE_CATALOG: VoiceOption[] = [
  { id: 'Achird', label: 'Achird · Friendly' },
  { id: 'Zubenelgenubi', label: 'Zubenelgenubi · Casual' },
  { id: 'Sulafat', label: 'Sulafat · Warm' },
  { id: 'Vindemiatrix', label: 'Vindemiatrix · Gentle' },
  { id: 'Callirrhoe', label: 'Callirrhoe · Easy-going' },
  { id: 'Puck', label: 'Puck · Calm' },
  { id: 'Charon', label: 'Charon · Friendly' },
  { id: 'Kore', label: 'Kore · Warm' },
  { id: 'Fenrir', label: 'Fenrir · Deep' },
  { id: 'Aoede', label: 'Aoede · Melodic' }
]

function formatPreviewError(error: unknown): string {
  if (!error) return "Voice preview couldn't be played."
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()

  if (
    lower.includes('auth') ||
    lower.includes('api key') ||
    lower.includes('unauthorized') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('api_key_invalid')
  ) {
    return 'Your Gemini API key could not be authenticated.'
  }

  if (
    lower.includes('connect') ||
    lower.includes('internet') ||
    lower.includes('timeout') ||
    lower.includes('network') ||
    lower.includes('econnrefused')
  ) {
    return "Couldn't connect to Gemini. Check your internet connection."
  }

  if (
    lower.includes('404') ||
    lower.includes('not_found') ||
    lower.includes('model not found') ||
    lower.includes('no longer available') ||
    lower.includes('temporarily unavailable')
  ) {
    return "Calby's voice service is temporarily unavailable."
  }

  if (lower.includes('invalid voice') || lower.includes('voice not available') || lower.includes('unsupported voice')) {
    return 'This voice is currently unavailable.'
  }

  if (lower.includes('no audio') || lower.includes('returned no audio')) {
    return 'Gemini returned no audio for this preview.'
  }

  if (lower.includes('decode') || lower.includes('playback') || lower.includes('audiocontext') || lower.includes('pcm')) {
    return "Calby couldn't play the voice preview."
  }

  return "Voice preview couldn't be played."
}

export const VoiceMicrophoneSettings: FC<VoiceMicrophoneSettingsProps> = ({
  voiceSettings,
  micState,
  onUpdateVoice
}) => {
  const [savedVoice, setSavedVoice] = useState(voiceSettings?.voiceName || 'Achird')
  const [selectedVoice, setSelectedVoice] = useState(voiceSettings?.voiceName || 'Achird')
  const [isSavingVoice, setIsSavingVoice] = useState(false)
  const [voiceSaveConfirmation, setVoiceSaveConfirmation] = useState(false)
  const [selectedMicId, setSelectedMicId] = useState(voiceSettings?.selectedMicDeviceId || 'default')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [permissionStatus, setPermissionStatus] = useState<MicPermissionState>(micState)

  // Preview state
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const pcmPlayerRef = useRef<PcmPlayer | null>(null)

  // Mic test state
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [micTestResult, setMicTestResult] = useState<
    'working' | 'silent' | 'permission_denied' | 'unavailable' | null
  >(null)

  // Keep state synced with props
  useEffect(() => {
    if (voiceSettings?.voiceName) {
      setSavedVoice(voiceSettings.voiceName)
      setSelectedVoice(voiceSettings.voiceName)
    }
    if (voiceSettings?.selectedMicDeviceId) {
      setSelectedMicId(voiceSettings.selectedMicDeviceId)
    }
  }, [voiceSettings])

  useEffect(() => {
    setPermissionStatus(micState)
  }, [micState])

  // Enumerate input devices
  const refreshDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = allDevices.filter((d) => d.kind === 'audioinput')
        setDevices(audioInputs)

        // If currently saved device is no longer found and devices exist, handle fallback
        if (
          audioInputs.length > 0 &&
          selectedMicId !== 'default' &&
          !audioInputs.some((d) => d.deviceId === selectedMicId)
        ) {
          const fallbackId = audioInputs[0].deviceId || 'default'
          setSelectedMicId(fallbackId)
          void onUpdateVoice({ selectedMicDeviceId: fallbackId })
        }
      }
    } catch (err) {
      console.warn('[VoiceSettings] Unable to enumerate audio devices:', err)
    }
  }, [selectedMicId, onUpdateVoice])

  useEffect(() => {
    void refreshDevices()
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices)
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices)
      }
    }
    return undefined
  }, [refreshDevices])

  // Cleanup active preview audio on unmount
  useEffect(() => {
    return () => {
      stopVoicePreview()
    }
  }, [])

  // Stop active preview playback
  const stopVoicePreview = () => {
    setIsLoadingPreview(false)
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.close()
      pcmPlayerRef.current = null
    }
    setPreviewingVoiceId(null)
  }

  // Handle voice selection (pending selection locally, does NOT save immediately)
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId)
    setVoiceSaveConfirmation(false)
  }

  // Commit pending voice selection to persistent storage
  const handleSaveVoice = async () => {
    if (selectedVoice === savedVoice || isSavingVoice) return
    setIsSavingVoice(true)
    try {
      const ok = await onUpdateVoice({ voiceName: selectedVoice })
      if (ok) {
        setSavedVoice(selectedVoice)
        setVoiceSaveConfirmation(true)
        setTimeout(() => setVoiceSaveConfirmation(false), 3000)
      }
    } finally {
      setIsSavingVoice(false)
    }
  }

  // Reset pending selection back to Achird default
  const handleResetVoice = () => {
    setSelectedVoice('Achird')
    setVoiceSaveConfirmation(false)
  }

  // Handle microphone selection (immediately saves and sets deviceId)
  const handleMicDeviceChange = async (deviceId: string) => {
    setSelectedMicId(deviceId)
    setMicTestResult(null)
    await onUpdateVoice({ selectedMicDeviceId: deviceId })
  }

  // Preview voice using actual Gemini voice configuration without altering saved voice
  const handlePlayVoicePreview = async (voiceIdToPreview: string) => {
    if (previewingVoiceId === voiceIdToPreview) {
      stopVoicePreview()
      return
    }

    stopVoicePreview()
    setPreviewError(null)
    setIsLoadingPreview(true)
    setPreviewingVoiceId(voiceIdToPreview)

    try {
      if (!window.calby?.voice?.previewVoice) {
        throw new Error('Voice preview service is unavailable.')
      }

      const res = await window.calby.voice.previewVoice(voiceIdToPreview)
      if (!res.ok) {
        throw new Error(res.error?.message || 'Failed to generate voice preview')
      }

      const { audioBase64 } = res.data

      const player = new PcmPlayer(() => {
        setPreviewingVoiceId(null)
        setIsLoadingPreview(false)
        pcmPlayerRef.current = null
      })
      pcmPlayerRef.current = player

      setIsLoadingPreview(false)
      player.playChunk(audioBase64)
    } catch (err) {
      console.error('[VoiceSettings] Voice preview failed:', err)
      stopVoicePreview()
      const formatted = formatPreviewError(err)
      setPreviewError(formatted)
    }
  }

  // Real Microphone Test (2.5s analysis, releases stream cleanly)
  const startMicTest = async () => {
    setIsTestingMic(true)
    setMicTestResult(null)

    let stream: MediaStream | null = null
    let audioCtx: AudioContext | null = null

    try {
      const constraints = {
        audio:
          selectedMicId && selectedMicId !== 'default'
            ? { deviceId: { exact: selectedMicId } }
            : true
      }

      stream = await navigator.mediaDevices.getUserMedia(constraints)
      setPermissionStatus('granted')

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new AudioCtx()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let maxDetectedVolume = 0
      const startTime = Date.now()

      const checkVolume = () => {
        if (Date.now() - startTime > 2500) {
          // Finish test cleanly
          stream?.getTracks().forEach((t) => t.stop())
          void audioCtx?.close()
          setIsTestingMic(false)
          setMicTestResult(maxDetectedVolume > 4 ? 'working' : 'silent')
          return
        }

        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        if (avg > maxDetectedVolume) maxDetectedVolume = avg

        requestAnimationFrame(checkVolume)
      }

      requestAnimationFrame(checkVolume)
    } catch (err) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      if (audioCtx) {
        void audioCtx.close()
      }
      setIsTestingMic(false)
      const isPermissionErr =
        err instanceof Error &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      if (isPermissionErr) {
        setPermissionStatus('denied')
        setMicTestResult('permission_denied')
      } else {
        setMicTestResult('unavailable')
      }
    }
  }

  // Global Escape key listener to stop voice preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewingVoiceId) {
        stopVoicePreview()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewingVoiceId])

  const hasUnsavedVoiceChanges = selectedVoice !== savedVoice

  return (
    <div data-testid="voice-microphone-settings" className="space-y-6 select-none">
      {/* ── 1. VOICE SECTION ── */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Voice
          </h3>
          <p className="text-xs text-slate-400">
            Choose how Calby sounds.
          </p>
        </div>

        {/* Non-blocking preview error banner */}
        {previewError && (
          <div
            data-testid="preview-voice-error"
            className="px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20"
          >
            <span>{previewError}</span>
            <button
              type="button"
              onClick={() => setPreviewError(null)}
              className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Compact Voice Pills */}
        <div className="flex flex-wrap gap-2 pt-1" data-testid="voice-selector">
          {VOICE_CATALOG.map((voice) => {
            const isSelected = selectedVoice === voice.id
            const isSaved = savedVoice === voice.id
            const isPlaying = previewingVoiceId === voice.id
            const isLoading = isLoadingPreview && previewingVoiceId === voice.id

            return (
              <div
                key={voice.id}
                data-testid={`voice-option-${voice.id}`}
                onClick={() => handleVoiceChange(voice.id)}
                className={`inline-flex items-center rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB]/20 border-[#2563EB] text-[#38BDF8] shadow-sm'
                    : isSaved && hasUnsavedVoiceChanges
                    ? 'bg-white/5 border-slate-500 text-slate-200 hover:bg-white/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                {/* Play / Stop Icon Button */}
                <button
                  type="button"
                  data-testid={`preview-voice-${voice.id}`}
                  aria-label={isPlaying ? `Stop previewing ${voice.label}` : `Preview ${voice.label}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    void handlePlayVoicePreview(voice.id)
                  }}
                  className={`pl-2.5 pr-1 py-1.5 flex items-center justify-center transition-colors cursor-pointer ${
                    isPlaying ? 'text-rose-400' : isSelected ? 'text-[#38BDF8]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isLoading ? (
                    <span className="w-3 h-3 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <svg className="w-3 h-3 fill-current text-rose-400" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1.5" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Voice Label with status badges */}
                <div className="pl-1 pr-3 py-1.5 flex items-center gap-1.5">
                  <span>{voice.label}</span>
                  {isSelected && !hasUnsavedVoiceChanges && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" title="Current Voice" />
                  )}
                  {isSelected && hasUnsavedVoiceChanges && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#2563EB]/40 text-[#38BDF8] border border-[#2563EB]/60">
                      Selected
                    </span>
                  )}
                  {!isSelected && isSaved && hasUnsavedVoiceChanges && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-white/10 text-slate-400 border border-white/10">
                      Saved
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Save changes & Reset row ── */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="save-voice-button"
              disabled={!hasUnsavedVoiceChanges || isSavingVoice}
              onClick={() => void handleSaveVoice()}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                hasUnsavedVoiceChanges
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              {isSavingVoice ? 'Saving...' : 'Save changes'}
            </button>

            {selectedVoice !== 'Achird' && (
              <button
                type="button"
                data-testid="reset-voice-button"
                onClick={handleResetVoice}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer underline underline-offset-4"
              >
                Reset
              </button>
            )}

            {voiceSaveConfirmation && (
              <span
                data-testid="voice-save-confirmation"
                className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-in fade-in"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Voice updated
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Changes are saved on this device.
          </p>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--ds-border-subtle)' }} />

      {/* ── 2. MICROPHONE SECTION ── */}
      <div className="space-y-4" data-testid="microphone-settings">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Microphone
          </h3>
          <p className="text-xs text-slate-400">
            Choose the microphone Calby should use.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2">
          {isTestingMic ? (
            <span
              data-testid="mic-permission-badge"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#38BDF8]"
            >
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
              Testing microphone...
            </span>
          ) : permissionStatus === 'denied' ? (
            <span
              data-testid="mic-permission-badge"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Microphone permission required
            </span>
          ) : devices.length === 0 ? (
            <span
              data-testid="mic-permission-badge"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Microphone unavailable
            </span>
          ) : (
            <span
              data-testid="mic-permission-badge"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Microphone ready
            </span>
          )}
        </div>

        {/* Compact Microphone Device Dropdown */}
        <div className="relative">
          <select
            id="mic-device-select"
            data-testid="mic-device-select"
            value={selectedMicId}
            onChange={(e) => void handleMicDeviceChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-xs bg-[#0F172A] border border-white/10 hover:border-white/20 appearance-none focus:outline-none focus:border-[#38BDF8] focus-visible:ring-2 focus-visible:ring-[#38BDF8]/40 transition-colors cursor-pointer font-medium text-white"
          >
            {devices.length === 0 ? (
              <option value="default" className="bg-[#0F172A] text-white py-1">
                Default Microphone (System Audio Input)
              </option>
            ) : (
              devices.map((d, index) => (
                <option
                  key={d.deviceId || index}
                  value={d.deviceId}
                  className="bg-[#0F172A] text-white py-1"
                >
                  {d.label || `Microphone ${index + 1}`}
                </option>
              ))
            )}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Test Microphone action and inline result */}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            data-testid="test-microphone-button"
            onClick={() => void startMicTest()}
            disabled={isTestingMic}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            {isTestingMic ? 'Testing...' : 'Test Microphone'}
          </button>

          {/* Inline feedback */}
          {!isTestingMic && micTestResult === 'working' && (
            <span
              data-testid="mic-test-success"
              className="text-xs text-emerald-400 font-medium flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Microphone is working
            </span>
          )}

          {!isTestingMic && micTestResult === 'silent' && (
            <span
              data-testid="mic-test-silent"
              className="text-xs text-amber-400 font-medium flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              No microphone input detected
            </span>
          )}

          {!isTestingMic && micTestResult === 'permission_denied' && (
            <span
              data-testid="mic-test-denied"
              className="text-xs text-rose-400 font-medium flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Microphone permission is required
            </span>
          )}

          {!isTestingMic && micTestResult === 'unavailable' && (
            <span
              data-testid="mic-test-unavailable"
              className="text-xs text-rose-400 font-medium flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Selected microphone is unavailable
            </span>
          )}
        </div>
      </div>

      {/* ── 3. MICROPHONE AUTO-SAVE NOTE ── */}
      <div className="pt-2 text-center sm:text-left">
        <p className="text-xs text-slate-500 font-normal">
          Microphone selection is saved automatically.
        </p>
      </div>
    </div>
  )
}
