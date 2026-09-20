export interface SystemInfo {
  name: string
  version: string
  electronVersion: string
  platform: string
  arch: string
}

export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export interface CalbyAPI {
  system: {
    getInfo: () => Promise<IpcResult<SystemInfo>>
  }
}

declare global {
  interface Window {
    calby: CalbyAPI
  }
}
