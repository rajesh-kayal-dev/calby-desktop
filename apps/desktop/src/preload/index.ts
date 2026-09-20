import { contextBridge } from 'electron'
import { systemApi } from './api/system.api'

// Expose minimal typed window.calby API to renderer
// Raw ipcRenderer is strictly encapsulated inside api handlers
const calbyApi = {
  system: systemApi
}

try {
  contextBridge.exposeInMainWorld('calby', calbyApi)
} catch (error) {
  console.error('Failed to expose calby API in preload script:', error)
}
