import { defineConfig } from '@playwright/test'
import path from 'node:path'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.resolve('playwright-report') }]
  ],
  outputDir: path.resolve('test-results'),
  use: {
    trace: 'on-first-retry'
  }
})
