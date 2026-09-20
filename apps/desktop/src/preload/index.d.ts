export interface SystemInfo {
  name: string
  version: string
  electronVersion: string
  platform: string
  arch: string
}

export interface AuthStatus {
  isConfigured: boolean
  isOnboarded: boolean
}

export interface ValidateKeyResult {
  isValid: boolean
}

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'action_result'
  | 'error'

export interface VoiceStateInfo {
  state: VoiceState
  metadata?: Record<string, unknown>
}

export interface VoiceTranscriptPayload {
  role: 'user' | 'assistant'
  text: string
  isFinal?: boolean
}

export interface VoiceErrorPayload {
  code: string
  message: string
}

export type ReminderStatus = 'scheduled' | 'triggered' | 'snoozed' | 'completed' | 'dismissed'

export interface Reminder {
  id: string
  title: string
  scheduledAt: string
  alarmEnabled: boolean
  status: ReminderStatus
  snoozeCount: number
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

export interface CreateReminderInput {
  title: string
  scheduledAt: string
  alarmEnabled?: boolean
}

export interface UpdateReminderInput {
  id: string
  title?: string
  scheduledAt?: string
  alarmEnabled?: boolean
}

export interface ReminderChangePayload {
  action: 'created' | 'updated' | 'deleted'
  reminder: Reminder
}

export interface ReminderTriggeredPayload {
  reminder: Reminder
}

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

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export interface CalbyVoiceAPI {
  startSession: () => Promise<IpcResult<void>>
  stopSession: () => Promise<IpcResult<void>>
  sendAudioChunk: (base64Data: string) => Promise<IpcResult<void>>
  sendTextInput: (text: string) => Promise<IpcResult<void>>
  finishTurn: () => Promise<IpcResult<void>>
  interrupt: () => Promise<IpcResult<void>>
  getState: () => Promise<IpcResult<VoiceStateInfo>>
  onStateChanged: (callback: (payload: VoiceStateInfo) => void) => () => void
  onAudioChunk: (callback: (base64Chunk: string) => void) => () => void
  onTranscript: (callback: (payload: VoiceTranscriptPayload) => void) => () => void
  onInterrupted: (callback: () => void) => () => void
  onTurnComplete: (callback: () => void) => () => void
  onError: (callback: (payload: VoiceErrorPayload) => void) => () => void
}

export interface CalbyRemindersAPI {
  list: () => Promise<IpcResult<Reminder[]>>
  create: (input: CreateReminderInput) => Promise<IpcResult<Reminder>>
  update: (input: UpdateReminderInput) => Promise<IpcResult<Reminder>>
  delete: (id: string) => Promise<IpcResult<{ id: string }>>
  snooze: (id: string, minutes?: number) => Promise<IpcResult<Reminder>>
  complete: (id: string) => Promise<IpcResult<Reminder>>
  dismiss: (id: string) => Promise<IpcResult<Reminder>>
  onChanged: (callback: (payload: ReminderChangePayload) => void) => () => void
  onTriggered: (callback: (payload: ReminderTriggeredPayload) => void) => () => void
}

export interface CalbyCalendarAPI {
  getStatus: () => Promise<IpcResult<CalendarStatus>>
  connect: () => Promise<IpcResult<{ connected: boolean }>>
  disconnect: () => Promise<IpcResult<void>>
  getUpcoming: () => Promise<IpcResult<CalendarEvent[]>>
  onStatusChanged: (callback: (status: CalendarStatus) => void) => () => void
}

export interface CalbyAPI {
  system: {
    getInfo: () => Promise<IpcResult<SystemInfo>>
  }
  auth: {
    getStatus: () => Promise<IpcResult<AuthStatus>>
    validateAndSaveKey: (apiKey: string) => Promise<IpcResult<ValidateKeyResult>>
    clearKey: () => Promise<IpcResult<void>>
  }
  onboarding: {
    complete: () => Promise<IpcResult<void>>
  }
  voice: CalbyVoiceAPI
  reminders: CalbyRemindersAPI
  calendar: CalbyCalendarAPI
}

declare global {
  interface Window {
    calby: CalbyAPI
  }
}