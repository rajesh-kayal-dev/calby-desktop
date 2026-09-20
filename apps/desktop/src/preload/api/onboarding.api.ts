import { ipcRenderer } from 'electron'
import type { IpcResult } from '../index.d'

export const ONBOARDING_CHANNELS = {
  COMPLETE: 'onboarding:complete'
} as const

export const onboardingApi = {
  complete: async (): Promise<IpcResult<void>> => {
    try {
      const result = await ipcRenderer.invoke(ONBOARDING_CHANNELS.COMPLETE)
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
