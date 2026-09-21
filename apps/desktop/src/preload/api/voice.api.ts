import { ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  CalbyVoiceAPI,
  VoiceStateInfo,
  VoiceTranscriptPayload,
  VoiceErrorPayload,
  IpcResult
} from '../index.d'

export const VOICE_CHANNELS = {
  START_SESSION: 'voice:start-session',
  STOP_SESSION: 'voice:stop-session',
  SEND_AUDIO_CHUNK: 'voice:send-audio-chunk',
  INTERRUPT: 'voice:interrupt',
  GET_STATE: 'voice:get-state',
  PREVIEW_VOICE: 'voice:preview-voice',
  STATE_CHANGED: 'voice:state-changed',
  AUDIO_CHUNK: 'voice:audio-chunk',
  TRANSCRIPT: 'voice:transcript',
  INTERRUPTED: 'voice:interrupted',
  TURN_COMPLETE: 'voice:turn-complete',
  ERROR: 'voice:error'
} as const

export const voiceApi: CalbyVoiceAPI = {
  startSession: async (): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke(VOICE_CHANNELS.START_SESSION)
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

  stopSession: async (): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke(VOICE_CHANNELS.STOP_SESSION)
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

  sendAudioChunk: async (base64Data: string): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke(VOICE_CHANNELS.SEND_AUDIO_CHUNK, base64Data)
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

  sendTextInput: async (text: string): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke('voice:send-text-input', text)
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

  finishTurn: async (): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke('voice:finish-turn')
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

  interrupt: async (): Promise<IpcResult<void>> => {
    try {
      return await ipcRenderer.invoke(VOICE_CHANNELS.INTERRUPT)
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

  getState: async (): Promise<IpcResult<VoiceStateInfo>> => {
    try {
      return await ipcRenderer.invoke(VOICE_CHANNELS.GET_STATE)
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

  previewVoice: async (
    voiceName: string
  ): Promise<IpcResult<{ audioBase64: string; mimeType: string }>> => {
    try {
      return await ipcRenderer.invoke(VOICE_CHANNELS.PREVIEW_VOICE, voiceName)
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

  onStateChanged: (callback: (payload: VoiceStateInfo) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: VoiceStateInfo): void => {
      callback(payload)
    }
    ipcRenderer.on(VOICE_CHANNELS.STATE_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(VOICE_CHANNELS.STATE_CHANGED, handler)
    }
  },

  onAudioChunk: (callback: (base64Chunk: string) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, base64Chunk: string): void => {
      callback(base64Chunk)
    }
    ipcRenderer.on(VOICE_CHANNELS.AUDIO_CHUNK, handler)
    return () => {
      ipcRenderer.removeListener(VOICE_CHANNELS.AUDIO_CHUNK, handler)
    }
  },

  onTranscript: (callback: (payload: VoiceTranscriptPayload) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: VoiceTranscriptPayload): void => {
      callback(payload)
    }
    ipcRenderer.on(VOICE_CHANNELS.TRANSCRIPT, handler)
    return () => {
      ipcRenderer.removeListener(VOICE_CHANNELS.TRANSCRIPT, handler)
    }
  },

  onInterrupted: (callback: () => void): (() => void) => {
    const handler = (): void => {
      callback()
    }
    ipcRenderer.on(VOICE_CHANNELS.INTERRUPTED, handler)
    return () => {
      ipcRenderer.removeListener(VOICE_CHANNELS.INTERRUPTED, handler)
    }
  },

  onTurnComplete: (callback: () => void): (() => void) => {
    const handler = (): void => {
      callback()
    }
    ipcRenderer.on(VOICE_CHANNELS.TURN_COMPLETE, handler)
    return () => {
      ipcRenderer.removeListener(VOICE_CHANNELS.TURN_COMPLETE, handler)
    }
  },

  onError: (callback: (payload: VoiceErrorPayload) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: VoiceErrorPayload): void => {
      callback(payload)
    }
    ipcRenderer.on(VOICE_CHANNELS.ERROR, handler)
    return () => {
      ipcRenderer.removeListener(VOICE_CHANNELS.ERROR, handler)
    }
  }
}
