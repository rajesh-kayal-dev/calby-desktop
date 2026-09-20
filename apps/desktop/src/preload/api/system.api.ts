import { ipcRenderer } from 'electron'
import type { SystemInfo, IpcResult, NavigationPayload } from '../index.d'

export const SYSTEM_CHANNELS = {
  GET_INFO: 'system:get-info',
  NAVIGATE: 'system:navigate'
} as const

export const systemApi = {
  getInfo: async (): Promise<IpcResult<SystemInfo>> => {
    try {
      const result = await ipcRenderer.invoke(SYSTEM_CHANNELS.GET_INFO)
      return result
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'IPC_ERROR',
          message: error instanceof Error ? error.message : 'Unknown IPC error'
        }
      }
    }
  },
  onNavigate: (callback: (payload: NavigationPayload) => void): (() => void) => {
    const handler = (_event: unknown, payload: NavigationPayload): void => {
      callback(payload)
    }
    ipcRenderer.on(SYSTEM_CHANNELS.NAVIGATE, handler)
    return () => {
      ipcRenderer.removeListener(SYSTEM_CHANNELS.NAVIGATE, handler)
    }
  }
}
