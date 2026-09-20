import type {
  AuthStatus,
  CalendarStatus,
  SystemInfo,
  ClearDataResult,
  ClearMemoriesResult
} from '../../types/calby'

export type {
  AuthStatus,
  CalendarStatus,
  SystemInfo,
  ClearDataResult,
  ClearMemoriesResult
}

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown'
