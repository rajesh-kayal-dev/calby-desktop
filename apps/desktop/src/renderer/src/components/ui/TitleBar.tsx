import type { FC } from 'react'

interface TitleBarProps {
  version?: string
  stepInfo?: {
    step: number
    totalSteps: number
    label: string
  }
}

export const TitleBar: FC<TitleBarProps> = ({ version = 'v1.0.0', stepInfo }) => {
  return (
    <header className="h-11 px-5 bg-[#090D15]/95 border-b border-border-subtle/80 flex items-center justify-between shrink-0 select-none drag-region z-30">
      {/* Brand & Icon */}
      <div className="flex items-center space-x-3 no-drag">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="4" cy="12" r="1.5" />
            <rect height="10" rx="1.25" width="2.5" x="7.5" y="7" />
            <rect height="16" rx="1.25" width="2.5" x="12" y="4" />
            <rect height="8" rx="1.25" width="2.5" x="16.5" y="8" />
            <circle cx="21" cy="12" r="1.5" />
          </svg>
        </div>
        <span className="text-xs font-semibold tracking-wide text-slate-300">Calby</span>
        <span className="text-[11px] text-slate-600 font-mono">{version}</span>
      </div>

      {/* Step Indicator Badge */}
      {stepInfo && (
        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-400 bg-[#131A29] px-3 py-1 rounded-full border border-border-subtle no-drag">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-slate-300">
            Step {stepInfo.step} of {stepInfo.totalSteps}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">{stepInfo.label}</span>
        </div>
      )}

      {/* Window Controls Visual Placeholder */}
      <div className="flex items-center space-x-2 text-slate-400 no-drag">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60" />
      </div>
    </header>
  )
}
