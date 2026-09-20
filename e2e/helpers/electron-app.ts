import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import path from 'node:path'

export interface LaunchCalbyOptions {
  fakeAudioFile?: string
}

export interface CalbyTestContext {
  app: ElectronApplication
  page: Page
  consoleErrors: string[]
  unhandledErrors: Error[]
}

/**
 * Launches the built Calby Electron application and attaches console/error monitors.
 */
export async function launchCalbyApp(options?: LaunchCalbyOptions): Promise<CalbyTestContext> {
  const desktopAppDir = path.resolve('apps', 'desktop')

  const consoleErrors: string[] = []
  const unhandledErrors: Error[] = []

  const args = ['.']
  if (options?.fakeAudioFile) {
    args.push('--use-fake-device-for-media-stream')
    args.push(`--use-file-for-fake-audio-capture=${options.fakeAudioFile}%noloop`)
  }

  const app = await electron.launch({
    args,
    cwd: desktopAppDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ...(options?.fakeAudioFile ? { CALBY_TEST_FAKE_AUDIO: '1' } : {})
    }
  })

  app.on('window', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Ignore known harmless DevTools protocol noise
        if (
          text.includes('Autofill.enable') ||
          text.includes('Download the React DevTools')
        ) {
          return
        }
        consoleErrors.push(text)
      }
    })

    page.on('pageerror', (err) => {
      unhandledErrors.push(err)
    })
  })

  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')

  return {
    app,
    page,
    consoleErrors,
    unhandledErrors
  }
}
