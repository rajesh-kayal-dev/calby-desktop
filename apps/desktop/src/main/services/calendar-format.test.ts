import { describe, it, expect } from 'vitest'
import {
  normalizeCalendarEvent,
  normalizeReminder,
  normalizeReminders,
  formatHumanReadableDateTime,
  formatHumanReadableDate
} from './calendar-format'
import type { CalendarEvent } from './google-calendar.service'

const IST = 'Asia/Kolkata'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'evt-1',
    title: 'Design review',
    allDay: false,
    // 1:00 PM IST == 07:30 UTC
    startDateTime: '2026-09-27T13:00:00+05:30',
    endDateTime: '2026-09-27T14:00:00+05:30',
    startDate: null,
    endDate: null,
    timeZone: 'Asia/Kolkata',
    location: null,
    meetingUrl: null,
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 5 }]
    },
    ...overrides
  }
}

describe('formatHumanReadableDateTime', () => {
  it('renders a UTC instant in the user timezone (never a raw UTC value)', () => {
    const out = formatHumanReadableDateTime('2026-09-27T07:30:00Z', IST)
    // 07:30 UTC is 13:00 in Asia/Kolkata
    expect(out).toContain('1:00 PM')
    expect(out).toContain('Sep 27, 2026')
    expect(out).not.toContain('07:30')
  })

  it('handles invalid and empty values safely', () => {
    expect(formatHumanReadableDateTime(null, IST)).toBe('Unknown')
    expect(formatHumanReadableDateTime(undefined, IST)).toBe('Unknown')
    expect(formatHumanReadableDateTime('not-a-date', IST)).toBe('Unknown')
  })
})

describe('formatHumanReadableDate', () => {
  it('formats all-day calendar dates in UTC so the day never shifts', () => {
    expect(formatHumanReadableDate('2026-09-27')).toBe('Sun, Sep 27, 2026')
  })

  it('rejects malformed dates', () => {
    expect(formatHumanReadableDate('27-09-2026')).toBe('Unknown')
    expect(formatHumanReadableDate('')).toBe('Unknown')
  })
})

describe('normalizeReminders', () => {
  it('maps Google lead times to an explicit minutesBefore field', () => {
    const out = normalizeReminders({ useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] })
    expect(out).toEqual({
      useDefault: false,
      overrides: [{ method: 'popup', minutesBefore: 10 }]
    })
  })

  it('never invents a start time when reminders are absent', () => {
    expect(normalizeReminders(undefined)).toBeNull()
    expect(normalizeReminders(null)).toBeNull()
    expect(normalizeReminders('junk')).toBeNull()
  })
})

describe('normalizeCalendarEvent', () => {
  it('keeps the fields the e2e payload contract requires at top level', () => {
    const out = normalizeCalendarEvent(makeEvent(), IST)
    expect(out.id).toBe('evt-1')
    expect(out.title).toBe('Design review')
    expect(out.allDay).toBe(false)
    expect(out.startDateTime).toBe('2026-09-27T13:00:00+05:30')
    expect(out.endDateTime).toBe('2026-09-27T14:00:00+05:30')
  })

  it('includes the timezone plus human-readable start/end for verbatim readout', () => {
    const out = normalizeCalendarEvent(makeEvent(), IST)
    expect(out.timeZone).toBe('Asia/Kolkata')
    expect(out.startHumanReadable).toContain('1:00 PM')
    expect(out.endHumanReadable).toContain('2:00 PM')
  })

  it('separates reminders from the event start so lead times are never misread', () => {
    const out = normalizeCalendarEvent(makeEvent(), IST)
    // The reminder lives ONLY in `reminders`…
    expect(out.reminders).toEqual({
      useDefault: false,
      overrides: [{ method: 'popup', minutesBefore: 5 }]
    })
    // …and never contaminates the start fields: no lead-time wording leaks in.
    expect(out.startHumanReadable).not.toMatch(/minute|before|remind/i)
    expect(out.startDateTime).toBe('2026-09-27T13:00:00+05:30')
  })

  it('falls back to the user timezone when the event has none', () => {
    const out = normalizeCalendarEvent(makeEvent({ timeZone: null }), IST)
    expect(out.timeZone).toBe(IST)
    expect(out.startHumanReadable).toContain('1:00 PM')
  })

  it('formats all-day events as a date, not an instant', () => {
    const out = normalizeCalendarEvent(
      makeEvent({
        allDay: true,
        startDateTime: null,
        endDateTime: null,
        startDate: '2026-09-27',
        endDate: '2026-09-27',
        timeZone: null
      }),
      IST
    )
    expect(out.startHumanReadable).toContain('Sun, Sep 27, 2026')
    expect(out.startHumanReadable).toContain('all day')
  })
})

describe('normalizeReminder', () => {
  it('adds a local-time rendering alongside the raw ISO value', () => {
    const out = normalizeReminder(
      {
        id: 'r1',
        title: 'Standup',
        scheduledAt: '2026-09-27T07:30:00.000Z',
        status: 'scheduled',
        alertType: 'notification',
        eventId: 'evt-1'
      },
      IST
    )
    expect(out.scheduledAt).toBe('2026-09-27T07:30:00.000Z')
    expect(out.localTime).toContain('1:00 PM')
    expect(out.timeZone).toBe(IST)
    expect(out.eventId).toBe('evt-1')
  })
})
