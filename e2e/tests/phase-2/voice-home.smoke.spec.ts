import { test, expect } from '../../fixtures/electron-fixture'

test.describe('Phase 2 — Voice Assistant Home Smoke Tests', () => {
  test('1. App launches into VoiceAssistantHome with dynamic greeting and functional voice controls', async ({
    calbyPage,
    consoleErrors,
    unhandledErrors
  }) => {
    // 1. Electron launches & first window appears
    await expect(calbyPage).toHaveTitle(/Calby/i)

    // 2. Renderer loads & header brand is visible
    const brandTitle = calbyPage.locator('text=Calby').first()
    await expect(brandTitle).toBeVisible()

    // 3. Dynamic greeting is rendered
    const greetingHeader = calbyPage.locator('header h1')
    await expect(greetingHeader).toBeVisible()

    // 4. Voice visualizer orb container exists
    const orbContainer = calbyPage.locator('[data-purpose="voice-visualizer-container"]')
    await expect(orbContainer).toBeVisible()

    // 5. Space pill button exists
    const spacePill = calbyPage.locator('footer button')
    await expect(spacePill).toBeVisible()

    // 6. Clicking space pill / voice orb toggles listening state
    await spacePill.click()
    const listeningLabel = calbyPage.locator('text=Listening…')
    await expect(listeningLabel).toBeVisible()

    // 7. Escape returns to idle
    await calbyPage.keyboard.press('Escape')

    // 8. Verify no fatal console or unhandled errors occurred
    expect(unhandledErrors).toHaveLength(0)
    expect(consoleErrors).toHaveLength(0)
  })

  test('2. Push-to-Talk keyboard interaction (Space down -> Listening, Space up -> Processing/Idle)', async ({
    calbyPage,
    consoleErrors,
    unhandledErrors
  }) => {
    const greetingHeader = calbyPage.locator('header h1')
    await expect(greetingHeader).toBeVisible()

    // Hold Space key triggers push-to-talk Listening state
    await calbyPage.keyboard.down('Space')

    const listeningLabel = calbyPage.locator('text=Listening…')
    await expect(listeningLabel).toBeVisible()

    // Release Space key finishes turn
    await calbyPage.keyboard.up('Space')

    // Escape key returns to Idle state
    await calbyPage.keyboard.press('Escape')

    expect(unhandledErrors).toHaveLength(0)
    expect(consoleErrors).toHaveLength(0)
  })
})
