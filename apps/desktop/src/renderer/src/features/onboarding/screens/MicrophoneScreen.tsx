import { useState, useEffect, useRef, useCallback, type FC } from 'react'

interface MicrophoneScreenProps {
  onComplete: () => void
}

interface AudioDeviceItem {
  deviceId: string
  label: string
  type: 'bluetooth' | 'usb' | 'builtin' | 'default'
}

function getDeviceType(label: string): 'bluetooth' | 'usb' | 'builtin' | 'default' {
  const l = label.toLowerCase()
  if (
    l.includes('bluetooth') ||
    l.includes('hands-free') ||
    l.includes('headset') ||
    l.includes('airpod') ||
    l.includes('buds') ||
    l.includes('bose') ||
    l.includes('sony') ||
    l.includes('wh-') ||
    l.includes('wf-') ||
    l.includes('bt ') ||
    l.includes('wireless') ||
    l.includes('nb138a')
  ) {
    return 'bluetooth'
  }
  if (
    l.includes('usb') ||
    l.includes('yeti') ||
    l.includes('rode') ||
    l.includes('fifine') ||
    l.includes('hyperx') ||
    l.includes('shure') ||
    l.includes('elgato') ||
    l.includes('audio interface')
  ) {
    return 'usb'
  }
  if (
    l.includes('realtek') ||
    l.includes('internal') ||
    l.includes('built-in') ||
    l.includes('array') ||
    l.includes('integrated')
  ) {
    return 'builtin'
  }
  return 'default'
}

export const MicrophoneScreen: FC<MicrophoneScreenProps> = ({ onComplete }) => {
  const [devices, setDevices] = useState<AudioDeviceItem[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default')
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'error'>('prompt')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Real-time audio meter state
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [decibels, setDecibels] = useState<number>(-60)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Quick mic test recording / playback state
  const [testMode, setTestMode] = useState<'idle' | 'recording' | 'playing'>('idle')
  const [testCountdown, setTestCountdown] = useState<number>(3)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const testAudioRef = useRef<HTMLAudioElement | null>(null)

  // Active audio stream & analyzer refs
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Stop active stream & analyzer
  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAudioLevel(0)
    setDecibels(-60)
    setIsSpeaking(false)
  }, [])

  // Start live audio analyzer on a specific device
  const startAudioMonitoring = useCallback(
    async (deviceIdToUse: string): Promise<boolean> => {
      stopAudio()
      setErrorMessage(null)

      try {
        const constraints: MediaStreamConstraints = {
          audio:
            deviceIdToUse && deviceIdToUse !== 'default'
              ? { deviceId: { exact: deviceIdToUse } }
              : true,
          video: false
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        setPermissionState('granted')

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioCtx()
        audioContextRef.current = audioCtx

        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.4
        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateMeter = () => {
          if (!analyserRef.current) return

          analyserRef.current.getByteFrequencyData(dataArray)

          let sumSquares = 0
          for (let i = 0; i < dataArray.length; i++) {
            const val = dataArray[i] / 255
            sumSquares += val * val
          }
          const rms = Math.sqrt(sumSquares / dataArray.length)
          const normalized = Math.min(1, Math.max(0, rms * 2.8))
          setAudioLevel(normalized)

          // Decibel approximation (-60 dB to 0 dB)
          const dB = rms > 0.001 ? Math.round(20 * Math.log10(rms)) : -60
          setDecibels(dB)
          setIsSpeaking(normalized > 0.12)

          animationFrameRef.current = requestAnimationFrame(updateMeter)
        }

        updateMeter()
        return true
      } catch (err) {
        console.warn('[MicrophoneScreen] Failed to acquire audio stream:', err)
        stopAudio()
        const isDenied =
          err instanceof Error &&
          (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')

        if (isDenied) {
          setPermissionState('denied')
          setErrorMessage('Microphone access was denied. Please allow microphone permission in your OS settings.')
        } else {
          setPermissionState('error')
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Unable to connect to selected audio device. Please verify connection.'
          )
        }
        return false
      }
    },
    [stopAudio]
  )

  // Enumerate input devices
  const refreshDevices = useCallback(
    async (requestPermissionFirst = false) => {
      setIsScanning(true)
      try {
        if (requestPermissionFirst && navigator.mediaDevices?.getUserMedia) {
          try {
            const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            initialStream.getTracks().forEach((t) => t.stop())
            setPermissionState('granted')
          } catch {
            // Graceful fallback
          }
        }

        if (!navigator.mediaDevices?.enumerateDevices) {
          setDevices([
            { deviceId: 'default', label: 'Default Microphone (System Audio Input)', type: 'default' }
          ])
          return
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = allDevices.filter(
          (d) => d.kind === 'audioinput' && d.deviceId !== 'default'
        )

        if (audioInputs.length === 0) {
          setDevices([
            { deviceId: 'default', label: 'Default Microphone (System Audio Input)', type: 'default' }
          ])
          return
        }

        const formattedList: AudioDeviceItem[] = audioInputs.map((dev, index) => {
          const rawLabel = dev.label || ''
          const fallbackName =
            `Audio Input Device ${index + 1}`
          const label = rawLabel.trim() || fallbackName
          const type = getDeviceType(label)

          return {
            deviceId: dev.deviceId || 'default',
            label,
            type
          }
        })

        formattedList.unshift({
          deviceId: 'default',
          label: 'Default Microphone (System Audio Input)',
          type: 'default'
        })

        setDevices(formattedList)

        setSelectedDeviceId((prevId) => {
          if (prevId === 'default' || formattedList.some((d) => d.deviceId === prevId)) {
            return prevId
          }
          // Preserve a disconnected explicit device rather than changing the
          // user's choice to a different physical microphone.
          return prevId
        })
      } catch (err) {
        console.error('[MicrophoneScreen] Error enumerating devices:', err)
      } finally {
        setIsScanning(false)
      }
    },
    []
  )

  // Initialize
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        if (window.calby?.settings?.getConfig) {
          const res = await window.calby.settings.getConfig()
          if (res.ok && res.data?.voice?.selectedMicDeviceId && isMounted) {
            setSelectedDeviceId(res.data.voice.selectedMicDeviceId)
          }
        }
      } catch {
        // Continue
      }

      await refreshDevices(true)

      if (isMounted) {
        void startAudioMonitoring(selectedDeviceId)
      }
    }

    void init()

    const handleDeviceChange = () => {
      console.log('[MicrophoneScreen] Device change event detected')
      void refreshDevices(false)
    }

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    }

    return () => {
      isMounted = false
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
      }
      stopAudio()
    }
  }, [refreshDevices, startAudioMonitoring, stopAudio])

  // When selected device changes, restart audio monitoring
  const handleDeviceChange = async (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId)
    await startAudioMonitoring(newDeviceId)

    try {
      if (window.calby?.settings?.updateVoiceSettings) {
        await window.calby.settings.updateVoiceSettings({ selectedMicDeviceId: newDeviceId })
      }
    } catch (err) {
      console.warn('[MicrophoneScreen] Could not persist selected device:', err)
    }
  }

  // Quick 3-second recording and playback test
  const handleQuickMicTest = async () => {
    if (testMode === 'recording') return

    if (testMode === 'playing') {
      if (testAudioRef.current) {
        testAudioRef.current.pause()
        testAudioRef.current = null
      }
      setTestMode('idle')
      return
    }

    try {
      if (!streamRef.current) {
        const ok = await startAudioMonitoring(selectedDeviceId)
        if (!ok || !streamRef.current) return
      }

      audioChunksRef.current = []
      const recorder = new MediaRecorder(streamRef.current)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        testAudioRef.current = audio

        setTestMode('playing')
        audio.play()
        audio.onended = () => {
          setTestMode('idle')
          URL.revokeObjectURL(audioUrl)
          testAudioRef.current = null
        }
      }

      recorder.start()
      setTestMode('recording')
      setTestCountdown(3)

      let count = 3
      const timer = setInterval(() => {
        count -= 1
        setTestCountdown(count)
        if (count <= 0) {
          clearInterval(timer)
          if (recorder.state === 'recording') {
            recorder.stop()
          }
        }
      }, 1000)
    } catch (err) {
      console.error('[MicrophoneScreen] Mic record test failed:', err)
      setTestMode('idle')
    }
  }

  // Allow & Finish
  const handleAllowAndContinue = async () => {
    setIsSaving(true)
    try {
      if (window.calby?.settings?.updateVoiceSettings) {
        await window.calby.settings.updateVoiceSettings({ selectedMicDeviceId: selectedDeviceId })
      }
      stopAudio()
      onComplete()
    } catch (err) {
      console.error('[MicrophoneScreen] Failed to save mic settings:', err)
      stopAudio()
      onComplete()
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    stopAudio()
    onComplete()
  }

  // VU meter segments (14 segments)
  const totalSegments = 14
  const activeSegments = Math.round(audioLevel * totalSegments)

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col select-none bg-[#0B0F19] text-slate-100 overflow-hidden">
      {/* Scrollable Center Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 py-3 sm:py-5 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center my-auto">
          {/* Left Column: Icon & Pitch */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#162238] to-[#0E1726] border border-sky-500/30 flex items-center justify-center mb-3 icon-glow relative shrink-0">
              <div
                className={`absolute inset-0 rounded-2xl bg-sky-400/10 transition-all duration-200 ${
                  isSpeaking ? 'scale-110 bg-sky-400/25 ring-2 ring-sky-400/40' : 'animate-pulse'
                }`}
              />
              <svg
                aria-hidden="true"
                className={`w-7 h-7 relative z-10 transition-transform duration-150 ${
                  isSpeaking ? 'text-sky-300 scale-105' : 'text-[#38BDF8]'
                }`}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="23" />
                <line x1="8" x2="16" y1="23" y2="23" />
              </svg>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">
              Enable Microphone
            </h1>
            <p className="text-xs leading-relaxed text-slate-400 max-w-[340px] mb-3">
              Calby needs microphone access so you can speak hands-free and issue voice commands instantly.
            </p>

            <div className="flex flex-col gap-1.5 w-full max-w-[320px]">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time on-device voice detection</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Zero passive background recording</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Bluetooth headsets &amp; external mics supported</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Hardware Selector & Real-Time Mic Testing */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="bg-[#131A29]/95 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur flex flex-col gap-3">
              {/* Card Header & Permission Banner */}
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-sky-400 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-semibold text-slate-100">
                      Audio Input Hardware
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select your preferred microphone or Bluetooth headset
                    </p>
                  </div>
                </div>

                {/* Device Status Badge */}
                <div className="shrink-0 flex items-center">
                  {permissionState === 'granted' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  ) : permissionState === 'denied' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Device Selector */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="mic-select" className="font-medium text-slate-300 text-[11px]">
                    Input Device ({devices.length} available)
                  </label>
                  <button
                    type="button"
                    onClick={() => void refreshDevices(true)}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors cursor-pointer disabled:opacity-50"
                    title="Scan for new Bluetooth / USB audio devices"
                  >
                    <svg
                      className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>{isScanning ? 'Scanning...' : 'Refresh Devices'}</span>
                  </button>
                </div>

                <div className="relative">
                  <select
                    id="mic-select"
                    value={selectedDeviceId}
                    onChange={(e) => void handleDeviceChange(e.target.value)}
                    className="w-full bg-[#0D1424] border border-slate-700/80 rounded-lg py-2 pl-3 pr-10 text-xs text-slate-200 font-medium appearance-none cursor-pointer hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-colors"
                  >
                    {devices.length === 0 ? (
                      <option value="default">Default Microphone (System Audio Input)</option>
                    ) : (
                      devices.map((device) => {
                        const icon =
                          device.type === 'bluetooth'
                            ? '🎧 [Bluetooth] '
                            : device.type === 'usb'
                            ? '🎙️ [USB] '
                            : device.type === 'builtin'
                            ? '💻 [Built-in] '
                            : '🎙️ '
                        return (
                          <option key={device.deviceId} value={device.deviceId}>
                            {icon}
                            {device.label}
                          </option>
                        )
                      })
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Live Audio Level Meter & Real-time VU Visualizer */}
              <div className="bg-[#0A0E18] rounded-lg p-3 border border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full transition-colors duration-150 ${
                        isSpeaking
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                          : audioLevel > 0.02
                          ? 'bg-sky-400'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span className="font-medium text-slate-300 text-[11px]">
                      {isSpeaking
                        ? 'Speech Detected'
                        : audioLevel > 0.02
                        ? 'Mic Active (Listening)'
                        : 'Microphone Silent'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">
                      {decibels > -60 ? `${decibels} dB` : '-∞ dB'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {Math.round(audioLevel * 100)}%
                    </span>
                  </div>
                </div>

                {/* Multi-segment VU meter bar */}
                <div className="w-full h-2.5 bg-slate-900 rounded-md p-0.5 border border-slate-800 flex items-center gap-0.5">
                  {Array.from({ length: totalSegments }).map((_, i) => {
                    const isLit = i < activeSegments
                    let colorClass = 'bg-slate-800'
                    if (isLit) {
                      if (i < 8) colorClass = 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]'
                      else if (i < 12) colorClass = 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]'
                      else colorClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                    }
                    return (
                      <div
                        key={i}
                        className={`flex-1 h-full rounded-[2px] transition-all duration-75 ${colorClass}`}
                      />
                    )
                  })}
                </div>

                {/* Interactive Mic Test Controls */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[11px] text-slate-400">Speak naturally to test signal</span>

                  <button
                    type="button"
                    onClick={() => void handleQuickMicTest()}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                      testMode === 'recording'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : testMode === 'playing'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {testMode === 'recording' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        <span>Recording sample ({testCountdown}s)...</span>
                      </>
                    ) : testMode === 'playing' ? (
                      <>
                        <svg className="w-3 h-3 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>Playing voice sample...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Test 3s Voice Playback</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-900/50 rounded-lg p-2 text-rose-200 text-xs">
                  <svg className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                  </svg>
                  <div className="flex-1 text-[11px]">
                    <p className="leading-tight font-medium">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => void startAudioMonitoring(selectedDeviceId)}
                      className="mt-0.5 underline text-rose-300 hover:text-white cursor-pointer"
                    >
                      Retry device connection
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="flex items-start gap-2 bg-blue-950/20 border border-blue-900/30 rounded-lg p-2 text-slate-400 text-xs">
                <svg className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="leading-relaxed text-[11px]">
                  <strong className="text-slate-200 font-medium">Privacy Assurance:</strong> Calby processes audio only when activated. You can change input devices anytime in Settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Action Footer: Always visible, never cut off */}
      <footer className="shrink-0 border-t border-slate-800/80 bg-[#0B0F19] px-4 sm:px-8 lg:px-12 py-3 z-20">
        <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="order-2 sm:order-1 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all duration-150 focus:outline-none cursor-pointer"
            type="button"
          >
            Skip for now
          </button>

          <div className="order-1 sm:order-2 flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => void handleAllowAndContinue()}
              disabled={isSaving}
              className="w-full sm:w-auto px-7 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              type="button"
            >
              {isSaving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
              <span>{permissionState === 'granted' ? 'Continue with Selected Mic' : 'Allow Microphone'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
