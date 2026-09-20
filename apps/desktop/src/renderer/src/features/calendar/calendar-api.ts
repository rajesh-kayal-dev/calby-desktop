import type { CalendarStatus, CalendarEvent, CreateCalendarEventInput } from './types'

export async function getCalendarStatus(): Promise<CalendarStatus> {
  const res = await window.calby.calendar.getStatus()
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function connectGoogleCalendar(): Promise<boolean> {
  const res = await window.calby.calendar.connect()
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data.connected
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const res = await window.calby.calendar.disconnect()
  if (!res.ok) {
    throw new Error(res.error.message)
  }
}

export async function getUpcomingCalendarEvents(): Promise<CalendarEvent[]> {
  const res = await window.calby.calendar.getUpcoming()
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
  const res = await window.calby.calendar.createEvent(input)
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function requestCalendarWriteAccess(): Promise<CalendarStatus> {
  const res = await window.calby.calendar.requestWriteAccess()
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}
