import type { FC } from 'react'

interface WelcomeScreenProps {
  onNext: () => void
}

export const WelcomeScreen: FC<WelcomeScreenProps> = ({ onNext }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 relative z-20 overflow-hidden select-none">
      {/* Ambient Hero Visual Background */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none horizon-silhouette -z-10">
        <svg
          className="absolute bottom-0 left-0 right-0 w-full opacity-20 pointer-events-none"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 1000 240"
        >
          <path
            d="M0,240 L0,160 L140,90 L260,160 L410,70 L550,140 L700,80 L850,150 L1000,90 L1000,240 Z"
            fill="#1e293b"
          />
          <path
            d="M0,240 L0,190 L180,120 L320,180 L470,110 L620,170 L770,120 L910,170 L1000,135 L1000,240 Z"
            fill="#0C101A"
          />
        </svg>
      </div>

      {/* 2-Column Wide Desktop Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
        {/* Left Hero Column: Brand, Soundwave & Main Headings */}
        <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left">
          {/* Calby Brand Logo */}
          <div className="mb-6">
            <img src="/logo.png" alt="Calby" className="h-16 object-contain" />
          </div>

          {/* Typography Heading */}
          <h1 className="sr-only">Calby</h1>
          <p className="text-lg text-slate-400 font-normal max-w-sm">A more capable you.</p>

          <div className="mt-8 hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>Desktop Assistant • Setup Ready</span>
          </div>
        </div>

        {/* Right Column: Capability Highlight Panels */}
        <div className="md:col-span-6 space-y-3.5">
          {/* Feature 1: Talk naturally */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0C101A]/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors backdrop-blur-sm shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#121826] border border-slate-700/60 flex items-center justify-center shrink-0 text-[#38BDF8] shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3v6a3 3 0 003 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 leading-snug">Talk naturally</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-0.5">Just speak. Calby understands.</p>
            </div>
          </div>

          {/* Feature 2: Get things done */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0C101A]/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors backdrop-blur-sm shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#121826] border border-slate-700/60 flex items-center justify-center shrink-0 text-[#38BDF8] shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 leading-snug">Get things done</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-0.5">Reminders, calendar, memory and more.</p>
            </div>
          </div>

          {/* Feature 3: Your data stays on your device */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#0C101A]/80 border border-slate-800/80 hover:border-slate-700/80 transition-colors backdrop-blur-sm shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#121826] border border-slate-700/60 flex items-center justify-center shrink-0 text-[#38BDF8] shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 leading-snug">Your data stays on your device</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-0.5">Private, secure, and in your control.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Desktop Action Footer Section */}
      <footer className="pt-6 border-t border-slate-800/50 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-1.5 rounded-full bg-[#38BDF8]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
          <span className="text-xs font-medium text-slate-500">Step 1 of 5</span>
        </div>

        <button
          onClick={onNext}
          className="px-7 h-11 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2.5 transition duration-150 btn-glow focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          type="button"
        >
          <span>Get Started</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </footer>
    </div>
  )
}
