import { BrowserWindow } from 'electron'

/** Renderer channel announcing whether a window now owns the voice session. */
export const VOICE_OWNER_CHANNEL = 'voice:owner-changed'

let ownerWebContentsId: number | null = null

/** Registers which window owns the mic / voice session (`null` = no arbitration). */
export function setVoiceOwner(webContentsId: number | null): void {
  ownerWebContentsId = webContentsId
}

export function getVoiceOwnerId(): number | null {
  return ownerWebContentsId
}

export function isVoiceOwner(webContentsId: number): boolean {
  return ownerWebContentsId === null || ownerWebContentsId === webContentsId
}

function liveWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter(
    (win) => !win.isDestroyed() && !win.webContents.isDestroyed()
  )
}

/**
 * Sends a voice event to the window that currently owns the voice session so
 * two renderers can never drive (or play back) the same Gemini Live session.
 *
 * Falls back to the legacy "send to every window" behaviour when no owner is
 * registered or the owner vanished, so events are never silently dropped.
 */
export function sendVoiceEvent(channel: string, ...args: unknown[]): void {
  const windows = liveWindows()
  if (windows.length === 0) return

  if (ownerWebContentsId !== null) {
    const owner = windows.find((win) => win.webContents.id === ownerWebContentsId)
    if (owner) {
      owner.webContents.send(channel, ...args)
      return
    }
  }

  for (const win of windows) {
    win.webContents.send(channel, ...args)
  }
}

/** Tells every window whether it currently owns the mic / voice session. */
export function notifyVoiceOwnerChanged(): void {
  for (const win of liveWindows()) {
    win.webContents.send(VOICE_OWNER_CHANNEL, {
      isOwner: isVoiceOwner(win.webContents.id)
    })
  }
}
