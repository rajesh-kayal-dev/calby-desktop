import { test, expect } from '../../fixtures/electron-fixture'

test.describe('Phase 4 - Google Calendar Integration Feature Tests', () => {
  test('1. Calendar page navigation and layout', async ({ calbyPage }) => {
    // Navigate from Home to Calendar
    const calendarNavBtn = calbyPage.locator('button[aria-label="Calendar"]')
    await expect(calendarNavBtn).toBeVisible()
    await calendarNavBtn.click()

    // Verify Calendar page headers
    await expect(calbyPage.locator('h1:has-text("Calendar & Schedule")')).toBeVisible()
    await expect(calbyPage.locator('text=Google Calendar integration for Calby voice')).toBeVisible()

    // Verify back navigation to Home
    const backBtn = calbyPage.locator('button[aria-label="Back to Home"]')
    await expect(backBtn).toBeVisible()
    await backBtn.click()

    // Confirm back on Home
    await expect(calbyPage.locator('button[aria-label="Calendar"]')).toBeVisible()
  })

  test('2. Disconnected state and Connect Banner', async ({ calbyPage, electronApp }) => {
    // Mock disconnected status in Main IPC
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: { status: 'disconnected' }
      }))
    })

    // Navigate to Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()

    // Verify Connect Google Calendar banner
    await expect(calbyPage.locator('h4:has-text("Connect your Google Calendar")')).toBeVisible()
    await expect(calbyPage.locator('button:has-text("Connect Google Calendar")')).toBeVisible()
  })

  test('3. Connected state, upcoming events list, and filter tabs', async ({ calbyPage, electronApp }) => {
    const todayIso = new Date().toISOString()
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000)
    const tomorrowIso = tomorrow.toISOString()

    const mockEvents = [
      {
        id: 'evt-1',
        title: 'Team Standup & Sync',
        description: 'Daily team sprint sync and blocker resolution.',
        allDay: false,
        startDateTime: todayIso,
        endDateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        location: 'Virtual / Google Meet',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        status: 'confirmed',
        calendarSummary: 'Work Calendar'
      },
      {
        id: 'evt-2',
        title: 'Company Hackathon Day',
        description: 'All-day internal innovation hackathon.',
        allDay: true,
        startDate: tomorrowIso.split('T')[0],
        endDate: tomorrowIso.split('T')[0],
        status: 'confirmed',
        calendarSummary: 'Company Calendar'
      }
    ]

    // Mock connected state and events in Main IPC
    await electronApp.evaluate(({ ipcMain }, events) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'user@example.com',
          lastSyncedAt: new Date().toISOString()
        }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: events
      }))
    }, mockEvents)

    // Navigate to Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()

    // Verify Connected banner with user email
    await expect(calbyPage.locator('text=Google Calendar Connected')).toBeVisible()
    await expect(calbyPage.locator('text=user@example.com')).toBeVisible()
    await expect(calbyPage.locator('button:has-text("Disconnect")')).toBeVisible()

    // Verify Today event
    await expect(calbyPage.locator('h4:has-text("Team Standup & Sync")')).toBeVisible()
    await expect(calbyPage.locator('text=Join Meeting')).toBeVisible()

    // Switch to Next 7 Days tab
    await calbyPage.locator('button:has-text("Next 7 Days")').click()

    // Verify Tomorrow all-day event
    await expect(calbyPage.locator('h4:has-text("Company Hackathon Day")')).toBeVisible()
    await expect(calbyPage.locator('text=(All Day)')).toBeVisible()
  })

  test('4. Event details modal interaction', async ({ calbyPage, electronApp }) => {
    const todayIso = new Date().toISOString()
    const mockEvent = {
      id: 'evt-modal-1',
      title: '1-on-1 Product Review',
      description: 'Discussing Phase 4 Calendar roadmap and milestone deliverables.',
      allDay: false,
      startDateTime: todayIso,
      endDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: 'Asia/Kolkata',
      location: 'Conference Room B',
      meetingUrl: 'https://meet.google.com/prd-rvw-cal',
      status: 'confirmed',
      calendarSummary: 'Primary Calendar',
      htmlLink: 'https://calendar.google.com/event?eid=123'
    }

    await electronApp.evaluate(({ ipcMain }, event) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: { status: 'connected', connectedEmail: 'user@example.com' }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: [event]
      }))
    }, mockEvent)

    await calbyPage.locator('button[aria-label="Calendar"]').click()

    // Click event card to open modal
    await calbyPage.locator('h4:has-text("1-on-1 Product Review")').click()

    // Verify modal elements inside modal overlay
    const modal = calbyPage.locator('.fixed.inset-0')
    await expect(modal.locator('h3:has-text("1-on-1 Product Review")')).toBeVisible()
    await expect(modal.locator('text=Discussing Phase 4 Calendar roadmap')).toBeVisible()
    await expect(modal.locator('text=Conference Room B')).toBeVisible()
    await expect(modal.locator('a:has-text("Join Meeting")')).toBeVisible()
    await expect(modal.locator('a:has-text("Open in Google Calendar")')).toBeVisible()

    // Close modal via Close button
    await modal.locator('button:has-text("Close")').click()
    await expect(modal).not.toBeVisible()
  })

  test('5. Empty calendar state rendering', async ({ calbyPage, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: { status: 'connected', connectedEmail: 'user@example.com' }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: []
      }))
    })

    await calbyPage.locator('button[aria-label="Calendar"]').click()

    // Verify empty state
    await expect(calbyPage.locator('h4:has-text("No events today")')).toBeVisible()
    await expect(calbyPage.locator('text=Your schedule is clear for the rest of today')).toBeVisible()
  })

  test('6. Re-authentication banner when credentials expired', async ({ calbyPage, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'reauth_required',
          error: 'Authorization expired'
        }
      }))
    })

    await calbyPage.locator('button[aria-label="Calendar"]').click()

    // Verify Reconnect prompt
    await expect(calbyPage.locator('text=Reconnection Required')).toBeVisible()
    await expect(calbyPage.locator('button:has-text("Reconnect")')).toBeVisible()
  })

  test('7. Disconnect Google Calendar action', async ({ calbyPage, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: { status: 'connected', connectedEmail: 'testuser@example.com' }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: []
      }))
      ipcMain.removeHandler('calendar:disconnect')
      ipcMain.handle('calendar:disconnect', async () => ({
        ok: true,
        data: undefined
      }))
    })

    await calbyPage.locator('button[aria-label="Calendar"]').click()
    await expect(calbyPage.locator('button:has-text("Disconnect")')).toBeVisible()

    // Click Disconnect
    await calbyPage.locator('button:has-text("Disconnect")').click()

    // Verify transitioned to disconnected
    await expect(calbyPage.locator('button:has-text("Connect Google Calendar")')).toBeVisible()
  })

  test('8. Cross-navigation between Home, Reminders, and Calendar', async ({ calbyPage }) => {
    // 1. Home -> Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()
    await expect(calbyPage.locator('h1:has-text("Calendar & Schedule")')).toBeVisible()

    // 2. Calendar -> Reminders
    const remindersBtn = calbyPage.locator('button:has-text("Reminders")')
    await expect(remindersBtn).toBeVisible()
    await remindersBtn.click()
    await expect(calbyPage.locator('h1:has-text("Reminders")')).toBeVisible()

    // 3. Reminders -> Calendar
    const calendarFromRemindersBtn = calbyPage.locator('button:has-text("Calendar")')
    await expect(calendarFromRemindersBtn).toBeVisible()
    await calendarFromRemindersBtn.click()
    await expect(calbyPage.locator('h1:has-text("Calendar & Schedule")')).toBeVisible()

    // 4. Calendar -> Home
    await calbyPage.locator('button[aria-label="Back to Home"]').click()
    await expect(calbyPage.locator('button[aria-label="Calendar"]')).toBeVisible()
    await expect(calbyPage.locator('button[aria-label="Reminders"]')).toBeVisible()
  })
})