import type { FC } from 'react'
import type { CalendarEvent } from '../types'

interface CalendarEventCardProps {
  event: CalendarEvent
  onClick?: () => void
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    if (event.startDate) {
      const [year, month, day] = event.startDate.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' (All Day)'
    }
    return 'All Day'
  }

  if (event.startDateTime) {
    const start = new Date(event.startDateTime)
    const startTimeStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

    if (event.endDateTime) {
      const end = new Date(event.endDateTime)
      const endTimeStr = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      return `${startTimeStr} – ${endTimeStr}`
    }
    return startTimeStr
  }

  return 'Scheduled'
}

export const CalendarEventCard: FC<CalendarEventCardProps> = ({ event, onClick }) => {
  const timeDisplay = formatEventTime(event)
  const isNow = !event.allDay && event.startDateTime && event.endDateTime && (
    Date.now() >= new Date(event.startDateTime).getTime() &&
    Date.now() <= new Date(event.endDateTime).getTime()
  )

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-4 p-4 rounded-xl border bg-[#121826] hover:bg-[#162032] transition-all cursor-pointer select-none ${
        isNow ? 'border-[#38BDF8]/40 shadow-[0_0_12px_rgba(56,189,248,0.1)]' : 'border-[#1E293B] hover:border-[#334155]'
      }`}
    >
      {/* 3px Accent Bar */}
      <div
        className={`w-1 self-stretch rounded-full shrink-0 ${
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

        {/* Time and Location */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{timeDisplay}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1.5 truncate max-w-[200px]">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Meeting Link Chip */}
        {event.meetingUrl && (
          <div className="mt-3 flex items-center gap-2">
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
          </div>
        )}
      </div>
    </div>
  )
}