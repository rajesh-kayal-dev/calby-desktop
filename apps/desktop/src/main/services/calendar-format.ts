import type { CalendarEvent } from './google-calendar.service'

/**
 * Pure helpers that normalize calendar data before it reaches the voice model.
 *
 * Goals:
 * - Never hand the LLM a bare ISO timestamp to interpret: always include the
 *   timezone and a human-readable rendering computed with Intl.
 * - Keep reminder information (lead times) in its own field so a reminder can
 *   never be mistaken for the event start time.
 * - Respect the user's timezone (e.g. Asia/Kolkata) whenever an event has no
 *   timezone of its own.
 */

export interface GoogleReminderOverride {
  method: string
  minutesBefore: number | null
}

export interface NormalizedReminders {
  useDefault: boolean
  overrides: GoogleReminderOverride[]
}

export interface NormalizedCalendarEvent {
  id: string
  title: string
  allDay: boolean
  startDateTime: string | null
  endDateTime: string | null
  startDate: string | null
  endDate: string | null
  timeZone: string
  startHumanReadable: string
  endHumanReadable: string
  location: string | null
  meetingUrl: string | null
  /** Lead-time reminders only — NEVER an event start time. */
  reminders: NormalizedReminders | null
}

/** The operating system timezone of the user running Calby. */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Formats an instant as e.g. "Sun, Sep 27, 2026, 1:00 PM GMT+5:30" in `timeZone`. */
export function formatHumanReadableDateTime(
  iso: string | null | undefined,
  timeZone: string
): string {
  if (!iso) return 'Unknown'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

/**
 * Formats a calendar date string ("YYYY-MM-DD") as e.g. "Sun, Sep 27, 2026".
 * Formatting happens in UTC because all-day values are calendar dates, not
 * instants — no timezone should shift the day.
 */
export function formatHumanReadableDate(date: string | null | undefined): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Unknown'
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(parsed)
  } catch {
    return date
  }
}

/** Google stores reminders as lead times; map them to an unambiguous shape. */
export function normalizeReminders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reminders: any
): NormalizedReminders | null {
  if (!reminders || typeof reminders !== 'object') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOverrides: any[] = Array.isArray(reminders.overrides) ? reminders.overrides : []
  return {
    useDefault: reminders.useDefault !== false,
    overrides: rawOverrides.map((o) => ({
      method: String(o?.method || 'popup'),
      minutesBefore: typeof o?.minutes === 'number' ? o.minutes : null
    }))
  }
}

/** Single entry point: converts a stored CalendarEvent into the agent payload. */
export function normalizeCalendarEvent(
  event: CalendarEvent,
  userTimeZone: string = getUserTimeZone()
): NormalizedCalendarEvent {
  const timeZone = event.timeZone || userTimeZone

  const startHumanReadable = event.allDay
    ? `${formatHumanReadableDate(event.startDate)} (all day)`
    : formatHumanReadableDateTime(event.startDateTime, timeZone)

  const endHumanReadable = event.allDay
    ? `${formatHumanReadableDate(event.endDate || event.startDate)} (all day)`
    : formatHumanReadableDateTime(event.endDateTime, timeZone)

  return {
    id: event.id,
    title: event.title,
    allDay: event.allDay,
    startDateTime: event.startDateTime || null,
    endDateTime: event.endDateTime || null,
    startDate: event.startDate || null,
    endDate: event.endDate || null,
    timeZone,
    startHumanReadable,
    endHumanReadable,
    location: event.location || null,
    meetingUrl: event.meetingUrl || null,
    reminders: normalizeReminders(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).reminders
    )
  }
}

export interface NormalizedReminder {
  id: string
  title: string
  /** ISO 8601 UTC instant when the reminder fires. */
  scheduledAt: string
  /** Same instant rendered in the user's timezone. */
  localTime: string
  timeZone: string
  status: string
  alertType: string
  eventId?: string | null
}

/** Normalizes a stored reminder so the model never has to convert timezones. */
export function normalizeReminder(
  reminder: {
    id: string
    title: string
    scheduledAt: string
    status: string
    alertType: string
    eventId?: string | null
  },
  userTimeZone: string = getUserTimeZone()
): NormalizedReminder {
  return {
    id: reminder.id,
    title: reminder.title,
    scheduledAt: reminder.scheduledAt,
    localTime: formatHumanReadableDateTime(reminder.scheduledAt, userTimeZone),
    timeZone: userTimeZone,
    status: reminder.status,
    alertType: reminder.alertType,
    eventId: reminder.eventId ?? null
  }
}
