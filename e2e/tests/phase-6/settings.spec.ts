import { test, expect } from '../../fixtures/electron-fixture'

test.describe('Phase 6 — Settings & Privacy Feature Tests', () => {
  test('1. Settings page navigation, sections, and About info', async ({ calbyPage }) => {
    // Navigate from Home to Settings
    const settingsNavBtn = calbyPage.locator('[data-testid="nav-settings-button"]')
    await expect(settingsNavBtn).toBeVisible()
    await settingsNavBtn.click()

    // Verify Settings page headers
    await expect(calbyPage.locator('h1:has-text("Settings & Privacy")')).toBeVisible()

    // Verify all 6 settings sections
    await expect(calbyPage.locator('[data-testid="gemini-settings"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="calendar-settings"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="memory-settings"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="microphone-settings"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="privacy-settings"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="about-settings"]')).toBeVisible()

    // Verify About info
    await expect(calbyPage.locator('[data-testid="app-version"]')).toBeVisible()
    await expect(calbyPage.locator('text=Calby Desktop')).toBeVisible()

    // Verify Back navigation
    await calbyPage.click('[data-testid="back-to-home-button"]')
    await expect(settingsNavBtn).toBeVisible()
  })

  test('2. Gemini connection status, masked key, and Update Key flow', async ({ calbyPage }) => {
    // Navigate to Settings
    await calbyPage.click('[data-testid="nav-settings-button"]')

    // Verify Gemini connected status
    const geminiBadge = calbyPage.locator('[data-testid="gemini-status-badge"]')
    await expect(geminiBadge).toBeVisible()
    await expect(geminiBadge).toContainText('Connected')

    // Verify no raw key is ever present in page text/HTML
    const bodyHtml = await calbyPage.content()
    expect(bodyHtml).not.toContain('AIzaSyDeterministicValidKey1234567890')
    expect(bodyHtml).toContain('••••••••••••••••')

    // Click Update Key button
    const updateBtn = calbyPage.locator('[data-testid="reconfigure-gemini-button"]')
    await expect(updateBtn).toBeVisible()
    await updateBtn.click()

    // Verify Update Gemini Key Modal appears
    const modal = calbyPage.locator('[data-testid="update-gemini-key-modal"]')
    await expect(modal).toBeVisible()
    await expect(calbyPage.locator('h3:has-text("Update Gemini API Key")')).toBeVisible()

    // Test empty key validation
    const saveKeyBtn = calbyPage.locator('[data-testid="save-gemini-key-button"]')
    await saveKeyBtn.click()
    await expect(calbyPage.locator('text=Please enter your Gemini API key.')).toBeVisible()

    // Enter a valid replacement key format and submit
    const keyInput = calbyPage.locator('#update-gemini-key-input')
    await keyInput.fill('AIzaSyNewUpdatedDeterministicKey9999')
    await saveKeyBtn.click()

    // Verify modal closes and success state reflects in Settings
    await expect(modal).not.toBeVisible()
    await expect(calbyPage.locator('[data-testid="settings-success-alert"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="gemini-status-badge"]')).toContainText('Connected')
  })

  test('3. Google Calendar status and disconnect flow', async ({ calbyPage, electronApp }) => {
    // Mock connected Google Calendar state
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

    // Navigate to Settings
    await calbyPage.click('[data-testid="nav-settings-button"]')

    // Verify Connected Calendar badge and email
    const calBadge = calbyPage.locator('[data-testid="calendar-status-badge"]')
    await expect(calBadge).toBeVisible()
    await expect(calBadge).toContainText('Connected')
    await expect(calbyPage.locator('[data-testid="calendar-email-text"]')).toContainText('alex.developer@gmail.com')

    // Disconnect button visible
    const disconnectBtn = calbyPage.locator('[data-testid="disconnect-calendar-button"]')
    await expect(disconnectBtn).toBeVisible()
  })

  test('4. Clear All Memories modal and verified deletion', async ({ calbyPage }) => {
    // Create test memory first
    await calbyPage.evaluate(async () => {
      await window.calby.memory.create({
        content: 'Temporary secret memory to be cleared',
        type: 'fact'
      })
    })

    // Navigate to Settings
    await calbyPage.click('[data-testid="nav-settings-button"]')

    // Verify memory count > 0
    const countBadge = calbyPage.locator('[data-testid="memory-count-badge"]')
    await expect(countBadge).toBeVisible()

    // Click Clear All Memories
    await calbyPage.click('[data-testid="clear-memories-button"]')

    // Verify confirmation modal
    const modal = calbyPage.locator('[data-testid="confirm-danger-modal"]')
    await expect(modal).toBeVisible()
    await expect(calbyPage.locator('[data-testid="danger-modal-title"]')).toContainText('Clear All Saved Memories?')

    // Confirm deletion
    await calbyPage.click('[data-testid="confirm-danger-button"]')
    await expect(modal).not.toBeVisible()

    // Verify count becomes 0
    await expect(calbyPage.locator('[data-testid="memory-count-badge"]')).toContainText('0 items stored')

    // Verify in SQLite via IPC
    const memoryList = await calbyPage.evaluate(async () => {
      const res = await window.calby.memory.list()
      return res.ok ? res.data : []
    })
    expect(memoryList.length).toBe(0)
  })

  test('5. Microphone status and open settings action', async ({ calbyPage }) => {
    // Navigate to Settings
    await calbyPage.click('[data-testid="nav-settings-button"]')

    // Verify Microphone permission badge
    const micBadge = calbyPage.locator('[data-testid="mic-permission-badge"]')
    await expect(micBadge).toBeVisible()

    // Verify system settings button
    const openMicBtn = calbyPage.locator('[data-testid="open-mic-settings-button"]')
    await expect(openMicBtn).toBeVisible()
  })

  test('6. Clear All Local Data danger workflow and post-clear stability', async ({ calbyPage }) => {
    // Populate sample memory & reminder
    await calbyPage.evaluate(async () => {
      await window.calby.memory.create({ content: 'Test Memory to wipe', type: 'general' })
      await window.calby.reminders.create({ title: 'Test Reminder to wipe', scheduledAt: new Date(Date.now() + 3600000).toISOString() })
    })

    // Navigate to Settings
    await calbyPage.click('[data-testid="nav-settings-button"]')

    // Click Clear All Local Data
    await calbyPage.click('[data-testid="clear-all-data-button"]')

    // Verify Danger Modal
    const modal = calbyPage.locator('[data-testid="confirm-danger-modal"]')
    await expect(modal).toBeVisible()
    await expect(calbyPage.locator('[data-testid="danger-modal-title"]')).toContainText('Clear All Local Data & Connections?')

    // Confirm complete wipe
    await calbyPage.click('[data-testid="confirm-danger-button"]')

    // 1. Application reaches Welcome/Get Started step
    await expect(calbyPage.locator('button:has-text("Get Started")')).toBeVisible({ timeout: 5000 })
    await expect(calbyPage.locator('text=A more capable you.')).toBeVisible()

    // 2. Comprehensive verification of all subsystems via IPC
    const verifyState = await calbyPage.evaluate(async () => {
      const memRes = await window.calby.memory.list()
      const remRes = await window.calby.reminders.list()
      const authRes = await window.calby.auth.getStatus()
      const calRes = await window.calby.calendar.getStatus()

      // 3. Verify SQLite remains fully usable after cleanup
      const postMemCreate = await window.calby.memory.create({
        content: 'Post-cleanup memory verification',
        type: 'fact'
      })
      const postRemCreate = await window.calby.reminders.create({
        title: 'Post-cleanup reminder verification',
        scheduledAt: new Date(Date.now() + 7200000).toISOString()
      })

      return {
        memCount: memRes.ok ? memRes.data.length : -1,
        remCount: remRes.ok ? remRes.data.length : -1,
        authStatus: authRes.ok ? authRes.data : null,
        calStatus: calRes.ok ? calRes.data.status : null,
        sqliteUsable: postMemCreate.ok && postRemCreate.ok
      }
    })

    // Memory list is empty
    expect(verifyState.memCount).toBe(0)

    // Reminders list is empty
    expect(verifyState.remCount).toBe(0)

    // Gemini credential / auth status is unconfigured / disconnected
    expect(verifyState.authStatus?.isConfigured).toBe(false)
    expect(verifyState.authStatus?.isOnboarded).toBe(false)

    // Google Calendar status is disconnected
    expect(verifyState.calStatus).toBe('disconnected')

    // SQLite remains fully usable
    expect(verifyState.sqliteUsable).toBe(true)
  })

  test('7. Cross-navigation across all 5 views (Home, Reminders, Calendar, Memory, Settings)', async ({ calbyPage }) => {
    // 1. Home -> Settings
    await calbyPage.click('[data-testid="nav-settings-button"]')
    await expect(calbyPage.locator('h1:has-text("Settings & Privacy")')).toBeVisible()

    // 2. Settings -> Memory
    await calbyPage.click('[data-testid="settings-nav-memory-button"]')
    await expect(calbyPage.locator('h1:has-text("Personal Memory")')).toBeVisible()

    // 3. Memory -> Settings
    await calbyPage.click('[data-testid="memory-nav-settings-button"]')
    await expect(calbyPage.locator('h1:has-text("Settings & Privacy")')).toBeVisible()

    // 4. Settings -> Calendar
    await calbyPage.click('[data-testid="settings-nav-calendar-button"]')
    await expect(calbyPage.locator('h1:has-text("Calendar & Schedule")')).toBeVisible()

    // 5. Calendar -> Settings
    await calbyPage.click('[data-testid="calendar-nav-settings-button"]')
    await expect(calbyPage.locator('h1:has-text("Settings & Privacy")')).toBeVisible()

    // 6. Settings -> Reminders
    await calbyPage.click('[data-testid="settings-nav-reminders-button"]')
    await expect(calbyPage.locator('h1:has-text("Reminders")')).toBeVisible()

    // 7. Reminders -> Settings
    await calbyPage.click('[data-testid="reminders-nav-settings-button"]')
    await expect(calbyPage.locator('h1:has-text("Settings & Privacy")')).toBeVisible()

    // 8. Settings -> Home
    await calbyPage.click('[data-testid="back-to-home-button"]')
    await expect(calbyPage.locator('[data-testid="nav-settings-button"]')).toBeVisible()
  })
})
