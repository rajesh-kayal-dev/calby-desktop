import type { FC, MouseEvent } from 'react'
import type { CalendarEvent } from '../types'
import { formatEventTimes, isEventHappeningNow } from '../utils/dateTime'

interface CalendarEventCardProps {
  event: CalendarEvent
  onClick?: () => void
  onSetReminder?: (event: CalendarEvent) => void
}

export const CalendarEventCard: FC<CalendarEventCardProps> = ({ event, onClick, onSetReminder }) => {
  const { timeMain, timeSub } = formatEventTimes(event)
  const isNow = isEventHappeningNow(event)

  const handleSetReminderClick = (e: MouseEvent): void => {
    e.stopPropagation()
    if (onSetReminder) {
      onSetReminder(event)
    }
  }

  return (
    <div
      onClick={onClick}
      data-testid={`calendar-event-card-${event.id}`}
      className={`group relative flex items-start gap-4 p-4 rounded-xl border bg-[#121826] hover:bg-[#162032] transition-all cursor-pointer select-none ${
        isNow
          ? 'border-[#38BDF8]/40 shadow-[0_0_16px_rgba(56,189,248,0.12)]'
          : 'border-[#1E293B] hover:border-[#334155]'
      }`}
    >
      {/* Time Column */}
      <div className="flex flex-col items-start min-w-[76px] shrink-0 pt-0.5">
        <span className={`font-mono text-sm font-bold tracking-tight ${isNow ? 'text-[#38BDF8]' : 'text-slate-200'}`}>
          {timeMain}
        </span>
        {timeSub && (
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">
            {timeSub}
          </span>
        )}
      </div>

      {/* Vertical divider accent bar */}
      <div
        className={`w-[3px] self-stretch rounded-full shrink-0 ${
          isNow ? 'bg-[#38BDF8]' : event.allDay ? 'bg-indigo-400' : 'bg-blue-500'
        }`}
      />

      {/* Main Event Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-[#38BDF8] transition-colors">
            {event.title}
          </h4>
          {isNow && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[10px] font-semibold text-[#38BDF8] animate-pulse">
              Happening Now
            </span>
          )}
        </div>

        {/* Location & Summary */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
          {event.location && (
            <div className="flex items-center gap-1.5 truncate max-w-[220px]">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.calendarSummary && (
            <span className="text-[11px] text-slate-500 truncate">
              {event.calendarSummary}
            </span>
          )}
        </div>

        {/* Actions Row: Meeting Link & Set Reminder */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {event.meetingUrl && (
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2563EB]/15 hover:bg-[#2563EB]/30 border border-[#2563EB]/30 text-[#38BDF8] hover:text-white text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Join Meeting</span>
            </a>
          )}

          {onSetReminder && (
            <button
              onClick={handleSetReminderClick}
              type="button"
              data-testid={`set-reminder-button-${event.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700/50 bg-[#1E293B]/60 hover:bg-[#1E293B] text-slate-300 hover:text-sky-300 text-xs font-medium transition-colors cursor-pointer"
              title="Set a Calby reminder for this meeting"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Set Reminder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
