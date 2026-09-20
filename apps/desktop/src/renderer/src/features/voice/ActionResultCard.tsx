import type { FC } from 'react'

interface ActionResultCardProps {
  title?: string
  subtitle?: string
}

export const ActionResultCard: FC<ActionResultCardProps> = ({
  title = 'Action completed',
  subtitle = 'Calby has taken care of it.'
}) => {
  return (
    <div className="relative z-10 max-w-md w-full px-4 flex flex-col items-center text-center space-y-4" data-purpose="action-result-container">
      {/* Result Card */}
      <div className="w-full bg-[#0c121c]/90 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 shadow-2xl shadow-black/50 flex items-center space-x-4">
        {/* Emerald Checkmark Icon */}
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
        </div>
        <div className="flex flex-col text-left overflow-hidden">
          <span className="text-sm font-semibold text-slate-100 truncate">{title}</span>
          <span className="text-xs text-slate-400 mt-0.5">{subtitle}</span>
        </div>
      </div>

      {/* Informative Subtext */}
      <span className="text-xs text-slate-500">
        Shows the result briefly, then returns to ready state.
      </span>
    </div>
  )
}
