import { test, expect } from '../../fixtures/electron-fixture'

test.describe('Phase 1 — Onboarding Flow & Component Tests', () => {
  test('1. Onboarding UI components and navigation', async ({ calbyPage, consoleErrors, unhandledErrors }) => {
    // Check if on Home or Onboarding screen
    const isHome = await calbyPage.locator('text=Calby is ready').isVisible()

    if (isHome) {
      // Navigate to settings / setup reset
      const settingsBtn = calbyPage.locator('button[aria-label="Settings"]')
      await expect(settingsBtn).toBeVisible()
    } else {
      // Welcome Screen verification
      await expect(calbyPage.locator('text=A more capable you.')).toBeVisible()
      await expect(calbyPage.locator('text=Talk naturally')).toBeVisible()
      await expect(calbyPage.locator('text=Get things done')).toBeVisible()

      // Click Get Started -> Step 2
      const getStartedBtn = calbyPage.locator('button:has-text("Get Started")')
      await getStartedBtn.click()
      await expect(calbyPage.locator('text=Connect your Gemini API')).toBeVisible()

      // Validate empty API key validation error UI
      const connectBtn = calbyPage.locator('button:has-text("Connect")')
      await connectBtn.click()
      await expect(calbyPage.locator('text=Please enter your Gemini API key.')).toBeVisible()

      // Back navigation to Step 1
      const backBtn = calbyPage.locator('button:has-text("Back to Step 1")')
      await backBtn.click()
      await expect(calbyPage.locator('text=A more capable you.')).toBeVisible()
    }

    expect(unhandledErrors).toHaveLength(0)
    expect(consoleErrors).toHaveLength(0)
  })
})
