import type { CalendarEvent } from '../types'

/**
 * Validates whether a timezone identifier is supported by Intl.DateTimeFormat.
 * Returns the valid timezone string or undefined to gracefully fall back.
 */
export function getValidTimeZone(timeZone?: string | null): string | undefined {
  if (!timeZone || typeof timeZone !== 'string') return undefined
  const trimmed = timeZone.trim()
  if (!trimmed) return undefined
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: trimmed })
    return trimmed
  } catch {
    return undefined
  }
}

/**
 * Returns the YYYY-MM-DD date key for a CalendarEvent based on its explicit timezone,
 * calendar timezone, or system fallback. All-day events preserve their exact date string.
 */
export function getEventDateKey(event: CalendarEvent): string {
  if (event.allDay && event.startDate) {
    return event.startDate
  }
  if (event.startDateTime) {
    const d = new Date(event.startDateTime)
    const tz = getValidTimeZone(event.timeZone)
    try {
      const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      return dtf.format(d)
    } catch {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
  }
  return ''
}

/**
 * Returns the YYYY-MM-DD date key for a local JavaScript Date object.
 */
export function getDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Formats timeMain and timeSub for calendar event cards adhering to the event's timezone.
 */
export function formatEventTimes(event: CalendarEvent): { timeMain: string; timeSub?: string } {
  const tz = getValidTimeZone(event.timeZone)

  if (event.allDay) {
    if (event.startDate) {
      const [year, month, day] = event.startDate.split('-').map(Number)
      const date = new Date(year, month - 1, day, 12, 0, 0)
      return {
        timeMain: 'All Day',
        timeSub: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      }
    }
    return { timeMain: 'All Day' }
  }

  if (event.startDateTime) {
    const start = new Date(event.startDateTime)
    const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz })

    if (event.endDateTime) {
      const end = new Date(event.endDateTime)
      const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz })
      const durationMin = Math.round((end.getTime() - start.getTime()) / (60 * 1000))
      return {
        timeMain: startTimeStr,
        timeSub: `${startTimeStr} – ${endTimeStr}${durationMin > 0 ? ` · ${durationMin}m` : ''}`
      }
    }
    return { timeMain: startTimeStr }
  }

  return { timeMain: 'Scheduled' }
}

/**
 * Formats full human-readable date and time for the EventDetailsModal adhering to event timezone.
 */
export function formatEventFullDate(event: CalendarEvent): string {
  const tz = getValidTimeZone(event.timeZone)

  if (event.allDay && event.startDate) {
    const [y, m, d] = event.startDate.split('-').map(Number)
    const date = new Date(y, m - 1, d, 12, 0, 0)
    return (
      date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) + ' (All Day)'
    )
  }

  if (event.startDateTime) {
    const start = new Date(event.startDateTime)
    const dateStr = start.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: tz
    })
    const startTimeStr = start.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz
    })

    if (event.endDateTime) {
      const end = new Date(event.endDateTime)
      const endTimeStr = end.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr} · ${startTimeStr} – ${endTimeStr}`
    }
    return `${dateStr} · ${startTimeStr}`
  }

  return 'Scheduled Event'
}

/**
 * Checks whether an event is currently happening now based on instant comparison.
 */
export function isEventHappeningNow(event: CalendarEvent): boolean {
  if (event.allDay || !event.startDateTime || !event.endDateTime) return false
  const nowMs = Date.now()
  const startMs = new Date(event.startDateTime).getTime()
  const endMs = new Date(event.endDateTime).getTime()
  return nowMs >= startMs && nowMs <= endMs
}
