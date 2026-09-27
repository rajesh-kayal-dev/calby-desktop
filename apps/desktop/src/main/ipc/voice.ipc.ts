import { ipcMain } from 'electron'
import { AiVoiceService, type VoiceStateInfo } from '../services/ai-voice.service'
import { getVoiceTrace, type VoiceTraceEntry, type VoiceTraceStage } from '../services/voice-trace'
import { isVoiceOwner } from '../services/voice-owner'
import type { IpcResult, VoiceOwnerPayload } from '../../preload/index.d'

export const VOICE_CHANNELS = {
  START_SESSION: 'voice:start-session',
  STOP_SESSION: 'voice:stop-session',
  SEND_AUDIO_CHUNK: 'voice:send-audio-chunk',
  SEND_TEXT_INPUT: 'voice:send-text-input',
  FINISH_TURN: 'voice:finish-turn',
  INTERRUPT: 'voice:interrupt',
  GET_STATE: 'voice:get-state',
  PREVIEW_VOICE: 'voice:preview-voice',
  // Single-owner arbitration: exactly one window drives the Live session.
  GET_OWNER: 'voice:get-owner',
  OWNER_CHANGED: 'voice:owner-changed',
  ACTION_PROGRESS: 'voice:action-progress',
  // Developer-only voice trace (no UI; dev builds only).
  GET_TRACE: 'voice:get-trace',
  TRACE_EVENT: 'voice:trace-event'
} as const

/**
 * Renderer-side ownership checks prevent ordinary UI races, while this guard
 * makes the main process the final authority. A hidden main window must never
 * be able to start, stop, or feed the Live session once Quick Voice owns it.
 */
function voiceCommandAllowed(webContentsId: number): boolean {
  return isVoiceOwner(webContentsId)
}

function voiceOwnershipError<T>(): IpcResult<T> {
  return {
    ok: false,
    error: {
      code: 'VOICE_NOT_OWNER',
      message: 'Voice is active in another Calby window.'
    }
  }
}

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

  ipcMain.handle(VOICE_CHANNELS.START_SESSION, async (event): Promise<IpcResult<void>> => {
    try {
      if (!voiceCommandAllowed(event.sender.id)) return voiceOwnershipError()
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

  ipcMain.handle(VOICE_CHANNELS.STOP_SESSION, async (event): Promise<IpcResult<void>> => {
    try {
      if (!voiceCommandAllowed(event.sender.id)) return voiceOwnershipError()
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
    async (event, chunkBase64: string): Promise<IpcResult<void>> => {
      try {
        if (!voiceCommandAllowed(event.sender.id)) return voiceOwnershipError()
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
    async (event, text: string): Promise<IpcResult<void>> => {
      try {
        if (!voiceCommandAllowed(event.sender.id)) return voiceOwnershipError()
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

  ipcMain.handle(VOICE_CHANNELS.FINISH_TURN, async (event): Promise<IpcResult<void>> => {
    try {
      if (!voiceCommandAllowed(event.sender.id)) return voiceOwnershipError()
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

  ipcMain.handle(VOICE_CHANNELS.INTERRUPT, async (event): Promise<IpcResult<void>> => {
    try {
      if (!voiceCommandAllowed(event.sender.id)) return voiceOwnershipError()
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

  // Which window currently drives the mic + Gemini Live session. Renderers
  // that are not the owner must not capture audio or play back responses.
  ipcMain.handle(
    VOICE_CHANNELS.GET_OWNER,
    async (event): Promise<IpcResult<VoiceOwnerPayload>> => {
      try {
        return { ok: true, data: { isOwner: isVoiceOwner(event.sender.id) } }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'GET_OWNER_FAILED',
            message: error instanceof Error ? error.message : 'Failed to read voice ownership'
          }
        }
      }
    }
  )

  // Developer-only trace: renderer-side VAD events are pushed here so the whole
  // chain (voice_detected → heard → tool → … → final_response) is visible from
  // one buffer. Recording itself is a no-op in packaged builds.
  ipcMain.handle(
    VOICE_CHANNELS.TRACE_EVENT,
    async (_event, stage: string, detail: unknown): Promise<IpcResult<void>> => {
      try {
        const validStages: VoiceTraceStage[] = [
          'voice_detected',
          'heard',
          'tool_selected',
          'tool_args',
          'validation',
          'confirmation',
          'execution',
          'result',
          'final_response',
          'session',
          'error'
        ]
        const safeStage: VoiceTraceStage = validStages.includes(stage as VoiceTraceStage)
          ? (stage as VoiceTraceStage)
          : 'error'
        getVoiceTrace().record(safeStage, detail)
        return { ok: true, data: undefined }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'TRACE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to record trace event'
          }
        }
      }
    }
  )

  ipcMain.handle(VOICE_CHANNELS.GET_TRACE, async (): Promise<IpcResult<VoiceTraceEntry[]>> => {
    try {
      return { ok: true, data: getVoiceTrace().getTrace() }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'GET_TRACE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to read voice trace'
        }
      }
    }
  })
}
