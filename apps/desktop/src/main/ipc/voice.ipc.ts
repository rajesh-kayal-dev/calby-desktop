import { ipcMain } from 'electron'
import { AiVoiceService, type VoiceStateInfo } from '../services/ai-voice.service'
import type { IpcResult } from '../../preload/index.d'

export const VOICE_CHANNELS = {
  START_SESSION: 'voice:start-session',
  STOP_SESSION: 'voice:stop-session',
  SEND_AUDIO_CHUNK: 'voice:send-audio-chunk',
  SEND_TEXT_INPUT: 'voice:send-text-input',
  FINISH_TURN: 'voice:finish-turn',
  INTERRUPT: 'voice:interrupt',
  GET_STATE: 'voice:get-state',
  PREVIEW_VOICE: 'voice:preview-voice'
} as const

export function registerVoiceIpcHandlers(): void {
  const voiceService = AiVoiceService.getInstance()

  ipcMain.handle(
    VOICE_CHANNELS.PREVIEW_VOICE,
    async (
      _event,
      voiceName: string
    ): Promise<IpcResult<{ audioBase64: string; mimeType: string }>> => {
      try {
        const result = await voiceService.previewVoice(voiceName)
        return { ok: true, data: result }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'PREVIEW_VOICE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to generate voice preview'
          }
        }
      }
    }
  )

  ipcMain.handle(VOICE_CHANNELS.START_SESSION, async (): Promise<IpcResult<void>> => {
    try {
      await voiceService.startSession()
      return { ok: true, data: undefined }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'VOICE_SESSION_START_FAILED',
          message: error instanceof Error ? error.message : 'Failed to start voice session'
        }
      }
    }
  })

  ipcMain.handle(VOICE_CHANNELS.STOP_SESSION, async (): Promise<IpcResult<void>> => {
    try {
      await voiceService.stopSession()
      return { ok: true, data: undefined }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'VOICE_SESSION_STOP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to stop voice session'
        }
      }
    }
  })

  ipcMain.handle(
    VOICE_CHANNELS.SEND_AUDIO_CHUNK,
    async (_event, chunkBase64: string): Promise<IpcResult<void>> => {
      try {
        await voiceService.sendAudioChunk(chunkBase64)
        return { ok: true, data: undefined }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'SEND_AUDIO_FAILED',
            message: error instanceof Error ? error.message : 'Failed to send audio chunk'
          }
        }
      }
    }
  )

  ipcMain.handle(
    VOICE_CHANNELS.SEND_TEXT_INPUT,
    async (_event, text: string): Promise<IpcResult<void>> => {
      try {
        await voiceService.sendTextInput(text)
        return { ok: true, data: undefined }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'SEND_TEXT_FAILED',
            message: error instanceof Error ? error.message : 'Failed to send text input'
          }
        }
      }
    }
  )

  ipcMain.handle(VOICE_CHANNELS.FINISH_TURN, async (): Promise<IpcResult<void>> => {
    try {
      voiceService.finishTurn()
      return { ok: true, data: undefined }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'FINISH_TURN_FAILED',
          message: error instanceof Error ? error.message : 'Failed to finish turn'
        }
      }
    }
  })

  ipcMain.handle(VOICE_CHANNELS.INTERRUPT, async (): Promise<IpcResult<void>> => {
    try {
      voiceService.interrupt()
      return { ok: true, data: undefined }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'INTERRUPT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to interrupt voice session'
        }
      }
    }
  })

  ipcMain.handle(VOICE_CHANNELS.GET_STATE, async (): Promise<IpcResult<VoiceStateInfo>> => {
    try {
      const state = voiceService.getState()
      return { ok: true, data: state }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'GET_STATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get voice state'
        }
      }
    }
  })
}
