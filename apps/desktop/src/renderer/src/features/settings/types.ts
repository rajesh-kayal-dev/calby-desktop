import type {
  AuthStatus,
  CalendarStatus,
  SystemInfo,
  ClearDataResult,
  ClearMemoriesResult,
  AppConfig,
  GeneralSettings,
  PersonalizeSettings,
  VoiceSettings,
  ReminderSettings
} from '../../types/calby'

export type {
  AuthStatus,
  CalendarStatus,
  SystemInfo,
  ClearDataResult,
  ClearMemoriesResult,
  AppConfig,
  GeneralSettings,
  PersonalizeSettings,
  VoiceSettings,
  ReminderSettings
}

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'
