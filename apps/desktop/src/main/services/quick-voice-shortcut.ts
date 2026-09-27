import { globalShortcut } from 'electron'
import {
  ACTIVATION_SHORTCUT,
  DEFAULT_QUICK_VOICE_SHORTCUT
} from '../../shared/quick-voice'
import { QuickVoiceWindowManager } from '../windows/quick-voice.window'

export interface ShortcutApplyResult {
  ok: boolean
  accelerator: string
  reason?: string
}

let registeredAccelerator: string | null = null

/** Normalises a configured accelerator, falling back to the default. */
export function resolveQuickVoiceShortcut(configured?: string | null): string {
  const value = typeof configured === 'string' ? configured.trim() : ''
  return value.length > 0 ? value : DEFAULT_QUICK_VOICE_SHORTCUT
}

export function getRegisteredQuickVoiceShortcut(): string | null {
  return registeredAccelerator
}

function unregister(accelerator: string): void {
  try {
    globalShortcut.unregister(accelerator)
  } catch {
    // Already unregistered — nothing to clean up.
  }
}

function openQuickVoice(): void {
  try {
    QuickVoiceWindowManager.getInstance().open()
  } catch (err) {
    console.warn(
      '[QuickVoice] Failed to open the Quick Voice window:',
      err instanceof Error ? err.message : String(err)
    )
  }
}

/**
 * Registers exactly one Quick Voice global shortcut. Re-registering the same
 * accelerator is a no-op, and a failed registration restores the previous
 * binding so the shortcut never silently disappears.
 */
export function applyQuickVoiceShortcut(configured?: string | null): ShortcutApplyResult {
  const accelerator = resolveQuickVoiceShortcut(configured)

  if (accelerator === ACTIVATION_SHORTCUT) {
    return { ok: false, accelerator, reason: 'That shortcut is already used by Calby.' }
  }

  const previous = registeredAccelerator
  if (previous === accelerator) {
    return { ok: true, accelerator }
  }

  if (previous) unregister(previous)

  try {
    const registered = globalShortcut.register(accelerator, openQuickVoice)
    if (!registered) {
      if (previous) globalShortcut.register(previous, openQuickVoice)
      return {
        ok: false,
        accelerator,
        reason: 'That shortcut is unavailable. Try a different combination.'
      }
    }
    registeredAccelerator = accelerator
    return { ok: true, accelerator }
  } catch (err) {
    console.warn(
      '[QuickVoice] Shortcut registration failed:',
      err instanceof Error ? err.message : String(err)
    )
    if (previous) {
      try {
        globalShortcut.register(previous, openQuickVoice)
      } catch {
        // Previous binding is gone too; nothing more we can do.
      }
    }
    return {
      ok: false,
      accelerator,
      reason: 'That shortcut is unavailable. Try a different combination.'
    }
  }
}

export function unregisterQuickVoiceShortcut(): void {
  if (!registeredAccelerator) return
  unregister(registeredAccelerator)
  registeredAccelerator = null
}
