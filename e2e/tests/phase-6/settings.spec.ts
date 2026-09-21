import { test, expect } from '../../fixtures/electron-fixture'

test.describe('Phase 6 — Settings Redesign & Features', () => {
  test('1. Settings navigation and category sections', async ({ calbyPage }) => {
    // Navigate from Home to Settings
    const settingsNavBtn = calbyPage.locator('[data-testid="nav-settings-button"]')
    await expect(settingsNavBtn).toBeVisible()
    await settingsNavBtn.click()

    // Verify Settings page main header
    await expect(calbyPage.locator('h1:has-text("Settings")')).toBeVisible()

    // Verify sidebar categories: General, AI, Personalize, Voice & Microphone, Reminders, Connect, Privacy, About
    await expect(calbyPage.locator('[data-testid="settings-nav-general"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-nav-ai"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-nav-personalize"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-nav-voice"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-nav-reminders"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-nav-connect"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-nav-privacy"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-nav-about"]')).toBeVisible()

    // Default section is General
    await expect(calbyPage.locator('[data-testid="general-settings"]')).toBeVisible()

    // Verify Back navigation button returns to Home
    await calbyPage.click('[data-testid="back-to-home-button"]')
    await expect(settingsNavBtn).toBeVisible()
  })

  test('2. Personalize section persistence and form entry', async ({ calbyPage }) => {
    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-personalize"]')

    // Fill personalize form
    await calbyPage.fill('[data-testid="personalize-name-input"]', 'Rajesh')
    await calbyPage.selectOption('[data-testid="personalize-tone-select"]', 'friendly')
    await calbyPage.fill('[data-testid="personalize-about-input"]', 'Software Engineer building Calby')
    await calbyPage.fill('[data-testid="personalize-instructions-input"]', 'Be direct and concise')

    // Click Save
    await calbyPage.click('[data-testid="save-personalize-button"]')
    await expect(calbyPage.locator('[data-testid="personalize-saved-badge"]')).toBeVisible()

    // Verify persistence via IPC
    const config = await calbyPage.evaluate(async () => {
      const res = await window.calby.settings.getConfig()
      return res.ok ? res.data : null
    })

    expect(config?.personalize?.userName).toBe('Rajesh')
    expect(config?.personalize?.userTone).toBe('friendly')
    expect(config?.personalize?.userAbout).toBe('Software Engineer building Calby')
    expect(config?.personalize?.userInstructions).toBe('Be direct and concise')
  })

  test('3. Gemini connection status, masked key, and Update Key flow', async ({ calbyPage }) => {
    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-ai"]')

    // Verify Gemini connected status badge
    const geminiBadge = calbyPage.locator('[data-testid="gemini-status-badge"]')
    await expect(geminiBadge).toBeVisible()
    await expect(geminiBadge).toContainText('Connected')

    // Verify no raw API key is displayed
    const bodyHtml = await calbyPage.content()
    expect(bodyHtml).not.toContain('AIzaSyDeterministicValidKey1234567890')
    expect(bodyHtml).toContain('••••••••••••••••')

    // Verify Open Google AI Studio button exists
    await expect(calbyPage.locator('[data-testid="open-ai-studio-button"]')).toBeVisible()

    // Click Update API Key button
    const updateBtn = calbyPage.locator('[data-testid="reconfigure-gemini-button"]')
    await expect(updateBtn).toBeVisible()
    await updateBtn.click()

    // Verify Update Gemini Key Modal appears
    const modal = calbyPage.locator('[data-testid="update-gemini-key-modal"]')
    await expect(modal).toBeVisible()

    // Submit valid updated key
    const keyInput = calbyPage.locator('#update-gemini-key-input')
    await keyInput.fill('AIzaSyNewUpdatedDeterministicKey9999')
    await calbyPage.click('[data-testid="save-gemini-key-button"]')

    await expect(modal).not.toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-success-alert"]')).toBeVisible()
  })

  test('4. Voice & Microphone preferences and preview state', async ({ calbyPage }) => {
    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-voice"]')

    await expect(calbyPage.locator('[data-testid="voice-microphone-settings"]')).toBeVisible()

    // Test Voice preview button
    await expect(calbyPage.locator('[data-testid="preview-voice-Puck"]')).toBeVisible()
    await calbyPage.click('[data-testid="preview-voice-Puck"]')
    await calbyPage.waitForTimeout(300)

    // Test Voice row selection
    const puckVoiceRow = calbyPage.locator('[data-testid="voice-option-Puck"]')
    await expect(puckVoiceRow).toBeVisible()
    await puckVoiceRow.click()
    await calbyPage.waitForTimeout(300)

    // Verify Save changes button is enabled and save voice
    const saveVoiceBtn = calbyPage.locator('[data-testid="save-voice-button"]')
    await expect(saveVoiceBtn).toBeVisible()
    await expect(saveVoiceBtn).toBeEnabled()
    await saveVoiceBtn.click()
    await expect(calbyPage.locator('[data-testid="voice-save-confirmation"]')).toBeVisible()

    // Verify microphone section is visible
    await expect(calbyPage.locator('[data-testid="microphone-settings"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="mic-permission-badge"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="mic-device-select"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="test-microphone-button"]')).toBeVisible()
  })

  test('5. Reminders settings toggles and duration persistence', async ({ calbyPage }) => {
    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-reminders"]')

    await expect(calbyPage.locator('[data-testid="reminders-settings"]')).toBeVisible()

    // Select alarm duration option
    await calbyPage.selectOption('[data-testid="alarm-duration-select"]', '5_min')

    // Verify persisted config via IPC
    const config = await calbyPage.evaluate(async () => {
      const res = await window.calby.settings.getConfig()
      return res.ok ? res.data : null
    })
    expect(config?.reminders?.alarmDuration).toBe('5_min')
  })

  test('6. Google Calendar connection status and disconnect flow', async ({ calbyPage, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex.developer@gmail.com',
          lastSyncedAt: new Date().toISOString()
        }
      }))
    })

    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-connect"]')

    // Verify connected status and email
    const calBadge = calbyPage.locator('[data-testid="calendar-status-badge"]')
    await expect(calBadge).toBeVisible()
    await expect(calBadge).toContainText('Connected')
    await expect(calbyPage.locator('[data-testid="calendar-email-text"]')).toContainText('alex.developer@gmail.com')

    // Disconnect button visible
    await expect(calbyPage.locator('[data-testid="disconnect-calendar-button"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="open-google-calendar-web"]')).toBeVisible()
  })

  test('7. Privacy memories clearing workflow', async ({ calbyPage }) => {
    await calbyPage.evaluate(async () => {
      await window.calby.memory.create({
        content: 'Temporary test memory to clear',
        type: 'fact'
      })
    })

    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-privacy"]')

    // Click Clear Memories
    await calbyPage.click('[data-testid="clear-memories-button"]')

    const modal = calbyPage.locator('[data-testid="confirm-danger-modal"]')
    await expect(modal).toBeVisible()

    await calbyPage.click('[data-testid="confirm-danger-button"]')
    await expect(modal).not.toBeVisible()

    const memoryList = await calbyPage.evaluate(async () => {
      const res = await window.calby.memory.list()
      return res.ok ? res.data : []
    })
    expect(memoryList.length).toBe(0)
  })

  test('8. About section identity and GitHub actions', async ({ calbyPage }) => {
    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-about"]')

    await expect(calbyPage.locator('[data-testid="about-settings"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="app-version"]')).toBeVisible()
    await expect(calbyPage.locator('text=Built by Rajesh')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="github-view-source"]')).toBeVisible()
  })

  test('9. Clear All Data danger workflow and post-clear onboarding reset', async ({ calbyPage }) => {
    await calbyPage.evaluate(async () => {
      await window.calby.memory.create({ content: 'Test Memory to wipe', type: 'general' })
      await window.calby.reminders.create({ title: 'Test Reminder to wipe', scheduledAt: new Date(Date.now() + 3600000).toISOString() })
    })

    await calbyPage.click('[data-testid="nav-settings-button"]')
    await calbyPage.click('[data-testid="settings-nav-privacy"]')

    await calbyPage.click('[data-testid="clear-all-data-button"]')

    const modal = calbyPage.locator('[data-testid="confirm-danger-modal"]')
    await expect(modal).toBeVisible()

    await calbyPage.click('[data-testid="confirm-danger-button"]')

    // Application reaches Welcome step
    await expect(calbyPage.locator('button:has-text("Get Started")')).toBeVisible({ timeout: 5000 })

    const verifyState = await calbyPage.evaluate(async () => {
      const memRes = await window.calby.memory.list()
      const remRes = await window.calby.reminders.list()
      const authRes = await window.calby.auth.getStatus()
      return {
        memCount: memRes.ok ? memRes.data.length : -1,
        remCount: remRes.ok ? remRes.data.length : -1,
        isConfigured: authRes.ok ? authRes.data.isConfigured : true
      }
    })

    expect(verifyState.memCount).toBe(0)
    expect(verifyState.remCount).toBe(0)
    expect(verifyState.isConfigured).toBe(false)
  })
})
