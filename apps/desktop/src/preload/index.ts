import { contextBridge } from 'electron'
import { systemApi } from './api/system.api'
import { authApi } from './api/auth.api'
import { onboardingApi } from './api/onboarding.api'
import { voiceApi } from './api/voice.api'
import { remindersApi } from './api/reminders.api'
import { calendarApi } from './api/calendar.api'
import { memoryApi } from './api/memory.api'

// Expose minimal typed window.calby API to renderer
// Raw ipcRenderer is strictly encapsulated inside api handlers
const calbyApi = {
  system: systemApi,
  auth: authApi,
  onboarding: onboardingApi,
  voice: voiceApi,
  reminders: remindersApi,
  calendar: calendarApi,
  memory: memoryApi
}

try {
  contextBridge.exposeInMainWorld('calby', calbyApi)
} catch (error) {
  console.error('[Preload] Failed to expose calby API to main world:', error)
}
