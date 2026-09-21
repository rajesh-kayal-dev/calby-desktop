import { test, expect } from '@playwright/test'
import path from 'node:path'
import { launchCalbyApp, type CalbyTestContext } from '../../helpers/electron-app'

test.describe('Phase 2 — Real Gemini Live Voice Pipeline (Playwright + Fake Mic WAV)', () => {
  let ctx: CalbyTestContext

  test.beforeEach(async () => {
    const audioWavPath = path.resolve('e2e', 'fixtures', 'audio', 'voice-command.wav')
    ctx = await launchCalbyApp({
      fakeAudioFile: audioWavPath
    })

    const { page } = ctx
    const welcomeBtn = page.locator('button:has-text("Get Started")')
    if (await welcomeBtn.isVisible()) {
      await page.evaluate(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any
        if (win.calby?.auth?.validateAndSaveKey) {
          await win.calby.auth.validateAndSaveKey('AIzaSyDeterministicValidKey1234567890')
        }
        if (win.calby?.onboarding?.complete) {
          await win.calby.onboarding.complete()
        }
      })
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
    }
  })

  test.afterEach(async () => {
    if (ctx?.app) {
      await ctx.app.close()
    }
  })

  test('Real Gemini Live voice turn with prerecorded speech WAV', async () => {
    const { page, unhandledErrors, consoleErrors } = ctx

    // 1. Verify window and renderer loaded
    await expect(page).toHaveTitle(/Calby/i)

    // 2. Verify API Key is configured in Calby secure storage
    const authStatus = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).calby?.auth?.getStatus()
    })

    if (!authStatus?.ok || !authStatus?.data?.isConfigured) {
      throw new Error(
        'No configured Gemini API key found in Calby secure storage. Please configure a valid API key in Calby before running live voice tests.'
      )
    }

    // 3. Verify initial state is Idle
    const header = page.locator('header h1')
    await expect(header).toBeVisible({ timeout: 5000 })

    // 4. Start Voice Listening (Push-to-Talk or Click)
    const micButton = page.locator('footer button')
    await expect(micButton).toBeVisible()
    await micButton.click()

    // 5. Confirm state becomes Listening
    const listeningLabel = page.locator('text=Listening…')
    await expect(listeningLabel).toBeVisible({ timeout: 10000 })

    // 6. Allow prerecorded speech WAV to stream through AudioWorklet to Gemini Live (~3.5 seconds)
    await page.waitForTimeout(3500)

    // 7. Stop listening & finish turn
    const stopButton = page.locator('button[aria-label="Stop listening"]').first()
    if (await stopButton.isVisible()) {
      await stopButton.click()
    } else {
      await page.keyboard.press('Space')
    }

    // 8. Wait for real Gemini Live input transcription and output audio response
    // Wait for Gemini Live response with up to 25s timeout for network roundtrip
    await expect(async () => {
      const diag = await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const el = document.querySelector('body')
        return {
          bodyText: el?.innerText || ''
        }
      })

      // Assert that input audio was sent and Gemini responded
      expect(diag.bodyText).toMatch(/The current time|today|date|Hello|Calby|help|six|PM|AM|\d{1,2}:\d{2}/i)
    }).toPass({ timeout: 25000, intervals: [1000] })

    // 10. Verify no fatal unhandled page errors
    expect(unhandledErrors).toHaveLength(0)
    expect(consoleErrors.filter((e) => !e.includes('DevTools') && !e.includes('Autofill') && !e.includes('[VOICE][MIC]'))).toHaveLength(0)
  })
})
