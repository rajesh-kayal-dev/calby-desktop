import { ipcRenderer } from 'electron'
import type { AuthStatus, ValidateKeyResult, IpcResult } from '../index.d'

export const AUTH_CHANNELS = {
  GET_STATUS: 'auth:get-status',
  VALIDATE_AND_SAVE_KEY: 'auth:validate-and-save-key',
  CLEAR_KEY: 'auth:clear-key'
} as const

export const authApi = {
  getStatus: async (): Promise<IpcResult<AuthStatus>> => {
    try {
      const result = await ipcRenderer.invoke(AUTH_CHANNELS.GET_STATUS)
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

  validateAndSaveKey: async (apiKey: string): Promise<IpcResult<ValidateKeyResult>> => {
    try {
      const result = await ipcRenderer.invoke(AUTH_CHANNELS.VALIDATE_AND_SAVE_KEY, apiKey)
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

  clearKey: async (): Promise<IpcResult<void>> => {
    try {
      const result = await ipcRenderer.invoke(AUTH_CHANNELS.CLEAR_KEY)
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
