import type { FC } from 'react'
import type { Reminder } from '../types'

interface ReminderCardProps {
  reminder: Reminder
  isHighlighted?: boolean
  onComplete: (id: string) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (id: string) => void
}

export const ReminderCard: FC<ReminderCardProps> = ({
  reminder,
  isHighlighted = false,
  onComplete,
  onEdit,
  onDelete
}) => {
  const isCompleted = reminder.status === 'completed' || reminder.status === 'dismissed'

  const dateObj = new Date(reminder.scheduledAt)
  const timeFormatted = dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Calculate relative time string
  const getRelativeTimeString = (): string => {
    if (isCompleted) {
      return 'Completed'
    }

    const diffMs = dateObj.getTime() - Date.now()
    if (diffMs <= 0) {
      return 'Due now'
    }

    const diffMins = Math.round(diffMs / (60 * 1000))
    if (diffMins < 60) {
      return `In ${diffMins} min${diffMins === 1 ? '' : 's'}`
    }

    const diffHours = Math.round(diffMins / 60)
    if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours === 1 ? '' : 's'}`
    }

    const diffDays = Math.round(diffHours / 24)
    return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`
  }

  const relativeTime = getRelativeTimeString()

  return (
    <article
      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group select-none ${
        isHighlighted
          ? 'bg-[#162238] border border-sky-400 ring-2 ring-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
          : 'bg-[#0C101A] hover:bg-[#0e1320] border border-[#1E293B]'
      }`}
      data-purpose="reminder-card"
      data-highlighted={isHighlighted ? 'true' : undefined}
      data-reminder-id={reminder.id}
    >
      <div className="flex items-center space-x-4 min-w-0">
        {/* Radio / Circle Checkbox */}
        <button
          onClick={() => onComplete(reminder.id)}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Completed' : 'Mark complete'}
          className={`w-4 h-4 rounded-full border transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
            isCompleted
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
              : isHighlighted
              ? 'border-sky-400 bg-sky-400/10'
              : 'border-slate-500 hover:border-[#38BDF8]'
          }`}
          type="button"
        >
          {isCompleted && (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Time Tag */}
        <span
          className={`text-xs font-semibold w-16 tracking-tight shrink-0 font-mono ${
            isCompleted ? 'text-slate-500 line-through' : isHighlighted ? 'text-sky-300' : 'text-slate-200'
          }`}
        >
          {timeFormatted}
        </span>

        {/* Details: Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 truncate">
          <span
            className={`text-xs font-semibold truncate transition-colors ${
              isCompleted
                ? 'text-slate-500 line-through'
                : isHighlighted
                ? 'text-sky-100 font-bold'
                : 'text-white group-hover:text-[#38BDF8]'
            }`}
          >
            {reminder.title}
          </span>

          <div
            className={`flex items-center space-x-1 text-[11px] font-medium shrink-0 ${
              isCompleted
                ? 'text-slate-500'
                : reminder.status === 'triggered'
                ? 'text-amber-400'
                : 'text-sky-400/90'
            }`}
          >
            {reminder.alarmEnabled && !isCompleted && (
              <svg className="w-3 h-3 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            )}
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Edit / Delete */}
      <div className="flex items-center space-x-2 text-slate-400 shrink-0 ml-2">
        {!isCompleted && (
          <button
            onClick={() => onEdit(reminder)}
            className="p-1 hover:text-white rounded hover:bg-[#111622] transition-colors cursor-pointer"
            title="Edit reminder"
            type="button"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        )}

        <button
          onClick={() => onDelete(reminder.id)}
          className="p-1 hover:text-rose-400 rounded hover:bg-[#111622] transition-colors cursor-pointer"
          title="Delete reminder"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>
    </article>
  )
}
