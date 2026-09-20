import { ipcMain, shell } from 'electron'
import {
  SettingsService,
  type ClearDataResult,
  type ClearMemoriesResult
} from '../services/settings.service'

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export function registerSettingsIpc(): void {
  const settingsService = SettingsService.getInstance()

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

  console.log('[IPC] Settings IPC channels registered.')
}
