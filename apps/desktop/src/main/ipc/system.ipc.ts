import { ipcMain, app, shell } from 'electron'
import type { SystemInfo, IpcResult } from '../../preload/index.d'
import { SYSTEM_CHANNELS } from '../../preload/api/system.api'

export const registerSystemIpcHandlers = (): void => {
  // Test IPC handler to verify Renderer -> Preload -> Main communication works
  ipcMain.handle(SYSTEM_CHANNELS.GET_INFO, async (): Promise<IpcResult<SystemInfo>> => {
    try {
      return {
        ok: true,
        data: {
          name: app.getName() || 'Calby',
          version: app.getVersion() || '1.0.0',
          electronVersion: process.versions.electron,
          platform: process.platform,
          arch: process.arch
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'SYSTEM_INFO_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve system info'
        }
      }
    }
  })

  // Open external link handler
  ipcMain.handle(SYSTEM_CHANNELS.OPEN_EXTERNAL, async (_event, url: string): Promise<IpcResult<void>> => {
    try {
      if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
        await shell.openExternal(url)
        return { ok: true, data: undefined }
      }
      return {
        ok: false,
        error: {
          code: 'INVALID_URL',
          message: 'Invalid URL provided'
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'OPEN_EXTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to open external link'
        }
      }
    }
  })
}
