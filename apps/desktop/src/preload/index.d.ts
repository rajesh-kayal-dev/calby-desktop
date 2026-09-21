export interface SystemInfo {
  name: string
  version: string
  electronVersion: string
  platform: string
  arch: string
}

export interface NavigationPayload {
  view: 'home' | 'reminders' | 'calendar' | 'memory' | 'settings'
  reminderId?: string
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

export type ReminderStatus = 'scheduled' | 'triggered' | 'snoozed' | 'completed' | 'dismissed' | 'missed'
export type AlertType = 'notification' | 'alarm'

export interface Reminder {
  id: string
  title: string
  scheduledAt: string
  alarmEnabled: boolean
  alertType: AlertType
  status: ReminderStatus
  snoozeCount: number
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  missedAt?: string | null
}

export interface CreateReminderInput {
  title: string
  scheduledAt: string
  alarmEnabled?: boolean
  alertType?: AlertType
}

export interface UpdateReminderInput {
  id: string
  title?: string
  scheduledAt?: string
  alarmEnabled?: boolean
  alertType?: AlertType
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
  hasWriteAccess?: boolean
}

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

export type MemoryType = 'fact' | 'preference' | 'person' | 'work' | 'general'

export interface Memory {
  id: string
  content: string
  type: MemoryType
  createdAt: string
  updatedAt: string
}

export interface CreateMemoryInput {
  content: string
  type?: MemoryType
}

export interface UpdateMemoryInput {
  id: string
  content?: string
  type?: MemoryType
}

export interface MemoryChangedPayload {
  action: 'created' | 'updated' | 'deleted'
  memory: Memory
}

export interface ClearDataResult {
  memoriesCleared: boolean
  remindersCleared: boolean
  credentialsCleared: boolean
  calendarDisconnected: boolean
  configReset: boolean
  allCleared: boolean
  errors?: string[]
}

export interface ClearMemoriesResult {
  cleared: boolean
  count: number
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
  previewVoice: (voiceName: string) => Promise<IpcResult<{ audioBase64: string; mimeType: string }>>
  onStateChanged: (callback: (payload: VoiceStateInfo) => void) => () => void
  onAudioChunk: (callback: (base64Chunk: string) => void) => () => void
  onTranscript: (callback: (payload: VoiceTranscriptPayload) => void) => () => void
  onInterrupted: (callback: () => void) => () => void
  onTurnComplete: (callback: () => void) => () => void
  onError: (callback: (payload: VoiceErrorPayload) => void) => () => void
}

export interface CalbyRemindersAPI {
  list: () => Promise<IpcResult<Reminder[]>>
  getById: (id: string) => Promise<IpcResult<Reminder | null>>
  create: (input: CreateReminderInput) => Promise<IpcResult<Reminder>>
  update: (input: UpdateReminderInput) => Promise<IpcResult<Reminder>>
  delete: (id: string) => Promise<IpcResult<{ id: string }>>
  snooze: (id: string, minutes?: number) => Promise<IpcResult<Reminder>>
  complete: (id: string) => Promise<IpcResult<Reminder>>
  dismiss: (id: string) => Promise<IpcResult<Reminder>>
  closeAlarm: () => Promise<IpcResult<void>>
  onChanged: (callback: (payload: ReminderChangePayload) => void) => () => void
  onTriggered: (callback: (payload: ReminderTriggeredPayload) => void) => () => void
  onAlarmData?: (callback: (payload: { reminder: Reminder; isMissed: boolean }) => void) => () => void
  onPlaySound: (callback: (payload: { sound: import('../shared/sound-catalog').CalbySound; category: string }) => void) => () => void
  onNotificationStatus: (callback: (payload: { status: string; message: string }) => void) => () => void
}

export interface CalbyCalendarAPI {
  getStatus: () => Promise<IpcResult<CalendarStatus>>
  connect: () => Promise<IpcResult<{ connected: boolean }>>
  disconnect: () => Promise<IpcResult<void>>
  getUpcoming: () => Promise<IpcResult<CalendarEvent[]>>
  createEvent: (input: CreateCalendarEventInput) => Promise<IpcResult<CalendarEvent>>
  requestWriteAccess: () => Promise<IpcResult<CalendarStatus>>
  onStatusChanged: (callback: (status: CalendarStatus) => void) => () => void
}

export interface CalbyMemoryAPI {
  list: (params?: { type?: MemoryType; limit?: number }) => Promise<IpcResult<Memory[]>>
  get: (id: string) => Promise<IpcResult<Memory>>
  search: (query: string, limit?: number) => Promise<IpcResult<Memory[]>>
  create: (input: CreateMemoryInput) => Promise<IpcResult<Memory>>
  update: (input: UpdateMemoryInput) => Promise<IpcResult<Memory>>
  delete: (id: string) => Promise<IpcResult<{ id: string }>>
  onChanged: (callback: (payload: MemoryChangedPayload) => void) => () => void
}

export interface GeneralSettings {
  startWithComputer: boolean
  keepRunningInBackground: boolean
  closeToTray: boolean
  allowDesktopNotifications: boolean
}

export interface PersonalizeSettings {
  userName?: string
  userTone?: string
  userAbout?: string
  userInstructions?: string
}

export interface VoiceSettings {
  voiceName?: string
  voiceSpeed?: string
  selectedMicDeviceId?: string
}

export interface ReminderSettings {
  desktopNotificationsEnabled: boolean
  notificationSoundEnabled: boolean
  alarmEnabled: boolean
  alarmDuration: string
  notificationSound?: string
  alarmSound?: string
}

export interface AppConfig {
  isOnboarded: boolean
  configuredAt?: string
  general?: GeneralSettings
  personalize?: PersonalizeSettings
  voice?: VoiceSettings
  reminders?: ReminderSettings
}

export interface CalbySettingsAPI {
  clearMemories: () => Promise<IpcResult<ClearMemoriesResult>>
  clearAllData: () => Promise<IpcResult<ClearDataResult>>
  openMicrophoneSettings: () => Promise<IpcResult<void>>
  openNotificationSettings: () => Promise<IpcResult<void>>
  getConfig: () => Promise<IpcResult<AppConfig>>
  updateGeneralSettings: (input: Partial<GeneralSettings>) => Promise<IpcResult<GeneralSettings>>
  updatePersonalize: (input: Partial<PersonalizeSettings>) => Promise<IpcResult<PersonalizeSettings>>
  updateVoiceSettings: (input: Partial<VoiceSettings>) => Promise<IpcResult<VoiceSettings>>
  updateReminderSettings: (input: Partial<ReminderSettings>) => Promise<IpcResult<ReminderSettings>>
}

export interface CalbySystemAPI {
  getInfo: () => Promise<IpcResult<SystemInfo>>
  openExternal: (url: string) => Promise<IpcResult<void>>
  onNavigate: (callback: (payload: NavigationPayload) => void) => () => void
}

export interface CalbyAPI {
  system: CalbySystemAPI
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
  memory: CalbyMemoryAPI
  settings: CalbySettingsAPI
}

declare global {
  interface Window {
    calby: CalbyAPI
  }
}
