import type { FC } from 'react'
import type { Reminder } from '../types'

interface ReminderAlarmSurfaceProps {
  reminder: Reminder | null
  onStop: (id: string) => void
  onSnooze: (id: string) => void
  onComplete: (id: string) => void
}

export const ReminderAlarmSurface: FC<ReminderAlarmSurfaceProps> = ({
  reminder,
  onStop,
  onSnooze,
  onComplete
}) => {
  if (!reminder) return null

  const scheduledDate = new Date(reminder.scheduledAt)
  const timeFormatted = scheduledDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050811]/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      data-purpose="reminder-alarm-surface"
      data-testid="reminder-alarm-surface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-reminder-title"
    >
      <article className="w-full max-w-md bg-[#0C121E] border border-cyan-500/40 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(56,189,248,0.25)] p-6 text-center transform transition-all animate-in zoom-in-95 duration-200">
        {/* Animated Calby Alarm Ringing Indicator */}
        <div className="relative flex items-center justify-center my-3">
          <div className="absolute w-20 h-20 rounded-full bg-cyan-500/20 animate-ping opacity-75" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#13233D] to-[#0A162B] border border-cyan-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.35)]">
            <svg
              className="w-8 h-8 text-cyan-400 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Header Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Reminder</span>
        </div>

        {/* Reminder Title */}
        <h2
          id="alarm-reminder-title"
          className="text-2xl font-bold text-white tracking-tight mt-1 mb-1 break-words"
        >
          {reminder.title}
        </h2>

        {/* Time */}
        <p className="text-sm font-mono text-slate-400 mb-6">
          Scheduled for {timeFormatted}
        </p>

        {/* Main Action: Primary [ Stop alarm ] Button */}
        <div className="space-y-2.5">
          <button
            onClick={() => onStop(reminder.id)}
            data-testid="stop-alarm-button"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-[0_4px_25px_rgba(6,182,212,0.45)] transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            Stop alarm
          </button>

          {/* Secondary Actions: Snooze & Mark Complete */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onSnooze(reminder.id)}
              data-testid="snooze-alarm-button"
              className="py-2.5 px-4 rounded-xl bg-[#151D2E] hover:bg-[#1B273E] border border-[#223048] text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              type="button"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Snooze 5m</span>
            </button>

            <button
              onClick={() => onComplete(reminder.id)}
              data-testid="complete-alarm-button"
              className="py-2.5 px-4 rounded-xl bg-[#151D2E] hover:bg-[#1B273E] border border-[#223048] text-slate-300 hover:text-emerald-400 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              type="button"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Complete</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
