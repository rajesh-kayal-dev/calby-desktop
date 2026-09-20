export type CalendarConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'reauth_required'

export type CalendarTabFilter = 'today' | 'tomorrow' | 'upcoming' | 'selected_date'

export interface CalendarAttendee {
  email: string
  displayName?: string
  responseStatus?: string
  self?: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  allDay: boolean
  startDateTime?: string | null
  endDateTime?: string | null
  startDate?: string | null
  endDate?: string | null
  timeZone?: string | null
  location?: string | null
  meetingUrl?: string | null
  status?: 'confirmed' | 'tentative' | 'cancelled'
  calendarSummary?: string | null
  htmlLink?: string | null
  attendees?: CalendarAttendee[]
}

export interface CreateCalendarEventInput {
  title: string
  startDateTime: string
  endDateTime: string
  timeZone?: string
  attendeeEmails?: string[]
  location?: string
  description?: string
  createMeet?: boolean
}

export interface CalendarStatus {
  status: CalendarConnectionStatus
  connectedEmail?: string | null
  lastSyncedAt?: string | null
  error?: string | null
  hasWriteAccess?: boolean
}
