import type { FC } from 'react'

export const ValidationScreen: FC = () => {
  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden select-none">
      {/* Stepper Header */}
      <div className="px-10 pt-6 pb-3 flex items-center justify-between border-b border-slate-800/40 bg-gradient-to-b from-[#0c121e] to-transparent shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Step 3 of 5
          </span>
          <span className="text-xs font-medium text-slate-400">· Validating Credentials</span>
        </div>

        <div aria-label="Progress tracker" className="flex items-center gap-2">
          <div className="h-1.5 w-8 rounded-full bg-sky-500" />
          <div className="h-1.5 w-8 rounded-full bg-sky-500" />
          <div className="h-1.5 w-8 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
          <div className="h-1.5 w-8 rounded-full bg-slate-800" />
          <div className="h-1.5 w-8 rounded-full bg-slate-800" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between px-10 py-8 text-center relative z-10 overflow-y-auto">
        {/* Header */}
        <section className="flex flex-col items-center max-w-xl mx-auto pt-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-snug">
            Connecting...
          </h1>
          <p className="text-base text-slate-400 mt-2 font-normal leading-relaxed max-w-md">
            Validating your API key and setting up Calby.
          </p>
        </section>

        {/* Center Circular Loader */}
        <section className="relative flex flex-col items-center justify-center my-auto py-6">
          <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-sky-500/10 via-blue-600/10 to-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="relative w-36 h-36 flex items-center justify-center spinner-glow">
            <svg className="w-full h-full spinner-ring" fill="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="calbySpinnerGradientWide" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
                  <stop offset="55%" stopColor="#2563EB" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" fill="none" r="41" stroke="#1e293b" strokeOpacity="0.5" strokeWidth="3" />
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="41"
                stroke="url(#calbySpinnerGradientWide)"
                strokeDasharray="195 65"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8] animate-pulse" />
            </div>
          </div>
        </section>

        {/* Status Checklist Card */}
        <section className="w-full max-w-md flex flex-col items-center gap-4 pb-2">
          <div className="w-full bg-[#111726]/80 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col gap-2.5 text-left">
            {/* Step 1: Verifying API key */}
            <div className="flex items-center justify-between px-2.5 py-1 text-xs">
              <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span>Verifying API key</span>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Connected
              </span>
            </div>

            <div className="h-px bg-slate-800/70 w-full" />

            {/* Step 2: Connecting to Gemini */}
            <div className="flex items-center justify-between px-2.5 py-1 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300 font-medium">
                <div className="w-4 h-4 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                </div>
                <span>Connecting to Gemini</span>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                in progress
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-slate-500 font-normal tracking-wide">
            This will only take a few seconds.
          </p>
        </section>
      </main>
    </div>
  )
}
