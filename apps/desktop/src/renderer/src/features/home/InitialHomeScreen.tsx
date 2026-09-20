import { useState, type FC } from 'react'

interface InitialHomeScreenProps {
  onResetSetup?: () => void
}

export const InitialHomeScreen: FC<InitialHomeScreenProps> = ({ onResetSetup }) => {
  const [isResetting, setIsResetting] = useState(false)

  const handleDisconnect = async (): Promise<void> => {
    try {
      setIsResetting(true)
      if (window.calby?.auth) {
        await window.calby.auth.clearKey()
      }
      if (onResetSetup) {
        onResetSetup()
      }
    } catch (err) {
      console.error('Failed to reset key:', err)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 relative z-20 overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-500/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-48 left-1/2 -translate-x-1/2 w-[480px] h-[280px] bg-blue-500/5 rounded-full blur-3xl" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Gemini Connected</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Phase 1 • Setup Complete
        </div>
      </div>

      {/* Center Home Focal Area: Voice Orb & Greeting */}
      <div className="max-w-xl mx-auto w-full flex flex-col items-center text-center my-auto z-10">
        {/* Voice Orb (Phase 1 Idle State) */}
        <div className="relative mb-8 group cursor-default">
          {/* Subtle Ambient Rings */}
          <div className="absolute -inset-6 rounded-full bg-sky-500/10 blur-xl animate-pulse" />
          <div className="absolute -inset-1 rounded-full bg-sky-400/20 blur-sm" />

          {/* Orb Core Container */}
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#151C2C] to-[#0A0D14] border border-sky-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.2)]">
            {/* Center Soundwave Pulse */}
            <div className="flex items-center space-x-1 text-sky-400">
              <span className="w-1 h-3 bg-sky-400 rounded-full animate-pulse" />
              <span className="w-1 h-6 bg-sky-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-9 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-6 bg-sky-300 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-3 bg-sky-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Greeting & Info */}
        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-2">
          Calby is ready.
        </h1>
        <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-md mb-8">
          Your assistant is initialized with local-first security and Gemini intelligence.
        </p>

        {/* Status Dashboard Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#121826]/90 border border-slate-800 text-left">
            <div className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">AI Service</div>
            <div className="text-sm font-medium text-slate-200 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121826]/90 border border-slate-800 text-left">
            <div className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">Storage</div>
            <div className="text-sm font-medium text-slate-200 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              OS-Secured
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121826]/90 border border-slate-800 text-left">
            <div className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">Next Phase</div>
            <div className="text-sm font-medium text-slate-200 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Voice Interaction
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Controls */}
      <footer className="pt-4 border-t border-slate-800/50 flex items-center justify-between z-10">
        <div className="text-xs text-slate-500">
          Calby Desktop • Local-first Assistant
        </div>

        {onResetSetup && (
          <button
            onClick={handleDisconnect}
            disabled={isResetting}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
            type="button"
          >
            {isResetting ? 'Disconnecting...' : 'Reset API Key'}
          </button>
        )}
      </footer>
    </div>
  )
}
