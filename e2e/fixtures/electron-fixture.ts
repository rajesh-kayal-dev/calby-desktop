import { test as baseTest, expect, type Page, type ElectronApplication } from '@playwright/test'
import { launchCalbyApp } from '../helpers/electron-app'

type CalbyFixtures = {
  electronApp: ElectronApplication
  calbyPage: Page
  consoleErrors: string[]
  unhandledErrors: Error[]
}

export const test = baseTest.extend<CalbyFixtures>({
  electronApp: async ({}, use) => {
    const ctx = await launchCalbyApp()
    await use(ctx.app)
    await ctx.app.close()
  },

  calbyPage: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')

    // Wait for initial startup loading spinner to disappear
    const spinner = page.locator('text=Initializing Calby...')
    try {
      await spinner.waitFor({ state: 'hidden', timeout: 8000 })
    } catch {
      // Ignore timeout if already hidden
    }

    // Ensure onboarded state via public IPC APIs if currently on Welcome/Onboarding screen
    const welcomeBtn = page.locator('button:has-text("Get Started")')
    if (await welcomeBtn.isVisible()) {
      await page.evaluate(async () => {
        if (window.calby?.auth?.validateAndSaveKey) {
          await window.calby.auth.validateAndSaveKey('AIzaSyDeterministicValidKey1234567890')
        }
        if (window.calby?.onboarding?.complete) {
          await window.calby.onboarding.complete()
        }
      })
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      try {
        await spinner.waitFor({ state: 'hidden', timeout: 8000 })
      } catch {
        // Ignore timeout if already hidden
      }
    }

    await use(page)
  },

  consoleErrors: async ({}, use) => {
    const errors: string[] = []
    await use(errors)
  },

  unhandledErrors: async ({}, use) => {
    const errors: Error[] = []
    await use(errors)
  }
})

export { expect }
