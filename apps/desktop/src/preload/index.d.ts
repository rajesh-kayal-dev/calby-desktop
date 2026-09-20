export interface SystemInfo {
  name: string
  version: string
  electronVersion: string
  platform: string
  arch: string
}

export interface AuthStatus {
  isConfigured: boolean
  isOnboarded: boolean
}

export interface ValidateKeyResult {
  isValid: boolean
}

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'action_result'
  | 'error'

export interface VoiceStateInfo {
  state: VoiceState
  metadata?: Record<string, unknown>
}

export interface VoiceTranscriptPayload {
  role: 'user' | 'assistant'
  text: string
  isFinal?: boolean
}

export interface VoiceErrorPayload {
  code: string
  message: string
}

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export interface CalbyVoiceAPI {
  startSession: () => Promise<IpcResult<void>>
  stopSession: () => Promise<IpcResult<void>>
  sendAudioChunk: (base64Data: string) => Promise<IpcResult<void>>
  sendTextInput: (text: string) => Promise<IpcResult<void>>
  finishTurn: () => Promise<IpcResult<void>>
  interrupt: () => Promise<IpcResult<void>>
  getState: () => Promise<IpcResult<VoiceStateInfo>>
  onStateChanged: (callback: (payload: VoiceStateInfo) => void) => () => void
  onAudioChunk: (callback: (base64Chunk: string) => void) => () => void
  onTranscript: (callback: (payload: VoiceTranscriptPayload) => void) => () => void
  onInterrupted: (callback: () => void) => () => void
  onTurnComplete: (callback: () => void) => () => void
  onError: (callback: (payload: VoiceErrorPayload) => void) => () => void
}

export interface CalbyAPI {
  system: {
    getInfo: () => Promise<IpcResult<SystemInfo>>
  }
  auth: {
    getStatus: () => Promise<IpcResult<AuthStatus>>
    validateAndSaveKey: (apiKey: string) => Promise<IpcResult<ValidateKeyResult>>
    clearKey: () => Promise<IpcResult<void>>
  }
  onboarding: {
    complete: () => Promise<IpcResult<void>>
  }
  voice: CalbyVoiceAPI
}

declare global {
  interface Window {
    calby: CalbyAPI
  }
}
