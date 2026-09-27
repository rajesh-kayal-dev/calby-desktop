import type { ElectronApplication, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/electron-fixture'

const QUICK_VOICE_FRAGMENT = '#/quick-voice'
const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+C'
const ACTIVATION_SHORTCUT = 'CommandOrControl+Shift+Space'
/** An accelerator that is not expected to be bound by the app at startup. */
const SPARE_SHORTCUT = 'CommandOrControl+Shift+F9'

interface WindowSnapshot {
  total: number
  ownerId: number | null
  quickVoiceIds: number[]
  mainIds: number[]
}

const quickVoicePages = (electronApp: ElectronApplication): Page[] =>
  electronApp.windows().filter((page) => page.url().includes(QUICK_VOICE_FRAGMENT))

async function snapshot(electronApp: ElectronApplication): Promise<WindowSnapshot> {
  return await electronApp.evaluate(({ BrowserWindow }) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const calby = (global as any).__calby
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const windows = BrowserWindow.getAllWindows().filter((win) => !win.isDestroyed())
    const quickVoiceIds: number[] = []
    const mainIds: number[] = []
    for (const win of windows) {
      if (win.webContents.getURL().includes('#/quick-voice')) {
        quickVoiceIds.push(win.webContents.id)
      } else {
        mainIds.push(win.webContents.id)
      }
    }
    return {
      total: windows.length,
      ownerId: calby.voiceOwner.getOwnerId(),
      quickVoiceIds,
      mainIds
    }
  })
}

async function openQuickVoice(electronApp: ElectronApplication): Promise<number> {
  return await electronApp.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const calby = (global as any).__calby
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return calby.QuickVoiceWindowManager.getInstance().open().webContents.id
  })
}

async function waitForQuickVoicePage(electronApp: ElectronApplication): Promise<Page> {
  await expect
    .poll(() => quickVoicePages(electronApp).length, { timeout: 15000 })
    .toBe(1)
  return quickVoicePages(electronApp)[0]
}

test.describe('Phase 8 - Calby Quick Voice', () => {
  test.describe.configure({ timeout: 60000 })

  test('A. Opens one overlay, reuses it, hands over the voice session, then restores it', async ({
    calbyPage,
    electronApp
  }) => {
    // Before: only the main window, and it owns the voice session.
    const initial = await snapshot(electronApp)
    expect(initial.total).toBe(1)
    expect(initial.quickVoiceIds).toHaveLength(0)
    expect(initial.mainIds).toHaveLength(1)
    expect(initial.ownerId).toBe(initial.mainIds[0])

    // Open via the same entry point the global shortcut uses.
    const firstId = await openQuickVoice(electronApp)
    const quickVoicePage = await waitForQuickVoicePage(electronApp)

    let opened = await snapshot(electronApp)
    expect(opened.total).toBe(2)
    expect(opened.quickVoiceIds).toEqual([firstId])
    expect(opened.ownerId).toBe(firstId)

    // Invoking again must focus the existing window — never a second one.
    const secondId = await openQuickVoice(electronApp)
    expect(secondId).toBe(firstId)
    opened = await snapshot(electronApp)
    expect(opened.total).toBe(2)
    expect(opened.quickVoiceIds).toHaveLength(1)

    // The overlay renders its own minimal chrome...
    await expect(quickVoicePage.locator('[data-purpose="quick-voice-header"]')).toBeVisible()
    await expect(quickVoicePage.locator('[data-testid="quick-voice-close"]')).toBeVisible()

    // ...and reaches a deterministic state (either a status line or an error card).
    const status = quickVoicePage.locator('[data-testid="quick-voice-status"]')
    const errorCard = quickVoicePage.locator('[data-purpose="quick-voice-error"]')
    const successCard = quickVoicePage.locator('[data-purpose="quick-voice-success"]')
    await expect(status.or(errorCard).or(successCard).first()).toBeVisible()

    // Nothing internal is ever shown to the user.
    const visibleText = (await quickVoicePage.locator('body').innerText()).toLowerCase()
    for (const forbidden of ['gemini', 'websocket', 'toolcall', 'tool_call', 'stack trace']) {
      expect(visibleText).not.toContain(forbidden)
    }

    // The main window must never steal the session back while the overlay is open.
    const mainOwner = await calbyPage.evaluate(() => window.calby.voice.getOwner())
    expect(mainOwner.ok).toBe(true)
    if (mainOwner.ok) expect(mainOwner.data.isOwner).toBe(false)

    // Closing the overlay releases the session back to the main window.
    await quickVoicePage.locator('[data-testid="quick-voice-close"]').click()
    await expect
      .poll(async () => (await snapshot(electronApp)).total, { timeout: 15000 })
      .toBe(1)

    const afterClose = await snapshot(electronApp)
    expect(afterClose.quickVoiceIds).toHaveLength(0)
    expect(afterClose.mainIds).toHaveLength(1)
    expect(afterClose.ownerId).toBe(afterClose.mainIds[0])

    const mainOwnerAfter = await calbyPage.evaluate(() => window.calby.voice.getOwner())
    expect(mainOwnerAfter.ok).toBe(true)
    if (mainOwnerAfter.ok) expect(mainOwnerAfter.data.isOwner).toBe(true)
  })

  test('B. Registers exactly one Quick Voice shortcut and refuses to shadow others', async ({
    calbyPage,
    electronApp
  }) => {
    const isRegistered = async (accelerator: string): Promise<boolean> =>
      await electronApp.evaluate(
        ({ globalShortcut }, value) => globalShortcut.isRegistered(value),
        accelerator
      )

    // The Quick Voice accelerator is bound at startup.
    expect(await isRegistered(DEFAULT_SHORTCUT)).toBe(true)

    // The activation shortcut can never be taken over by Quick Voice.
    const rejected = await calbyPage.evaluate((accelerator) => {
      return window.calby.settings.updateGeneralSettings({ quickVoiceShortcut: accelerator })
    }, ACTIVATION_SHORTCUT)
    expect(rejected.ok).toBe(false)
    if (!rejected.ok) expect(rejected.error.code).toBe('SHORTCUT_UNAVAILABLE')

    const afterReject = await calbyPage.evaluate(() => window.calby.settings.getConfig())
    expect(afterReject.ok).toBe(true)
    if (afterReject.ok) {
      expect(afterReject.data.general?.quickVoiceShortcut).toBe(DEFAULT_SHORTCUT)
    }
    // A rejected change must never drop the binding the app still owns.
    expect(await isRegistered(DEFAULT_SHORTCUT)).toBe(true)

    // A spare accelerator is applied (and rolled back) consistently with config,
    // so the stored shortcut always matches what the app actually owns.
    const applied = await calbyPage.evaluate((accelerator) => {
      return window.calby.settings.updateGeneralSettings({ quickVoiceShortcut: accelerator })
    }, SPARE_SHORTCUT)

    const afterApply = await calbyPage.evaluate(() => window.calby.settings.getConfig())
    expect(afterApply.ok).toBe(true)
    if (applied.ok) {
      if (afterApply.ok) {
        expect(afterApply.data.general?.quickVoiceShortcut).toBe(SPARE_SHORTCUT)
      }
      const stillRegistered = await electronApp.evaluate(
        ({ globalShortcut }, accelerator) => globalShortcut.isRegistered(accelerator),
        SPARE_SHORTCUT
      )
      expect(stillRegistered).toBe(true)
    } else {
      expect(applied.error.code).toBe('SHORTCUT_UNAVAILABLE')
      if (afterApply.ok) {
        expect(afterApply.data.general?.quickVoiceShortcut).toBe(DEFAULT_SHORTCUT)
      }
    }

    // Always restore the default binding for the rest of the run.
    const restored = await calbyPage.evaluate((accelerator) => {
      return window.calby.settings.updateGeneralSettings({ quickVoiceShortcut: accelerator })
    }, DEFAULT_SHORTCUT)
    expect(restored.ok).toBe(true)
    expect(await isRegistered(DEFAULT_SHORTCUT)).toBe(true)
  })
})
