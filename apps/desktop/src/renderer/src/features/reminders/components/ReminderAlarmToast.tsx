import type { FC } from 'react'
import type { Reminder } from '../types'

interface ReminderAlarmToastProps {
  reminder: Reminder | null
  onSnooze: (id: string) => void
  onDismiss: (id: string) => void
  onClose: () => void
}

export const ReminderAlarmToast: FC<ReminderAlarmToastProps> = ({
  reminder,
  onSnooze,
  onDismiss,
  onClose
}) => {
  if (!reminder) return null

  const scheduledDate = new Date(reminder.scheduledAt)
  const timeFormatted = scheduledDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div
      className="fixed top-14 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 select-none"
      data-purpose="reminder-alarm-toast"
    >
      <article className="w-[360px] bg-[#0c121e]/95 backdrop-blur-2xl rounded-2xl border border-sky-400/30 shadow-[0_25px_50px_-12px_rgba(2,6,23,0.85),0_0_25px_rgba(56,189,248,0.25)] p-5 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-0.5 h-4 w-4 justify-center">
              <span className="w-[2.5px] h-2 bg-cyan-400 rounded-full" />
              <span className="w-[2.5px] h-3.5 bg-cyan-400 rounded-full mx-[1px]" />
              <span className="w-[2.5px] h-2 bg-cyan-400 rounded-full" />
            </div>
            <span className="text-white text-xs font-semibold tracking-wide">Calby Alert</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close toast"
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800/60 cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center text-center my-2">
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 rounded-full bg-cyan-500/25 blur-md" />
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-b from-[#112240] to-[#0A162B] border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h2 className="text-base font-bold text-white tracking-tight mt-1 mb-0.5">
            {reminder.title}
          </h2>
          <p className="text-slate-400 text-xs font-normal mb-1">It&apos;s time for your reminder.</p>
          <span className="text-xs font-mono text-slate-300/80">{timeFormatted}</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            onClick={() => onSnooze(reminder.id)}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-[#161F33] hover:bg-[#1C2842] border border-[#23314D] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            type="button"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Snooze</span>
          </button>

          <button
            onClick={() => onDismiss(reminder.id)}
            className="flex items-center justify-center py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-[0_4px_18px_rgba(2,132,199,0.45)] cursor-pointer"
            type="button"
          >
            Dismiss
          </button>
        </div>
      </article>
    </div>
  )
}