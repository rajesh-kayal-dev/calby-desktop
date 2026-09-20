import { contextBridge } from 'electron'
import { systemApi } from './api/system.api'
import { authApi } from './api/auth.api'
import { onboardingApi } from './api/onboarding.api'
import { voiceApi } from './api/voice.api'

// Expose minimal typed window.calby API to renderer
// Raw ipcRenderer is strictly encapsulated inside api handlers
const calbyApi = {
  system: systemApi,
  auth: authApi,
  onboarding: onboardingApi,
  voice: voiceApi
}

try {
  contextBridge.exposeInMainWorld('calby', calbyApi)
} catch (error) {
  console.error('Failed to expose calby API in preload script:', error)
}
