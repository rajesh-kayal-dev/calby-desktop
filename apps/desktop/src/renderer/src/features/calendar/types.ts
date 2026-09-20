export type CalendarConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'reauth_required'

export interface CalendarStatus {
  status: CalendarConnectionStatus
  connectedEmail?: string | null
  lastSyncedAt?: string | null
  error?: string | null
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
}

export type CalendarTabFilter = 'today' | 'upcoming'