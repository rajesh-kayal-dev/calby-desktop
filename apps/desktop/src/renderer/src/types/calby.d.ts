import type {
  SystemInfo,
  AuthStatus,
  ValidateKeyResult,
  VoiceState,
  VoiceStateInfo,
  VoiceTranscriptPayload,
  VoiceErrorPayload,
  Reminder,
  ReminderStatus,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderChangePayload,
  ReminderTriggeredPayload,
  CalendarStatus,
  CalendarConnectionStatus,
  CalendarEvent,
  Memory,
  MemoryType,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryChangedPayload,
  IpcResult,
  CalbyVoiceAPI,
  CalbyRemindersAPI,
  CalbyCalendarAPI,
  CalbyMemoryAPI,
  CalbyAPI
} from '../../../preload/index.d'

export type {
  SystemInfo,
  AuthStatus,
  ValidateKeyResult,
  VoiceState,
  VoiceStateInfo,
  VoiceTranscriptPayload,
  VoiceErrorPayload,
  Reminder,
  ReminderStatus,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderChangePayload,
  ReminderTriggeredPayload,
  CalendarStatus,
  CalendarConnectionStatus,
  CalendarEvent,
  Memory,
  MemoryType,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryChangedPayload,
  IpcResult,
  CalbyVoiceAPI,
  CalbyRemindersAPI,
  CalbyCalendarAPI,
  CalbyMemoryAPI,
  CalbyAPI
}

declare global {
  interface Window {
    calby: CalbyAPI
  }
}
