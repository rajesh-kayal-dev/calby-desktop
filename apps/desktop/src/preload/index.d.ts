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

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

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
}

declare global {
  interface Window {
    calby: CalbyAPI
  }
}
