import { ipcMain, shell } from 'electron'
import {
  SettingsService,
  type ClearDataResult,
  type ClearMemoriesResult
} from '../services/settings.service'
import {
  ConfigService,
  type AppConfig,
  type GeneralSettings,
  type PersonalizeSettings,
  type VoiceSettings,
  type ReminderSettings
} from '../services/config.service'

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export function registerSettingsIpc(): void {
  const settingsService = SettingsService.getInstance()
  const configService = ConfigService.getInstance()

  // 1. Clear All Memories
  ipcMain.handle(
    'settings:clear-memories',
    async (): Promise<IpcResult<ClearMemoriesResult>> => {
      try {
        const data = await settingsService.clearMemories()
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][settings:clear-memories] Error:', err)
        return {
          ok: false,
          error: {
            code: 'CLEAR_MEMORIES_FAILED',
            message: err instanceof Error ? err.message : 'Failed to clear memories'
          }
        }
      }
    }
  )

  // 2. Clear All Local Data
  ipcMain.handle(
    'settings:clear-all-data',
    async (): Promise<IpcResult<ClearDataResult>> => {
      try {
        const data = await settingsService.clearAllData()
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][settings:clear-all-data] Error:', err)
        return {
          ok: false,
          error: {
            code: 'CLEAR_ALL_DATA_FAILED',
            message: err instanceof Error ? err.message : 'Failed to clear local data'
          }
        }
      }
    }
  )

  // 3. Open System Microphone Settings
  ipcMain.handle(
    'settings:open-mic-settings',
    async (): Promise<IpcResult<void>> => {
      try {
        if (process.platform === 'win32') {
          await shell.openExternal('ms-settings:privacy-microphone')
        } else if (process.platform === 'darwin') {
          await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone')
        }
        return { ok: true, data: undefined }
      } catch (err) {
        console.error('[IPC][settings:open-mic-settings] Error:', err)
        return {
          ok: false,
          error: {
            code: 'OPEN_SETTINGS_FAILED',
            message: 'Unable to open system settings'
          }
        }
      }
    }
  )

  // 4. Get Config
  ipcMain.handle(
    'settings:get-config',
    async (): Promise<IpcResult<AppConfig>> => {
      try {
        const data = configService.getConfig()
        return { ok: true, data }
      } catch (err) {
        return {
          ok: false,
          error: {
            code: 'GET_CONFIG_FAILED',
            message: err instanceof Error ? err.message : 'Failed to get config'
          }
        }
      }
    }
  )

  // 5. Update Personalize
  ipcMain.handle(
    'settings:update-personalize',
    async (_event, input: Partial<PersonalizeSettings>): Promise<IpcResult<PersonalizeSettings>> => {
      try {
        const data = configService.updatePersonalize(input)
        return { ok: true, data }
      } catch (err) {
        return {
          ok: false,
          error: {
            code: 'UPDATE_PERSONALIZE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to update personalize settings'
          }
        }
      }
    }
  )

  // 6. Update Voice Settings
  ipcMain.handle(
    'settings:update-voice-settings',
    async (_event, input: Partial<VoiceSettings>): Promise<IpcResult<VoiceSettings>> => {
      try {
        const data = configService.updateVoiceSettings(input)
        return { ok: true, data }
      } catch (err) {
        return {
          ok: false,
          error: {
            code: 'UPDATE_VOICE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to update voice settings'
          }
        }
      }
    }
  )

  // 7. Update Reminder Settings
  ipcMain.handle(
    'settings:update-reminder-settings',
    async (_event, input: Partial<ReminderSettings>): Promise<IpcResult<ReminderSettings>> => {
      try {
        const data = configService.updateReminderSettings(input)
        return { ok: true, data }
      } catch (err) {
        return {
          ok: false,
          error: {
            code: 'UPDATE_REMINDER_FAILED',
            message: err instanceof Error ? err.message : 'Failed to update reminder settings'
          }
        }
      }
    }
  )

  // 8. Update General Settings
  ipcMain.handle(
    'settings:update-general-settings',
    async (_event, input: Partial<GeneralSettings>): Promise<IpcResult<GeneralSettings>> => {
      try {
        const data = configService.updateGeneralSettings(input)
        return { ok: true, data }
      } catch (err) {
        return {
          ok: false,
          error: {
            code: 'UPDATE_GENERAL_FAILED',
            message: err instanceof Error ? err.message : 'Failed to update general settings'
          }
        }
      }
    }
  )

  // 9. Open System Notification Settings
  ipcMain.handle(
    'settings:open-notification-settings',
    async (): Promise<IpcResult<void>> => {
      try {
        if (process.platform === 'win32') {
          await shell.openExternal('ms-settings:notifications')
        } else if (process.platform === 'darwin') {
          await shell.openExternal('x-apple.systempreferences:com.apple.preference.notifications')
        }
        return { ok: true, data: undefined }
      } catch (err) {
        console.error('[IPC][settings:open-notification-settings] Error:', err)
        return {
          ok: false,
          error: {
            code: 'OPEN_SETTINGS_FAILED',
            message: 'Unable to open system notification settings'
          }
        }
      }
    }
  )

  console.log('[IPC] Settings IPC channels registered.')
}
