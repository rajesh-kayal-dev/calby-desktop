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

    // Close app
    await electronApp.close()

    // Re-launch app
    const freshContext = await launchCalbyApp()
    const freshPage = freshContext.page

    // Navigate to Reminders
    const freshNavBtn = freshPage.locator('button[aria-label="Reminders"]')
    if (await freshNavBtn.isVisible()) {
      await freshNavBtn.click()
    }

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
})