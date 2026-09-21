import { useState, useEffect, type FC } from 'react'
import type { CalendarEvent } from '../types'
import { formatEventFullDate } from '../utils/dateTime'

interface EventDetailsModalProps {
  event: CalendarEvent | null
  onClose: () => void
  onSetReminder?: (event: CalendarEvent) => void
}

export const EventDetailsModal: FC<EventDetailsModalProps> = ({ event, onClose, onSetReminder }) => {
  const [reminderSaved, setReminderSaved] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!event) return null

  const handleReminderClick = (): void => {
    if (onSetReminder && event) {
      onSetReminder(event)
      setReminderSaved(true)
      setTimeout(() => setReminderSaved(false), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event?.title || 'Event Details'}
        className="w-full max-w-lg bg-[#151C2C] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1E293B]">
          <div className="flex-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#38BDF8]">
              {event.calendarSummary || 'Google Calendar'}
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-1 leading-snug">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E273D] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-4 text-xs text-slate-300">
          {/* Time */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#0F1420] text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Date & Time</span>
              <span className="text-slate-200 font-medium">{formatEventFullDate(event)}</span>
              {event.timeZone && (
                <span className="text-slate-500 block text-[11px] mt-0.5">Timezone: {event.timeZone}</span>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#0F1420] text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Location</span>
                <span className="text-slate-200 font-medium">{event.location}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="p-3.5 rounded-xl bg-[#0F1420] border border-[#1E293B] text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {event.description}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#1E293B] flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {event.meetingUrl && (
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Join Meeting</span>
              </a>
            )}

            {onSetReminder && (
              <button
                onClick={handleReminderClick}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  reminderSaved
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#1E293B]/60 hover:bg-[#1E293B] border-slate-700/50 text-slate-300 hover:text-sky-300'
                }`}
              >
                {reminderSaved ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Reminder Set</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>Set Reminder</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-[#1E293B]/60 hover:bg-[#1E293B] text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                Open in Google Calendar
              </a>
            )}
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-lg bg-[#1E273D] hover:bg-[#25324E] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
