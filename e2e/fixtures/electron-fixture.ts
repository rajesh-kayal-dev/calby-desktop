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
