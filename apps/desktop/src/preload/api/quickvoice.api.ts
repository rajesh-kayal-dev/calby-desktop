import { ipcRenderer } from 'electron'
import type { CalbyQuickVoiceAPI, IpcResult } from '../index.d'

export const QUICK_VOICE_CHANNELS = {
  CLOSE: 'quickvoice:close',
  IS_OPEN: 'quickvoice:is-open',
  OPEN_VOICE_SETTINGS: 'quickvoice:open-voice-settings'
} as const

export const quickVoiceApi: CalbyQuickVoiceAPI = {
  close: async (): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke(QUICK_VOICE_CHANNELS.CLOSE)
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

  isOpen: async (): Promise<IpcResult<boolean>> => {
    try {
      return await ipcRenderer.invoke(QUICK_VOICE_CHANNELS.IS_OPEN)
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

  openVoiceSettings: async (): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke(QUICK_VOICE_CHANNELS.OPEN_VOICE_SETTINGS)
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
