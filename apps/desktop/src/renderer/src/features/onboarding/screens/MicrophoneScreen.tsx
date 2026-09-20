import type { FC } from 'react'

interface MicrophoneScreenProps {
  onComplete: () => void
}

export const MicrophoneScreen: FC<MicrophoneScreenProps> = ({ onComplete }) => {
  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden select-none">
      {/* Setup Progress Header */}
      <div className="px-8 pt-5 pb-3 border-b border-slate-800/50 flex items-center justify-between shrink-0 bg-[#0B0F19]">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/10 text-sky-400 border border-sky-500/20">
            Step 5 of 5
          </span>
          <span className="text-xs text-slate-400 font-medium">Hardware &amp; Voice Permissions</span>
        </div>

        {/* Progress Indicator Dots */}
        <div aria-label="Setup progress: step 5 of 5" className="flex items-center gap-1.5">
          <span className="w-6 h-1.5 rounded-full bg-blue-500" />
          <span className="w-6 h-1.5 rounded-full bg-blue-500" />
          <span className="w-6 h-1.5 rounded-full bg-blue-500" />
          <span className="w-6 h-1.5 rounded-full bg-blue-500" />
          <span className="w-8 h-1.5 rounded-full bg-sky-400" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 px-8 lg:px-12 py-6 overflow-y-auto flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
          {/* Left Column: Visual Emblem & Pitch */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#162238] to-[#0E1726] border border-sky-500/30 flex items-center justify-center mb-5 icon-glow relative">
              <div className="absolute inset-0 rounded-2xl bg-sky-400/10 animate-pulse" />
              <svg
                aria-hidden="true"
                className="w-8 h-8 sm:w-9 sm:h-9 text-[#38BDF8] relative z-10"
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

            <h1 className="text-2xl lg:text-[26px] font-bold text-white tracking-tight mb-2">
              Enable Microphone
            </h1>
            <p className="text-[14px] leading-relaxed text-slate-400 max-w-[340px] mb-5">
              Calby needs access to your microphone so you can talk naturally and issue voice commands instantly.
            </p>

            <div className="flex flex-col gap-2 w-full max-w-[320px]">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time on-device voice detection</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Zero passive background recording</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant hotkey or push-to-talk toggling</span>
              </div>
            </div>
          </div>

          {/* Right Column: Permission Card & Device Selector */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-[#131A29]/90 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-xl backdrop-blur flex flex-col gap-4">
              {/* Prompt Header */}
              <div className="flex items-start gap-3.5 pb-3 border-b border-slate-800/80">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-sky-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Allow Calby to use your microphone?
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your operating system provides secure hardware audio access.
                  </p>
                </div>
              </div>

              {/* Device Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Input Device</span>
                  <span className="text-[11px] text-sky-400 font-mono">Status: Ready</span>
                </label>
                <div className="relative">
                  <select
                    defaultValue="default"
                    className="w-full bg-[#0D1424] border border-slate-700/70 rounded-lg py-2.5 px-3.5 text-xs text-slate-200 font-medium appearance-none cursor-pointer hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                  >
                    <option value="default">Default Microphone (System Audio Input)</option>
                    <option value="external">External Audio Device</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Input Level Preview Bar */}
              <div className="bg-[#0A0E18] rounded-lg p-3 border border-slate-800/70 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Input Signal Level
                  </span>
                  <span className="font-mono text-slate-500">-28 dB</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex items-center gap-0.5 p-0.5">
                  <div className="h-full rounded-sm bg-emerald-400 w-1/4" />
                  <div className="h-full rounded-sm bg-emerald-400 w-1/6" />
                  <div className="h-full rounded-sm bg-emerald-400/40 w-1/12" />
                  <div className="h-full rounded-sm bg-slate-700 w-1/12" />
                  <div className="h-full rounded-sm bg-slate-700 w-1/12" />
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="flex items-start gap-2.5 bg-blue-950/25 border border-blue-900/30 rounded-lg p-3 text-slate-400 text-xs">
                <svg className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="leading-relaxed">
                  <strong className="text-slate-200 font-medium">Privacy Assurance:</strong> Audio is only processed
                  when Calby is actively listening. You can change this anytime in Settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <footer className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <button
            onClick={onComplete}
            className="order-2 sm:order-1 px-5 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl transition-all duration-150 focus:outline-none cursor-pointer"
            type="button"
          >
            Skip for now
          </button>

          <div className="order-1 sm:order-2 flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onComplete}
              className="w-full sm:w-auto px-7 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Allow Microphone</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
