import type { FC } from 'react'

interface ActionResultCardProps {
  title?: string
  subtitle?: string
  onConnectCalendar?: () => void
  onDismiss?: () => void
}

export const ActionResultCard: FC<ActionResultCardProps> = ({
  title = 'Action completed',
  subtitle = 'Calby has taken care of it.',
  onConnectCalendar,
  onDismiss
}) => {
  const isDisconnectedCalendar =
    title.toLowerCase().includes('calendar disconnected') ||
    subtitle.toLowerCase().includes('connect google calendar') ||
    subtitle.toLowerCase().includes('calendar is not connected')

  return (
    <div className="relative z-10 max-w-md w-full px-4 flex flex-col items-center text-center space-y-4" data-purpose="action-result-container">
      {/* Result Card */}
      <div
        className={`w-full bg-[#0c121c]/90 backdrop-blur-md border rounded-2xl p-5 shadow-2xl shadow-black/50 flex flex-col items-start gap-3 text-left ${
          isDisconnectedCalendar ? 'border-cyan-500/30' : 'border-emerald-500/20'
        }`}
      >
        <div className="flex items-center space-x-3.5 w-full">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isDisconnectedCalendar
                ? 'bg-cyan-500/10 border-cyan-500/30 text-sky-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isDisconnectedCalendar ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
            )}
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-sm font-semibold text-slate-100 truncate">{title}</span>
            <span className="text-xs text-slate-400 mt-0.5">{subtitle}</span>
          </div>
        </div>

        {/* Optional Action Buttons if Calendar is disconnected */}
        {isDisconnectedCalendar && (
          <div className="flex items-center gap-2 pt-1">
            {onConnectCalendar && (
              <button
                onClick={onConnectCalendar}
                type="button"
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Connect Calendar
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#1E293B]/60 hover:bg-[#1E293B] text-slate-300 text-xs font-medium border border-slate-700/50 transition-all cursor-pointer"
              >
                Not now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Informative Subtext */}
      <span className="text-xs text-slate-500">
        {isDisconnectedCalendar
          ? 'You can connect Calendar in Settings at any time.'
          : 'Shows the result briefly, then returns to ready state.'}
      </span>
    </div>
  )
}
