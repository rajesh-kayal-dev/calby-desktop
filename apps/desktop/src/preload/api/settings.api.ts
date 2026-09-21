import { ipcRenderer } from 'electron'
import type {
  CalbySettingsAPI,
  ClearDataResult,
  ClearMemoriesResult,
  AppConfig,
  GeneralSettings,
  PersonalizeSettings,
  VoiceSettings,
  ReminderSettings,
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
  },

  openNotificationSettings: (): Promise<IpcResult<void>> => {
    return ipcRenderer.invoke('settings:open-notification-settings')
  },

  getConfig: (): Promise<IpcResult<AppConfig>> => {
    return ipcRenderer.invoke('settings:get-config')
  },

  updateGeneralSettings: (input: Partial<GeneralSettings>): Promise<IpcResult<GeneralSettings>> => {
    return ipcRenderer.invoke('settings:update-general-settings', input)
  },

  updatePersonalize: (input: Partial<PersonalizeSettings>): Promise<IpcResult<PersonalizeSettings>> => {
    return ipcRenderer.invoke('settings:update-personalize', input)
  },

  updateVoiceSettings: (input: Partial<VoiceSettings>): Promise<IpcResult<VoiceSettings>> => {
    return ipcRenderer.invoke('settings:update-voice-settings', input)
  },

  updateReminderSettings: (input: Partial<ReminderSettings>): Promise<IpcResult<ReminderSettings>> => {
    return ipcRenderer.invoke('settings:update-reminder-settings', input)
  }
}
