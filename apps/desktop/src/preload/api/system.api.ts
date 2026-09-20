import { ipcRenderer } from 'electron'
import type { SystemInfo, IpcResult } from '../index.d'

export const SYSTEM_CHANNELS = {
  GET_INFO: 'system:get-info'
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
  }
}
