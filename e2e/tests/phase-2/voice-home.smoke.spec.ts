import { test, expect } from '../../fixtures/electron-fixture'

test.describe('Phase 2 — Voice Assistant Home Smoke Tests', () => {
  test('1. App launches into VoiceAssistantHome with Idle state and functional controls', async ({
    calbyPage,
    consoleErrors,
    unhandledErrors
  }) => {
    // 1. Electron launches & first window appears
    await expect(calbyPage).toHaveTitle(/Calby/i)

    // 2. Renderer loads & header brand is visible
    const brandTitle = calbyPage.locator('text=Calby').first()
    await expect(brandTitle).toBeVisible()

    // 3. Initial state is Idle ("Calby is ready" and status pill)
    const readyText = calbyPage.locator('text=Calby is ready')
    await expect(readyText).toBeVisible()

    // 4. Microphone control button exists
    const micButton = calbyPage.locator('button[aria-label*="voice listening"]')
    await expect(micButton).toBeVisible()

    // 5. Clicking microphone changes application into listening state
    await micButton.click()
    const listeningHeader = calbyPage.locator('h1:has-text("Listening...")')
    await expect(listeningHeader).toBeVisible()

    // 6. Escape returns to idle
    await calbyPage.keyboard.press('Escape')
    await expect(readyText).toBeVisible()

    // 7. Verify no fatal console or unhandled errors occurred
    expect(unhandledErrors).toHaveLength(0)
    expect(consoleErrors).toHaveLength(0)
  })

  test('2. Push-to-Talk keyboard interaction (Space -> Listening, Escape -> Idle)', async ({
    calbyPage,
    consoleErrors,
    unhandledErrors
  }) => {
    const readyText = calbyPage.locator('text=Calby is ready')
    await expect(readyText).toBeVisible()

    // Space key triggers Listening state
    await calbyPage.keyboard.press('Space')

    const listeningHeader = calbyPage.locator('h1:has-text("Listening...")')
    await expect(listeningHeader).toBeVisible()

    // Escape key returns to Idle state
    await calbyPage.keyboard.press('Escape')
    await expect(readyText).toBeVisible()

    expect(unhandledErrors).toHaveLength(0)
    expect(consoleErrors).toHaveLength(0)
  })

  test('3. Diagnostic panel can be displayed, used, and minimized without errors', async ({
    calbyPage,
    consoleErrors,
    unhandledErrors
  }) => {
    // Diagnostic panel should be mounted in development mode
    const diagTitle = calbyPage.locator('text=Microphone Diagnostic Mode')
    if (await diagTitle.isVisible()) {
      const minimizeBtn = calbyPage.locator('button[title="Minimize Panel"]')
      await minimizeBtn.click()

      const showBtn = calbyPage.locator('text=Show Mic Diagnostics')
      await expect(showBtn).toBeVisible()

      await showBtn.click()
      await expect(diagTitle).toBeVisible()
    }

    expect(unhandledErrors).toHaveLength(0)
    expect(consoleErrors).toHaveLength(0)
  })
})
