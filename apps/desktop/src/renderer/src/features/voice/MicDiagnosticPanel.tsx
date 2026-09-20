import { useState, type FC } from 'react'
import type { DiagnosticInfo } from './useVoiceSession'

interface MicDiagnosticPanelProps {
  diagnostics: DiagnosticInfo
  onSelectDevice: (deviceId: string) => Promise<void>
  onTestMicOnly: () => Promise<void>
  onStopMicOnly: () => void
  onSendTextTest: (text: string) => Promise<void>
  onFinishTurn: () => Promise<void>
  userTranscript: string
  assistantTranscript: string
}

export const MicDiagnosticPanel: FC<MicDiagnosticPanelProps> = ({
  diagnostics,
  onSelectDevice,
  onTestMicOnly,
  onStopMicOnly,
  onSendTextTest,
  onFinishTurn,
  userTranscript,
  assistantTranscript
}) => {
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(true)

  const handleMicToggle = async (): Promise<void> => {
    if (isTestingMic) {
      onStopMicOnly()
      setIsTestingMic(false)
    } else {
      setIsTestingMic(true)
      await onTestMicOnly()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white rounded-lg text-xs font-mono shadow-xl transition-all cursor-pointer"
      >
        🛠️ Show Mic Diagnostics
      </button>
    )
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 w-96 max-h-[85vh] bg-[#0A0E17]/95 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 font-mono shadow-2xl backdrop-blur-md overflow-y-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-white tracking-wide">Microphone Diagnostic Mode</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          type="button"
          className="text-slate-400 hover:text-white transition-colors"
          title="Minimize Panel"
        >
          ✕
        </button>
      </div>

      {/* 1. Microphone Device Selector */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-400 block">Microphone Device Selector</label>
        <select
          value={diagnostics.selectedDeviceId}
          onChange={(e) => void onSelectDevice(e.target.value)}
          className="w-full bg-[#121824] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="">Default Microphone ({diagnostics.micDeviceLabel})</option>
          {diagnostics.availableDevices.map((d, index) => (
            <option key={d.deviceId || index} value={d.deviceId}>
              {d.label || `Microphone Input ${index + 1}`} ({d.deviceId.slice(0, 8)}...)
            </option>
          ))}
        </select>
      </div>

      {/* 2. Microphone Status Grid */}
      <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#101622] rounded border border-slate-800/80 text-[11px]">
        <div>
          <span className="text-slate-500">Permission: </span>
          <span className={diagnostics.micPermission === 'granted' ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
            {diagnostics.micPermission}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Mic Status: </span>
          <span className={diagnostics.micStatus === 'connected' ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
            {diagnostics.micStatus}
          </span>
        </div>
        <div>
          <span className="text-slate-500">AudioContext: </span>
          <span className="text-slate-300">{diagnostics.audioContextState}</span>
        </div>
        <div>
          <span className="text-slate-500">Worklet: </span>
          <span className="text-slate-300">{diagnostics.audioWorkletState}</span>
        </div>
        <div>
          <span className="text-slate-500">Sample Rate: </span>
          <span className="text-slate-300">{diagnostics.sampleRate} Hz</span>
        </div>
        <div>
          <span className="text-slate-500">Channels: </span>
          <span className="text-slate-300">{diagnostics.channelCount} (mono)</span>
        </div>
      </div>

      {/* 3. Real Physical Microphone Level Meter */}
      <div className="space-y-1 bg-[#101622] p-2 rounded border border-slate-800/80">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400 font-medium">Real Physical Mic Level (RMS):</span>
          <span className="text-cyan-400 font-bold">{diagnostics.micRmsLevel.toFixed(3)}</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-75"
            style={{ width: `${Math.min(100, diagnostics.micRmsLevel * 100)}%` }}
          />
        </div>
      </div>

      {/* 4. Audio Sample Counters */}
      <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#101622] rounded border border-slate-800/80 text-[11px]">
        <div>
          <span className="text-slate-500">Mic PCM Produced: </span>
          <span className="text-cyan-400 font-medium">{diagnostics.pcmChunksProduced}</span>
        </div>
        <div>
          <span className="text-slate-500">Mic PCM Sent: </span>
          <span className="text-cyan-400 font-medium">{diagnostics.pcmChunksSent}</span>
        </div>
        <div>
          <span className="text-slate-500">Audio Accepted: </span>
          <span className="text-cyan-400 font-medium">{diagnostics.geminiInputAudioAccepted}</span>
        </div>
        <div>
          <span className="text-slate-500">Transcript Events: </span>
          <span className="text-emerald-400 font-medium">{diagnostics.inputTranscriptEvents}</span>
        </div>
      </div>

      {/* 5. Diagnostic Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => void handleMicToggle()}
          type="button"
          className={`flex-1 py-1.5 px-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
            isTestingMic
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 hover:bg-rose-500/30'
              : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30'
          }`}
        >
          {isTestingMic ? '⏹️ Stop Mic Test' : '🎙️ Test Mic Only'}
        </button>
        <button
          onClick={() => void onFinishTurn()}
          type="button"
          className="py-1.5 px-2 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 rounded text-xs cursor-pointer"
          title="Force explicit turn completion"
        >
          ⏹️ Finish Turn
        </button>
        <button
          onClick={() =>
            void onSendTextTest("Text diagnostic test: Please verify Gemini Live connection.")
          }
          type="button"
          className="w-full py-1 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-[11px] cursor-pointer"
        >
          💬 Test Gemini Text Prompt (Text Diagnostic Only)
        </button>
      </div>

      {/* 6. Gemini Live Status */}
      <div className="p-2 bg-[#101622] rounded border border-slate-800/80 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Gemini Live: </span>
          <span className={diagnostics.geminiStatus === 'Connected' ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
            {diagnostics.geminiStatus}
          </span>
        </div>
        <div className="truncate">
          <span className="text-slate-500">Last Event: </span>
          <span className="text-sky-300">{diagnostics.lastGeminiEvent}</span>
        </div>
        <div>
          <span className="text-slate-500">VAD / Turn State: </span>
          <span className="text-amber-300 font-medium">{diagnostics.vadState}</span>
        </div>
      </div>

      {/* 7. Transcript Preview */}
      <div className="p-2 bg-[#101622] rounded border border-slate-800/80 space-y-1 text-[11px]">
        <div className="truncate">
          <span className="text-slate-500">Input Transcript: </span>
          <span className="text-slate-200">{userTranscript || '(none)'}</span>
        </div>
        <div className="truncate">
          <span className="text-slate-500">Assistant Transcript: </span>
          <span className="text-slate-200">{assistantTranscript || '(none)'}</span>
        </div>
      </div>

      {/* 8. Playback Status */}
      <div className="p-2 bg-[#101622] rounded border border-slate-800/80 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Output Audio: </span>
          <span className="text-slate-300">24 kHz PCM</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Chunks Received: </span>
          <span className="text-cyan-400 font-medium">{diagnostics.outputChunksReceived}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Playback State: </span>
          <span className={diagnostics.outputPlaybackState === 'playing' ? 'text-cyan-300 font-medium' : 'text-slate-400'}>
            {diagnostics.outputPlaybackState}
          </span>
        </div>
      </div>
    </div>
  )
}
