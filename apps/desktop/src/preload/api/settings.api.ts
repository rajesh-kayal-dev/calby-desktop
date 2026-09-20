import { ipcRenderer } from 'electron'
import type {
  CalbySettingsAPI,
  ClearDataResult,
  ClearMemoriesResult,
  IpcResult
} from '../index.d'

export const settingsApi: CalbySettingsAPI = {
  clearMemories: (): Promise<IpcResult<ClearMemoriesResult>> => {
    return ipcRenderer.invoke('settings:clear-memories')
  },

  clearAllData: (): Promise<IpcResult<ClearDataResult>> => {
    return ipcRenderer.invoke('settings:clear-all-data')
  },

  openMicrophoneSettings: (): Promise<IpcResult<void>> => {
    return ipcRenderer.invoke('settings:open-mic-settings')
  }
}
