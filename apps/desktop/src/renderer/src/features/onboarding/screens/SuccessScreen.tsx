import { useEffect, type FC } from 'react'

interface SuccessScreenProps {
  onBack: () => void
  onNext: () => void
}

export const SuccessScreen: FC<SuccessScreenProps> = ({ onBack, onNext }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        onNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext])

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden select-none">
      {/* Setup Step Indicator / Subheader Bar */}
      <nav aria-label="Setup Progress" className="h-10 px-8 flex items-center justify-between border-b border-slate-800/50 bg-[#0E1320]/60 text-xs shrink-0">
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="font-medium text-slate-300">Step 4 of 5</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400 font-medium">Model Connected</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-slate-800" />
        </div>
      </nav>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col justify-between px-10 py-6 relative z-10 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center text-center my-auto">
          {/* Glowing Emerald Badge */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-2xl" />
            <div className="absolute -inset-1 rounded-full bg-emerald-400/30 blur-md" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center glow-success ring-4 ring-emerald-500/20 border border-emerald-300/30">
              <svg aria-hidden="true" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="3.2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mb-2">
            Connected Successfully!
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-md">
            Your Gemini API key has been verified and encrypted. You&apos;re ready to activate Calby.
          </p>

          {/* Connected Service Card */}
          <div className="w-full mt-7">
            <div className="w-full bg-[#151C2C]/90 border border-slate-800 hover:border-slate-700/80 transition-all rounded-xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-black/20">
              {/* Left Side */}
              <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-lg bg-[#0F1420] border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                  <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.99 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>

                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-100 tracking-wide">Gemini API</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-sky-400 border border-sky-500/20">
                      Gemini 1.5 &amp; 2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Key stored in Secure local credential storage</p>
                </div>
              </div>

              {/* Right Side Status Pill */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                <div aria-label="Status: Connected" className="inline-flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 tracking-wide">Connected</span>
                </div>
              </div>
            </div>

            {/* Helper Note */}
            <div className="flex items-center justify-between px-2 pt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Calby will use your Gemini quota directly without intermediate proxies.
              </span>
              <button
                onClick={onBack}
                type="button"
                className="text-sky-400 hover:text-sky-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
              >
                Change Key
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <footer className="w-full pt-4 pb-2 border-t border-slate-800/60 flex items-center justify-between shrink-0">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/40 cursor-pointer"
            type="button"
          >
            Back
          </button>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 hidden sm:inline-block">Press Enter ↵ to proceed</span>
            <button
              onClick={onNext}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all duration-150 ease-in-out shadow-glow-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0A0D14] flex items-center space-x-2 cursor-pointer"
              type="button"
            >
              <span>Continue</span>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
