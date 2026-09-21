import { useState, useEffect, useRef, type FC } from 'react'
import type { VoiceSettings, MicPermissionState } from '../types'

interface VoiceMicrophoneSettingsProps {
  voiceSettings?: VoiceSettings
  micState: MicPermissionState
  onUpdateVoice: (data: Partial<VoiceSettings>) => Promise<boolean>
  onOpenMicSettings: () => void
}

interface VoiceOption {
  id: string
  label: string
  pitch: number
  freq: number
}

const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Aoede', label: 'Friendly Female', pitch: 1.2, freq: 440 },
  { id: 'Puck', label: 'Calm Male', pitch: 0.9, freq: 220 },
  { id: 'Kore', label: 'Warm Female', pitch: 1.1, freq: 350 },
  { id: 'Fenrir', label: 'Deep Male', pitch: 0.75, freq: 160 },
  { id: 'Charon', label: 'Friendly Male', pitch: 0.95, freq: 260 }
]

const SPEED_OPTIONS = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' }
]

export const VoiceMicrophoneSettings: FC<VoiceMicrophoneSettingsProps> = ({
  voiceSettings,
  micState,
  onUpdateVoice,
  onOpenMicSettings
}) => {
  const [selectedVoice, setSelectedVoice] = useState(voiceSettings?.voiceName || 'Aoede')
  const [selectedSpeed, setSelectedSpeed] = useState(voiceSettings?.voiceSpeed || 'normal')
  const [selectedMicId, setSelectedMicId] = useState(voiceSettings?.selectedMicDeviceId || 'default')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  // Preview state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)

  // Mic test state
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [micTestResult, setMicTestResult] = useState<'working' | 'silent' | null>(null)
  const [micLevel, setMicLevel] = useState<number>(0)
  const micTestStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (voiceSettings) {
      if (voiceSettings.voiceName) setSelectedVoice(voiceSettings.voiceName)
      if (voiceSettings.voiceSpeed) setSelectedSpeed(voiceSettings.voiceSpeed)
      if (voiceSettings.selectedMicDeviceId) setSelectedMicId(voiceSettings.selectedMicDeviceId)
    }
  }, [voiceSettings])

  // Fetch audio input devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        if (navigator.mediaDevices?.enumerateDevices) {
          const allDevices = await navigator.mediaDevices.enumerateDevices()
          const audioInputs = allDevices.filter((d) => d.kind === 'audioinput')
          setDevices(audioInputs)
        }
      } catch (err) {
        console.warn('Unable to enumerate audio devices:', err)
      }
    }
    void fetchDevices()
  }, [])

  // Handle voice selection
  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId)
    await onUpdateVoice({ voiceName: voiceId })
  }

  // Handle speed change
  const handleSpeedChange = async (speed: string) => {
    setSelectedSpeed(speed)
    await onUpdateVoice({ voiceSpeed: speed })
  }

  // Handle mic device change
  const handleMicDeviceChange = async (deviceId: string) => {
    setSelectedMicId(deviceId)
    await onUpdateVoice({ selectedMicDeviceId: deviceId })
  }

  // Preview Voice audio synthesizer & speech synthesis
  const playVoicePreview = (voice: VoiceOption) => {
    if (playingVoiceId === voice.id) {
      stopVoicePreview()
      return
    }

    stopVoicePreview()
    setPlayingVoiceId(voice.id)

    // Play real speech saying: "Hi, I'm Calby. How can I assist you today?"
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const text = "Hi, I'm Calby. How can I assist you today?"
      const utterance = new SpeechSynthesisUtterance(text)

      utterance.pitch = voice.pitch
      if (selectedSpeed === 'slow') utterance.rate = 0.85
      else if (selectedSpeed === 'fast') utterance.rate = 1.25
      else utterance.rate = 1.0

      const synthVoices = window.speechSynthesis.getVoices()
      if (synthVoices.length > 0) {
        const isFemale = voice.label.toLowerCase().includes('female')
        const matched = synthVoices.find((v) =>
          isFemale
            ? (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Hazel') || v.name.includes('Google US English') || v.name.includes('Samantha'))
            : (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Mark') || v.name.includes('George') || v.name.includes('Alex'))
        ) || synthVoices[0]
        if (matched) utterance.voice = matched
      }

      utterance.onstart = () => setPlayingVoiceId(voice.id)
      utterance.onend = () => setPlayingVoiceId(null)
      utterance.onerror = () => setPlayingVoiceId(null)

      window.speechSynthesis.speak(utterance)
      return
    }

    // Fallback synthesizer tone pattern
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      oscRef.current = osc

      osc.type = 'sine'
      osc.frequency.setValueAtTime(voice.freq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(voice.freq * 1.25, ctx.currentTime + 0.3)
      osc.frequency.exponentialRampToValueAtTime(voice.freq * 1.5, ctx.currentTime + 0.6)
      osc.frequency.exponentialRampToValueAtTime(voice.freq, ctx.currentTime + 0.9)

      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 1.25)

      osc.onended = () => {
        setPlayingVoiceId(null)
      }
    } catch {
      setPlayingVoiceId(null)
    }
  }

  const stopVoicePreview = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop()
      } catch (err) {
        console.warn('Failed to stop oscillator:', err)
      }
      oscRef.current = null
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close()
      } catch (err) {
        console.warn('Failed to close audio context:', err)
      }
      audioCtxRef.current = null
    }
    setPlayingVoiceId(null)
  }

  // Mic test execution
  const startMicTest = async () => {
    setIsTestingMic(true)
    setMicTestResult(null)
    setMicLevel(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicId === 'default' ? true : { deviceId: { exact: selectedMicId } }
      })
      micTestStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioCtx()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let maxDetectedVolume = 0
      const startTime = Date.now()

      const checkVolume = () => {
        if (Date.now() - startTime > 3000) {
          // Finished 3s test
          stream.getTracks().forEach((t) => t.stop())
          void audioCtx.close()
          setIsTestingMic(false)
          setMicTestResult(maxDetectedVolume > 5 ? 'working' : 'silent')
          return
        }

        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        if (avg > maxDetectedVolume) maxDetectedVolume = avg
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)))

        requestAnimationFrame(checkVolume)
      }

      requestAnimationFrame(checkVolume)
    } catch {
      setIsTestingMic(false)
      setMicTestResult('silent')
    }
  }

  return (
    <div data-testid="voice-microphone-settings" className="space-y-6">
      {/* ── VOICE SECTION ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Voice
        </h3>

        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ds-text-secondary)' }}>
            Choose Calby&apos;s voice
          </label>

          <div className="flex flex-col gap-3" data-testid="voice-selector">
            {/* Voice Dropdown Select */}
            <div className="relative">
              <select
                data-testid="voice-select"
                value={selectedVoice}
                onChange={(e) => void handleVoiceChange(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-[#38BDF8] transition-all cursor-pointer font-medium"
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.id} value={voice.id} className="bg-[#0F172A] text-white py-1">
                    {voice.label} ({voice.id})
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Quick Voice Preview Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {VOICE_OPTIONS.map((voice) => {
                const isSelected = selectedVoice === voice.id
                const isPlaying = playingVoiceId === voice.id

                return (
                  <button
                    key={voice.id}
                    type="button"
                    data-testid={`preview-voice-${voice.id}`}
                    onClick={() => {
                      void handleVoiceChange(voice.id)
                      playVoicePreview(voice)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563EB]/20 border-[#2563EB] text-[#38BDF8]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping inline-block" />
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <span>▶</span>
                        <span>{voice.label}</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Voice speed */}
        <div className="pt-2">
          <label htmlFor="voice-speed-select" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ds-text-secondary)' }}>
            Voice speed
          </label>
          <select
            id="voice-speed-select"
            data-testid="voice-speed-select"
            value={selectedSpeed}
            onChange={(e) => void handleSpeedChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#1E293B] border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors cursor-pointer"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--ds-border-subtle)' }} />

      {/* ── MICROPHONE SECTION ── */}
      <div className="space-y-4" data-testid="microphone-settings">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Microphone
        </h3>

        {/* Permission status badge */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <span
              data-testid="mic-permission-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                micState === 'denied'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${micState === 'denied' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              {micState === 'denied' ? 'Microphone permission required' : '✓ Microphone ready'}
            </span>
          </div>

          <button
            type="button"
            data-testid="open-mic-settings-button"
            onClick={onOpenMicSettings}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
          >
            System Microphone Settings
          </button>
        </div>

        {/* Microphone Device Selector */}
        <div>
          <label htmlFor="mic-device-select" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ds-text-secondary)' }}>
            Current microphone
          </label>
          <select
            id="mic-device-select"
            data-testid="mic-device-select"
            value={selectedMicId}
            onChange={(e) => void handleMicDeviceChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#1E293B] border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors cursor-pointer"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            <option value="default">Default Microphone</option>
            {devices.map((d, index) => (
              <option key={d.deviceId || index} value={d.deviceId}>
                {d.label || `Microphone ${index + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Mic Test UX */}
        <div className="pt-1 flex items-center justify-between gap-4">
          <button
            type="button"
            data-testid="test-microphone-button"
            onClick={() => void startMicTest()}
            disabled={isTestingMic}
            className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isTestingMic ? 'Testing microphone...' : 'Test Microphone'}
          </button>

          {/* Level indicator / Result */}
          <div className="flex-1 max-w-xs">
            {isTestingMic && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400">{micLevel}%</span>
              </div>
            )}

            {!isTestingMic && micTestResult === 'working' && (
              <span data-testid="mic-test-success" className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                ✓ Microphone is working
              </span>
            )}

            {!isTestingMic && micTestResult === 'silent' && (
              <span data-testid="mic-test-error" className="text-xs text-[#EF4444] font-medium flex items-center gap-1">
                ! No microphone input detected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
