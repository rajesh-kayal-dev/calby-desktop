import { ipcMain } from 'electron'
import { QuickVoiceWindowManager } from '../windows/quick-voice.window'
import type { IpcResult } from '../../preload/index.d'

export const QUICK_VOICE_CHANNELS = {
  CLOSE: 'quickvoice:close',
  IS_OPEN: 'quickvoice:is-open',
  OPEN_VOICE_SETTINGS: 'quickvoice:open-voice-settings'
} as const

export function registerQuickVoiceIpcHandlers(): void {
  ipcMain.handle(QUICK_VOICE_CHANNELS.CLOSE, async (): Promise<IpcResult<void>> => {
    try {
      QuickVoiceWindowManager.getInstance().close()
      return { ok: true, data: undefined }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'QUICK_VOICE_CLOSE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to close Quick Voice'
        }
      }
    }
  })

  ipcMain.handle(QUICK_VOICE_CHANNELS.IS_OPEN, async (): Promise<IpcResult<boolean>> => {
    try {
      return { ok: true, data: QuickVoiceWindowManager.getInstance().isOpen() }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'QUICK_VOICE_STATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to read Quick Voice state'
        }
      }
    }
  })

  ipcMain.handle(QUICK_VOICE_CHANNELS.OPEN_VOICE_SETTINGS, async (): Promise<IpcResult<void>> => {
    try {
      QuickVoiceWindowManager.getInstance().openVoiceSettings()
      return { ok: true, data: undefined }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'QUICK_VOICE_SETTINGS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to open Voice & Microphone settings'
        }
      }
    }
  })

  console.log('[IPC] Quick Voice IPC channels registered.')
}
