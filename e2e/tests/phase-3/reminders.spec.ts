import { test, expect } from '../../fixtures/electron-fixture'
import { launchCalbyApp } from '../../helpers/electron-app'

test.describe('Phase 3 — Reminders Feature Tests', () => {
  test('1. Reminders list navigation, tabs, and empty state', async ({ calbyPage }) => {
    // Navigate from Home to Reminders
    const remindersNavBtn = calbyPage.locator('button[aria-label="Reminders"]')
    if (await remindersNavBtn.isVisible()) {
      await remindersNavBtn.click()
    }

    // Verify header and action elements
    await expect(calbyPage.locator('h1:has-text("Reminders")')).toBeVisible()
    await expect(calbyPage.locator('text=Stay on track with what matters.')).toBeVisible()
    await expect(calbyPage.locator('button:has-text("New Reminder")')).toBeVisible()

    // Verify filter tabs
    await expect(calbyPage.locator('button:has-text("Upcoming")')).toBeVisible()
    await expect(calbyPage.locator('button:has-text("Completed")')).toBeVisible()

    // Switch between tabs
    await calbyPage.locator('button:has-text("Completed")').click()
    await calbyPage.locator('button:has-text("Upcoming")').click()

    // Verify Home back link
    const homeBtn = calbyPage.locator('button:has-text("Home")')
    await expect(homeBtn).toBeVisible()
    await homeBtn.click()

    // Confirm back on Home
    await expect(calbyPage.locator('button[aria-label="Reminders"]')).toBeVisible()
  })

  test('2. Create, Edit, Complete, and Delete reminder lifecycle', async ({ calbyPage }) => {
    // Navigate to Reminders
    const remindersNavBtn = calbyPage.locator('button[aria-label="Reminders"]')
    if (await remindersNavBtn.isVisible()) {
      await remindersNavBtn.click()
    }

    // 1. Open Create Modal
    await calbyPage.locator('button:has-text("New Reminder")').first().click()
    await expect(calbyPage.locator('#modal-title:has-text("Create Reminder")')).toBeVisible()

    // 2. Validate empty title error
    const saveBtn = calbyPage.locator('button[type="submit"]:has-text("Save")')
    const titleInput = calbyPage.locator('#reminder-title')
    await titleInput.fill('')
    await saveBtn.click()
    await expect(calbyPage.locator('text=Please enter a title for the reminder.')).toBeVisible()

    // 3. Fill valid reminder details
    await titleInput.fill('Call Rahul')
    await saveBtn.click()

    // Modal closes and card is visible
    await expect(calbyPage.locator('article[data-purpose="reminder-card"]:has-text("Call Rahul")')).toBeVisible()

    // 4. Edit reminder
    const editBtn = calbyPage
      .locator('article[data-purpose="reminder-card"]:has-text("Call Rahul")')
      .locator('button[title="Edit reminder"]')
    await editBtn.click()

    await expect(calbyPage.locator('#modal-title:has-text("Edit Reminder")')).toBeVisible()
    await titleInput.fill('Call Rahul (Urgent)')
    await saveBtn.click()

    // Verify updated title
    await expect(
      calbyPage.locator('article[data-purpose="reminder-card"]:has-text("Call Rahul (Urgent)")')
    ).toBeVisible()

    // 5. Complete reminder
    const completeCheckBtn = calbyPage
      .locator('article[data-purpose="reminder-card"]:has-text("Call Rahul (Urgent)")')
      .locator('button[aria-label="Mark complete"]')
    await completeCheckBtn.click()

    // Switch to Completed tab and verify presence
    await calbyPage.locator('button:has-text("Completed")').click()
    await expect(
      calbyPage.locator('article[data-purpose="reminder-card"]:has-text("Call Rahul (Urgent)")')
    ).toBeVisible()

    // 6. Delete reminder
    const deleteBtn = calbyPage
      .locator('article[data-purpose="reminder-card"]:has-text("Call Rahul (Urgent)")')
      .locator('button[title="Delete reminder"]')
    await deleteBtn.click()

    // Verify deleted
    await expect(
      calbyPage.locator('article[data-purpose="reminder-card"]:has-text("Call Rahul (Urgent)")')
    ).not.toBeVisible()
  })

  test('3. Persistence across application restart', async ({ calbyPage, electronApp }) => {
    // Navigate to Reminders
    const remindersNavBtn = calbyPage.locator('button[aria-label="Reminders"]')
    if (await remindersNavBtn.isVisible()) {
      await remindersNavBtn.click()
    }

    // Create a unique persistent reminder
    const uniqueTitle = `Persisted Meeting ${Date.now()}`
    await calbyPage.locator('button:has-text("New Reminder")').first().click()
    await calbyPage.locator('#reminder-title').fill(uniqueTitle)
    await calbyPage.locator('button[type="submit"]:has-text("Save")').click()

    await expect(
      calbyPage.locator(`article[data-purpose="reminder-card"]:has-text("${uniqueTitle}")`)
    ).toBeVisible()

    // Close app and preserve userDataDir
    const userDataDir = await electronApp.evaluate(({ app }) => app.getPath('userData'))
    await electronApp.close()

    // Re-launch app with same userDataDir
    const freshContext = await launchCalbyApp({ userDataDir })
    const freshPage = freshContext.page

    // Navigate to Reminders
    const freshNavBtn = freshPage.locator('button[aria-label="Reminders"]')
    await freshNavBtn.click()

    // Verify reminder survived restart and was restored from SQLite
    await expect(
      freshPage.locator(`article[data-purpose="reminder-card"]:has-text("${uniqueTitle}")`)
    ).toBeVisible()

    // Cleanup: delete the created reminder
    const deleteBtn = freshPage
      .locator(`article[data-purpose="reminder-card"]:has-text("${uniqueTitle}")`)
      .locator('button[title="Delete reminder"]')
    await deleteBtn.click()

    await freshContext.app.close()
  })

  test('4. Alert type selection (Notification vs Alarm), helper text, and card badge', async ({ calbyPage }) => {
    // Navigate to Reminders
    const remindersNavBtn = calbyPage.locator('button[aria-label="Reminders"]')
    if (await remindersNavBtn.isVisible()) {
      await remindersNavBtn.click()
    }

    // Open Create Modal
    await calbyPage.locator('button:has-text("New Reminder")').first().click()
    await expect(calbyPage.locator('#modal-title:has-text("Create Reminder")')).toBeVisible()

    // Verify Alert Type radios exist with Notification checked by default
    const notifRadio = calbyPage.locator('input[type="radio"][value="notification"]')
    const alarmRadio = calbyPage.locator('input[type="radio"][value="alarm"]')
    await expect(notifRadio).toBeVisible()
    await expect(alarmRadio).toBeVisible()
    await expect(notifRadio).toBeChecked()
    await expect(calbyPage.locator('text=Calby will show a desktop notification when it\'s time.')).toBeVisible()

    // Switch to Alarm
    await alarmRadio.click()
    await expect(alarmRadio).toBeChecked()
    await expect(calbyPage.locator('text=Calby will play your selected alarm sound when it\'s time.')).toBeVisible()

    // Fill title and save
    const uniqueTitle = `Alarm Task ${Date.now()}`
    await calbyPage.locator('#reminder-title').fill(uniqueTitle)
    await calbyPage.locator('button[type="submit"]:has-text("Save")').click()

    // Verify reminder card shows Alarm badge
    const card = calbyPage.locator(`article[data-purpose="reminder-card"]:has-text("${uniqueTitle}")`)
    await expect(card).toBeVisible()
    await expect(card.locator('span:has-text("Alarm ·")')).toBeVisible()

    // Edit the reminder and verify saved alert type is shown
    await card.locator('button[title="Edit reminder"]').click()
    await expect(calbyPage.locator('#modal-title:has-text("Edit Reminder")')).toBeVisible()
    await expect(calbyPage.locator('input[type="radio"][value="alarm"]')).toBeChecked()

    // Switch back to Notification and save
    await calbyPage.locator('input[type="radio"][value="notification"]').click()
    await calbyPage.locator('button[type="submit"]:has-text("Save")').click()

    // Verify reminder card shows Notification badge
    await expect(card.locator('span:has-text("Notification ·")')).toBeVisible()

    // Cleanup
    await card.locator('button[title="Delete reminder"]').click()
  })

  test('5. Real end-to-end alarm triggering: Alarm surface and Stop action', async ({ calbyPage }) => {
    // Navigate to Reminders
    const remindersNavBtn = calbyPage.locator('button[aria-label="Reminders"]')
    if (await remindersNavBtn.isVisible()) {
      await remindersNavBtn.click()
    }

    // Open Create Modal
    await calbyPage.locator('button:has-text("New Reminder")').first().click()
    await expect(calbyPage.locator('#modal-title:has-text("Create Reminder")')).toBeVisible()

    const alarmTitle = `Test Alarm Surface ${Date.now()}`
    await calbyPage.locator('#reminder-title').fill(alarmTitle)

    // Select Alarm alert type
    await calbyPage.locator('input[type="radio"][value="alarm"]').click()

    // Click +20s quick test chip to schedule 20s in future
    const quickChip = calbyPage.locator('button:has-text("+20s")')
    await expect(quickChip).toBeVisible()
    await quickChip.click()

    // Save reminder
    await calbyPage.locator('button[type="submit"]:has-text("Save")').click()

    // Card should be visible
    const card = calbyPage.locator(`article[data-purpose="reminder-card"]:has-text("${alarmTitle}")`)
    await expect(card).toBeVisible()

    // Wait for the alarm to trigger within 25 seconds
    const alarmSurface = calbyPage.locator('[data-purpose="reminder-alarm-surface"]')
    await expect(alarmSurface).toBeVisible({ timeout: 25000 })
    await expect(alarmSurface.locator(`text=${alarmTitle}`)).toBeVisible()

    // Verify Stop alarm button is present and click it
    const stopBtn = alarmSurface.locator('button:has-text("Stop alarm")')
    await expect(stopBtn).toBeVisible()
    await stopBtn.click()

    // Alarm surface should dismiss
    await expect(alarmSurface).not.toBeVisible()

    // Cleanup
    if (await card.isVisible()) {
      await card.locator('button[title="Delete reminder"]').click()
    }
  })

  test('6. Real end-to-end notification triggering: Notification reminder triggers and transitions status to triggered', async ({
    calbyPage,
    electronApp
  }) => {
    // Navigate to Reminders
    const remindersNavBtn = calbyPage.locator('button[aria-label="Reminders"]')
    if (await remindersNavBtn.isVisible()) {
      await remindersNavBtn.click()
    }

    // Open Create Modal
    await calbyPage.locator('button:has-text("New Reminder")').first().click()
    await expect(calbyPage.locator('#modal-title:has-text("Create Reminder")')).toBeVisible()

    const notifTitle = `Test Notif Trigger ${Date.now()}`
    await calbyPage.locator('#reminder-title').fill(notifTitle)

    // Ensure Notification alert type is selected
    await calbyPage.locator('input[type="radio"][value="notification"]').click()

    // Click +20s quick test chip
    const quickChip = calbyPage.locator('button:has-text("+20s")')
    await quickChip.click()

    // Save reminder
    await calbyPage.locator('button[type="submit"]:has-text("Save")').click()

    const card = calbyPage.locator(`article[data-purpose="reminder-card"]:has-text("${notifTitle}")`)
    await expect(card).toBeVisible()

    // Verify reminder triggers via main process scheduler and status in SQLite becomes 'triggered'
    await expect
      .poll(
        async () => {
          return await electronApp.evaluate((_ctx, title) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const calby = (global as any).__calby
            const reminderService = calby.ReminderService.getInstance()
            const reminders = reminderService.listAll()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const found = reminders.find((r: any) => r.title === title)
            return found?.status
          }, notifTitle)
        },
        { timeout: 26000, intervals: [1000] }
      )
      .toBe('triggered')

    // Cleanup
    if (await card.isVisible()) {
      await card.locator('button[title="Delete reminder"]').click()
    }
  })

  test('7. Dedicated ReminderAlarmWindow independent lifecycle', async ({ calbyPage, electronApp }) => {
    // 1. Hide main window to ensure alarm window can show independently
    await electronApp.evaluate(({ BrowserWindow }) => {
      const all = BrowserWindow.getAllWindows()
      for (const win of all) {
        win.hide()
      }
    })

    // 2. Trigger alarm window via manager
    const alarmReminder = {
      id: 'test-alarm-win-' + Date.now(),
      title: 'Dedicated Window Alarm Test',
      scheduledAt: Date.now(),
      alertType: 'alarm' as const,
      status: 'scheduled' as const,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await electronApp.evaluate((_ctx, rem) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calby = (global as any).__calby
      calby.ReminderAlarmWindowManager.getInstance().showAlarmWindow(rem, false)
    }, alarmReminder)

    // 3. Verify that 2 windows now exist in electronApp
    await expect
      .poll(async () => {
        const windows = electronApp.windows()
        return windows.length
      })
      .toBeGreaterThanOrEqual(2)

    // 4. Find the alarm window and verify its content
    const alarmWindow = electronApp.windows().find((w) => w.url().includes('#/alarm'))
    expect(alarmWindow).toBeDefined()
    if (alarmWindow) {
      await expect(alarmWindow.locator('text=Dedicated Window Alarm Test')).toBeVisible({ timeout: 5000 })
      await expect(alarmWindow.locator('button:has-text("Stop alarm")')).toBeVisible()

      // Close the alarm window
      await alarmWindow.locator('button:has-text("Stop alarm")').click()
    }

    // 5. Restore main window
    const isMainVisible = await electronApp.evaluate(({ BrowserWindow }) => {
      const all = BrowserWindow.getAllWindows()
      if (all[0]) {
        all[0].show()
        return all[0].isVisible()
      }
      return false
    })
    expect(isMainVisible).toBe(true)
  })

  test('8. Missed reminder lifecycle and startup reconciliation', async ({ calbyPage, electronApp }) => {
    const missedTitle = `Missed Meeting ${Date.now()}`

    // Ensure we are on Reminders page
    const remindersNavBtn = calbyPage.locator('button[aria-label="Reminders"]')
    if (await remindersNavBtn.isVisible()) {
      await remindersNavBtn.click()
    }
    await expect(calbyPage.locator('h1:has-text("Reminders")')).toBeVisible()

    // 1. Create a reminder scheduled in the past (1 hour ago) with status 'scheduled'
    await electronApp.evaluate((_ctx, title) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calby = (global as any).__calby
      const service = calby.ReminderService.getInstance()
      const pastTime = Date.now() - 3600000 // 1 hour ago
      service.repository.create({
        id: 'test-missed-' + Date.now(),
        title,
        scheduledAt: pastTime,
        alertType: 'notification',
        status: 'scheduled'
      })
    }, missedTitle)

    // 2. Trigger startup reconciliation
    await electronApp.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calby = (global as any).__calby
      calby.ReminderService.getInstance().reconcileStartupReminders()
    })

    // 3. Verify status in database became 'missed'
    await expect
      .poll(async () => {
        return await electronApp.evaluate((_ctx, title) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const calby = (global as any).__calby
          const all = calby.ReminderService.getInstance().listAll()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = all.find((r: any) => r.title === title)
          return found?.status
        }, missedTitle)
      })
      .toBe('missed')

    // 4. Reload Reminders page or switch tabs to refresh UI
    await calbyPage.locator('button:has-text("Completed")').click()
    await calbyPage.locator('button:has-text("Upcoming")').click()

    // 5. Verify UI shows Missed badge with past time indicator
    const missedCard = calbyPage.locator(`article[data-purpose="reminder-card"]:has-text("${missedTitle}")`)
    await expect(missedCard).toBeVisible()
    // Verify the status text shows "Missed" — matches either "Alarm · Missed X ago" or "Notification · Missed X ago"
    await expect(missedCard.locator('[data-testid="reminder-status-text"]:has-text("Missed")')).toBeVisible()

    // Cleanup: complete the missed reminder
    await missedCard.locator('button[aria-label="Mark complete"]').click()
  })

  test('9. Windows Reminder Wake Scheduler task registration and cancellation', async ({ electronApp }) => {
    const isWindows = process.platform === 'win32'
    if (!isWindows) {
      test.skip()
      return
    }

    const testReminderId = 'sched-test-' + Date.now()
    const targetDate = new Date(Date.now() + 600000) // 10 minutes ahead

    // 1. Schedule wake task
    const scheduled = await electronApp.evaluate(
      async (_ctx, { id, time }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calby = (global as any).__calby
        const service = calby.ReminderService.getInstance()
        if (service.wakeScheduler) {
          await service.wakeScheduler.scheduleWake(id, new Date(time))
          return true
        }
        return false
      },
      { id: testReminderId, time: targetDate.getTime() }
    )

    expect(scheduled).toBe(true)

    // 2. Cancel wake task
    const cancelled = await electronApp.evaluate(async (_ctx, id) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calby = (global as any).__calby
      const service = calby.ReminderService.getInstance()
      if (service.wakeScheduler) {
        await service.wakeScheduler.cancelWake(id)
        return true
      }
      return false
    }, testReminderId)

    expect(cancelled).toBe(true)
  })
})