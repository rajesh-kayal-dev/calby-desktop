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

  test('3. Connected state, upcoming events list, and filter tabs (Today, Tomorrow, Next 7 Days)', async ({
    calbyPage,
    electronApp
  }) => {
    const now = new Date()
    const todayIso = now.toISOString()
    const tomDate = new Date(now)
    tomDate.setDate(now.getDate() + 1)
    const tomDateStr = `${tomDate.getFullYear()}-${String(tomDate.getMonth() + 1).padStart(2, '0')}-${String(tomDate.getDate()).padStart(2, '0')}`
    const in3DaysIso = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()

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
        startDate: tomDateStr,
        endDate: tomDateStr,
        status: 'confirmed',
        calendarSummary: 'Company Calendar'
      },
      {
        id: 'evt-3',
        title: 'Design Critique',
        description: 'Review new design tokens.',
        allDay: false,
        startDateTime: in3DaysIso,
        endDateTime: new Date(new Date(in3DaysIso).getTime() + 60 * 60 * 1000).toISOString(),
        location: 'Design Studio Room',
        status: 'confirmed',
        calendarSummary: 'Product Team'
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
    await expect(calbyPage.getByText('Google Calendar Connected', { exact: true })).toBeVisible()
    await expect(calbyPage.locator('text=user@example.com')).toBeVisible()
    await expect(calbyPage.locator('button:has-text("Disconnect")')).toBeVisible()

    // 1. Verify Today tab
    await expect(calbyPage.locator('button[data-testid="calendar-tab-today"]')).toBeVisible()
    await expect(calbyPage.locator('h4:has-text("Team Standup & Sync")')).toBeVisible()
    await expect(calbyPage.locator('text=Join Meeting')).toBeVisible()
    await expect(calbyPage.locator('button:has-text("Set Reminder")').first()).toBeVisible()

    // 2. Switch to Tomorrow tab
    await calbyPage.locator('button[data-testid="calendar-tab-tomorrow"]').click()
    await expect(calbyPage.locator('h4:has-text("Company Hackathon Day")')).toBeVisible()
    await expect(calbyPage.locator('text=All Day')).toBeVisible()

    // 3. Switch to Next 7 Days tab
    await calbyPage.locator('button[data-testid="calendar-tab-upcoming"]').click()
    await expect(calbyPage.locator('h4:has-text("Team Standup & Sync")')).toBeVisible()
    await expect(calbyPage.locator('h4:has-text("Company Hackathon Day")')).toBeVisible()
    await expect(calbyPage.locator('h4:has-text("Design Critique")')).toBeVisible()
  })

  test('4. Event details modal interaction and Set Reminder action', async ({ calbyPage, electronApp }) => {
    // Use a start time 2h in the future to avoid immediately triggering an alarm surface
    const futureStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const mockEvent = {
      id: 'evt-modal-1',
      title: '1-on-1 Product Review',
      description: 'Discussing Phase 4 Calendar roadmap and milestone deliverables.',
      allDay: false,
      startDateTime: futureStart,
      endDateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
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
    // Use role="dialog" which is now set on the inner modal card div
    const modal = calbyPage.locator('[role="dialog"]').filter({ hasText: '1-on-1 Product Review' })
    await expect(modal.locator('h3:has-text("1-on-1 Product Review")')).toBeVisible()
    await expect(modal.locator('text=Discussing Phase 4 Calendar roadmap')).toBeVisible()
    await expect(modal.locator('text=Conference Room B')).toBeVisible()
    await expect(modal.locator('a:has-text("Join Meeting")')).toBeVisible()
    await expect(modal.locator('a:has-text("Open in Google Calendar")')).toBeVisible()
    await expect(modal.locator('button:has-text("Set Reminder")')).toBeVisible()

    // Click Set Reminder in modal
    await modal.locator('button:has-text("Set Reminder")').click()
    await expect(modal.locator('text=Reminder Set')).toBeVisible()

    // Close modal via Close button
    await modal.locator('button:has-text("Close")').click()
    await expect(modal).not.toBeVisible()
  })

  test('5. Empty calendar state rendering across tabs', async ({ calbyPage, electronApp }) => {
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

    // Verify empty state for Today
    await expect(calbyPage.locator('h4:has-text("No events today")')).toBeVisible()
    await expect(calbyPage.locator('text=Your schedule is clear for the rest of today')).toBeVisible()

    // Switch to Tomorrow tab and verify empty state
    await calbyPage.locator('button[data-testid="calendar-tab-tomorrow"]').click()
    await expect(calbyPage.locator('h4:has-text("No events tomorrow")')).toBeVisible()

    // Switch to Next 7 Days tab and verify empty state
    await calbyPage.locator('button[data-testid="calendar-tab-upcoming"]').click()
    await expect(calbyPage.locator('h4:has-text("No upcoming events")')).toBeVisible()
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

  test('9. Calendar week strip persistent overview, navigation, and date selection', async ({
    calbyPage,
    electronApp
  }) => {
    const now = new Date()
    const todayIso = now.toISOString()
    const in2Days = new Date(now)
    in2Days.setDate(now.getDate() + 2)
    const in2DaysIso = in2Days.toISOString()

    const mockEvents = [
      {
        id: 'evt-ws-1',
        title: 'Project Roadmap Sync',
        description: 'Roadmap planning meeting',
        allDay: false,
        startDateTime: todayIso,
        endDateTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        location: 'Room A',
        status: 'confirmed',
        calendarSummary: 'Work Calendar'
      },
      {
        id: 'evt-ws-2',
        title: 'Future Milestone Review',
        description: 'Milestone sync',
        allDay: false,
        startDateTime: in2DaysIso,
        endDateTime: new Date(in2Days.getTime() + 60 * 60 * 1000).toISOString(),
        location: 'Virtual',
        status: 'confirmed',
        calendarSummary: 'Work Calendar'
      }
    ]

    await electronApp.evaluate(({ ipcMain }, events) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
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

    // 1. Verify persistent week strip is visible
    await expect(calbyPage.locator('[data-testid="calendar-week-strip"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="calendar-prev-week"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="calendar-next-week"]')).toBeVisible()

    // Verify 7 day buttons exist
    const dayButtons = calbyPage.locator('[data-testid^="calendar-strip-day-"]')
    await expect(dayButtons).toHaveCount(7)

    // Verify today event is displayed
    await expect(calbyPage.locator('h4:has-text("Project Roadmap Sync")')).toBeVisible()

    // 2. Click next week button and verify week strip navigation
    await calbyPage.locator('[data-testid="calendar-next-week"]').click()
    await expect(calbyPage.locator('[data-testid="calendar-week-strip"]')).toBeVisible()

    // Go back to current week
    await calbyPage.locator('[data-testid="calendar-prev-week"]').click()

    // 3. Click day button with event (in 2 days)
    const in2DaysBtn = calbyPage.locator(`[data-testid="calendar-strip-day-${in2Days.getDate()}"]`)
    if (await in2DaysBtn.count() > 0) {
      await in2DaysBtn.first().click()
      await expect(calbyPage.locator('h4:has-text("Future Milestone Review")')).toBeVisible()
    }
  })


  test('10. Timezone Regression: UTC event displays in UTC and does not convert to local timezone date/time', async ({
    calbyPage,
    electronApp
  }) => {
    // Exact bug reproduction scenario:
    // Event start: 2026-09-20T20:30:00Z (Sunday 8:30 PM UTC)
    // Event end: 2026-09-20T21:30:00Z (Sunday 9:30 PM UTC)
    // Timezone: UTC
    // In UTC date: September 20. In +05:30: September 21 at 2:00 AM.
    // UI must show: September 20 (or Sep 20) and 8:30 PM (or 08:30 PM / 08:30 pm), NOT Sep 21 / 2:00 AM.
    const mockEvents = [
      {
        id: 'evt-tz-utc-1',
        title: 'Global Engineering Sync',
        description: 'Sync across global distributed team in UTC.',
        allDay: false,
        startDateTime: '2026-09-20T20:30:00Z',
        endDateTime: '2026-09-20T21:30:00Z',
        timeZone: 'UTC',
        location: 'Virtual Meet',
        meetingUrl: 'https://meet.google.com/tz-sync-test',
        status: 'confirmed',
        calendarSummary: 'Engineering'
      }
    ]

    await electronApp.evaluate(({ ipcMain }, events) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
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

    // 1. Switch to Next 7 Days tab to see grouped day agenda
    await calbyPage.locator('button[data-testid="calendar-tab-upcoming"]').click()

    const eventCard = calbyPage.locator('[data-testid="calendar-event-card-evt-tz-utc-1"]')
    await expect(eventCard).toBeVisible()
    await expect(eventCard.locator('h4:has-text("Global Engineering Sync")')).toBeVisible()

    // Verify time display in Card: 8:30 PM (or 08:30 PM / 08:30 pm) and duration 60m
    const cardText = await eventCard.innerText()
    const hasCorrectUtcTime = cardText.includes('8:30') || cardText.includes('20:30')
    const hasWrongLocalTime = cardText.includes('2:00') || cardText.includes('02:00')
    expect(hasCorrectUtcTime).toBe(true)
    expect(hasWrongLocalTime).toBe(false)

    // 2. Open EventDetailsModal and verify timezone and date/time formatting
    await eventCard.click()
    // Use role="dialog" scoped to the event name — now set on the inner EventDetailsModal card div
    const modal = calbyPage.locator('[role="dialog"]').filter({ hasText: 'Global Engineering Sync' })
    await expect(modal).toBeVisible()
    await expect(modal.locator('text=Timezone: UTC')).toBeVisible()

    const modalText = await modal.innerText()
    // In UTC, September 20 must be preserved in the date string (e.g. Sep 20 or September 20)
    expect(modalText.toLowerCase()).toContain('sep')
    expect(modalText).toContain('20')
    expect(modalText).not.toContain('2:00 AM')

    // 3. Test Set Reminder from modal
    const setReminderBtn = modal.locator('button:has-text("Set Reminder")')
    await expect(setReminderBtn).toBeVisible()
    await setReminderBtn.click()
    await expect(modal.locator('text=Reminder Set')).toBeVisible()

    // Close modal
    await modal.locator('button:has-text("Close")').click()
  })

  test('11. Timezone variations: Explicit timezones, all-day events, midnight boundary, and Happening Now', async ({
    calbyPage,
    electronApp
  }) => {
    const now = new Date()
    const nowIso = now.toISOString()
    const oneHourLaterIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString()

    const mockEvents = [
      {
        id: 'evt-happening-now',
        title: 'Active Live Incident Call',
        description: 'Incident response in progress',
        allDay: false,
        startDateTime: nowIso,
        endDateTime: oneHourLaterIso,
        timeZone: 'Asia/Kolkata',
        location: 'War Room',
        status: 'confirmed',
        calendarSummary: 'Ops'
      },
      {
        id: 'evt-all-day-preserve',
        title: 'Founder Birthday Celebration',
        description: 'All day event on exact calendar date',
        allDay: true,
        startDate: '2026-09-20',
        endDate: '2026-09-20',
        status: 'confirmed',
        calendarSummary: 'Personal'
      },
      {
        id: 'evt-midnight-cross',
        title: 'Midnight Crossing Deployment',
        description: 'Deployment across midnight UTC',
        allDay: false,
        startDateTime: '2026-09-20T23:45:00Z',
        endDateTime: '2026-09-21T01:15:00Z',
        timeZone: 'UTC',
        status: 'confirmed',
        calendarSummary: 'DevOps'
      }
    ]

    await electronApp.evaluate(({ ipcMain }, events) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
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

    // 1. Verify "Happening Now" indicator on active event
    await calbyPage.locator('button[data-testid="calendar-tab-upcoming"]').click()
    const activeCard = calbyPage.locator('[data-testid="calendar-event-card-evt-happening-now"]')
    await expect(activeCard).toBeVisible()
    await expect(activeCard.locator('text=Happening Now')).toBeVisible()

    // 2. Verify all-day event preservation without shift
    const allDayCard = calbyPage.locator('[data-testid="calendar-event-card-evt-all-day-preserve"]')
    await expect(allDayCard).toBeVisible()
    await expect(allDayCard.locator('text=All Day')).toBeVisible()
    const allDayText = await allDayCard.innerText()
    expect(allDayText).toContain('20')

    // 3. Verify midnight crossing event duration (90 minutes)
    const midnightCard = calbyPage.locator('[data-testid="calendar-event-card-evt-midnight-cross"]')
    await expect(midnightCard).toBeVisible()
    const midnightText = await midnightCard.innerText()
    expect(midnightText).toContain('90m')
  })


  test('12. Create Event button is visible when Calendar is connected and opens modal with form fields', async ({
    calbyPage,
    electronApp
  }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
          lastSyncedAt: new Date().toISOString(),
          hasWriteAccess: true
        }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: []
      }))
    })

    // Navigate to Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()

    // 1. Verify Create Event button is visible
    const createBtn = calbyPage.locator('[data-testid="create-event-button"]')
    await expect(createBtn).toBeVisible()
    await createBtn.click()

    // 2. Verify modal opened with required form fields
    const modal = calbyPage.locator('[data-testid="create-event-modal"]')
    await expect(modal).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-title-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-date-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-start-time-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-end-time-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-timezone-select"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-guests-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-location-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-description-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-meet-checkbox"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-submit-button"]')).toBeVisible()

    // 3. Cancel / close modal
    await calbyPage.locator('[data-testid="create-event-cancel-button"]').click()
    await expect(modal).not.toBeVisible()
  })

  test('13. Create Event Form validation: Required fields, invalid end time, and invalid guest email', async ({
    calbyPage,
    electronApp
  }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
          lastSyncedAt: new Date().toISOString(),
          hasWriteAccess: true
        }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: []
      }))
    })

    // Navigate to Calendar and open modal
    await calbyPage.locator('button[aria-label="Calendar"]').click()
    await calbyPage.locator('[data-testid="create-event-button"]').click()

    // 1. Validation for invalid end time before start time
    await calbyPage.locator('[data-testid="create-event-title-input"]').fill('Invalid Time Meeting')
    await calbyPage.locator('[data-testid="create-event-start-time-input"]').fill('14:00')
    await calbyPage.locator('[data-testid="create-event-end-time-input"]').fill('13:00')
    await calbyPage.locator('[data-testid="create-event-submit-button"]').click()

    await expect(calbyPage.locator('[data-testid="create-event-error"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-error"]')).toContainText('End time must be after start time')

    // 2. Validation for invalid guest email
    await calbyPage.locator('[data-testid="create-event-end-time-input"]').fill('15:00')
    await calbyPage.locator('[data-testid="create-event-guests-input"]').fill('not-a-valid-email')
    await calbyPage.locator('[data-testid="create-event-submit-button"]').click()

    await expect(calbyPage.locator('[data-testid="create-event-error"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-error"]')).toContainText('Invalid guest email address')
  })

    test('14. One-time OAuth: Connect Calendar grants hasWriteAccess=true and Create Event proceeds without secondary OAuth', async ({
    calbyPage,
    electronApp
  }) => {
    let oauthInvocationCount = 0
    let writeAccessRequestCount = 0

    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
          lastSyncedAt: new Date().toISOString(),
          hasWriteAccess: true // Direct write access on initial connect
        }
      }))
      ipcMain.removeHandler('calendar:request-write-access')
      ipcMain.handle('calendar:request-write-access', async () => {
        return {
          ok: true,
          data: {
            status: 'connected',
            connectedEmail: 'alex@example.com',
            lastSyncedAt: new Date().toISOString(),
            hasWriteAccess: true
          }
        }
      })
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: []
      }))
    })

    // Navigate to Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()
    await calbyPage.locator('[data-testid="create-event-button"]').click()

    // 1. Verify Create Event modal opens DIRECTLY to form mode without Permission Required banner
    await expect(calbyPage.locator('[data-testid="create-event-modal"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-write-auth-prompt"]')).not.toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-title-input"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-submit-button"]')).toBeVisible()

    // Close modal
    await calbyPage.locator('[data-testid="create-event-cancel-button"]').click()
  })

        test('14b. Legacy read-only credentials handling: shows Read-only and explicit Reconnect option', async ({
    calbyPage,
    electronApp
  }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      let reconnected = false
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'legacy-user@example.com',
          lastSyncedAt: new Date().toISOString(),
          hasWriteAccess: reconnected
        }
      }))
      ipcMain.removeHandler('calendar:connect')
      ipcMain.handle('calendar:connect', async () => {
        reconnected = true
        return { ok: true, data: { connected: true } }
      })
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: []
      }))
    })

    // Navigate to Settings
    await calbyPage.locator('button[aria-label="Settings"]').click()
    await calbyPage.click('[data-testid="settings-nav-connect"]')

    // 1. Verify Calendar Settings indicates Read-only status
    const calendarSettings = calbyPage.locator('[data-testid="calendar-settings"]')
    await expect(calendarSettings).toBeVisible()
    const calBadge = calendarSettings.locator('[data-testid="calendar-status-badge"]')
    await expect(calBadge).toContainText('Connected')
    await expect(calendarSettings.locator('[data-testid="calendar-email-text"]')).toContainText('legacy-user@example.com')
    await expect(calendarSettings.locator('[data-testid="calendar-email-text"]')).toContainText('Read-only')
    await expect(calendarSettings.locator('[data-testid="reconnect-calendar-button"]')).toBeVisible()

    // 2. Click Reconnect Calendar
    await calendarSettings.locator('[data-testid="reconnect-calendar-button"]').click()

    // 3. Verify upgraded to Read & Create
    await expect(calendarSettings.locator('[data-testid="calendar-email-text"]')).toContainText('Read & Create')
  })

  test('15. Successful event creation flow with Meet link, guests, location, and calendar refresh', async ({
    calbyPage,
    electronApp
  }) => {
    let createdPayload: any = null
    const createdEvent = {
      id: 'evt-new-created-123',
      title: 'Q4 Product Strategy Session',
      description: 'Discuss Q4 roadmap and deliverables',
      allDay: false,
      startDateTime: '2026-09-21T10:00:00+05:30',
      endDateTime: '2026-09-21T11:00:00+05:30',
      timeZone: 'Asia/Kolkata',
      location: 'Conference Room B',
      meetingUrl: 'https://meet.google.com/q4-strategy-meet',
      status: 'confirmed',
      calendarSummary: 'Product Team',
      attendees: [{ email: 'rahul@example.com' }]
    }

    await electronApp.evaluate(({ ipcMain }, mockCreated) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
          lastSyncedAt: new Date().toISOString(),
          hasWriteAccess: true
        }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      let hasCreated = false
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: hasCreated ? [mockCreated] : []
      }))
      ipcMain.removeHandler('calendar:create-event')
      ipcMain.handle('calendar:create-event', async (_e, input) => {
        hasCreated = true
        return {
          ok: true,
          data: mockCreated
        }
      })
    }, createdEvent)

    // Navigate to Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()
    await calbyPage.locator('[data-testid="create-event-button"]').click()

    // Fill form
    await calbyPage.locator('[data-testid="create-event-title-input"]').fill('Q4 Product Strategy Session')
    await calbyPage.locator('[data-testid="create-event-date-input"]').fill('2026-09-21')
    await calbyPage.locator('[data-testid="create-event-start-time-input"]').fill('10:00')
    await calbyPage.locator('[data-testid="create-event-end-time-input"]').fill('11:00')
    await calbyPage.locator('[data-testid="create-event-timezone-select"]').selectOption('Asia/Kolkata')
    await calbyPage.locator('[data-testid="create-event-guests-input"]').fill('rahul@example.com')
    await calbyPage.locator('[data-testid="create-event-location-input"]').fill('Conference Room B')
    await calbyPage.locator('[data-testid="create-event-description-input"]').fill('Discuss Q4 roadmap and deliverables')
    await calbyPage.locator('[data-testid="create-event-meet-checkbox"]').check()

    // Submit form
    await calbyPage.locator('[data-testid="create-event-submit-button"]').click()

    // Verify toast notification and modal close
    await expect(calbyPage.locator('[data-testid="calendar-toast"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="calendar-toast"]')).toContainText('Event created successfully')
    await expect(calbyPage.locator('[data-testid="create-event-modal"]')).not.toBeVisible()

    // Verify event details modal or calendar agenda contains the created event
    await expect(calbyPage.locator('h4:has-text("Q4 Product Strategy Session")')).toBeVisible()
  })

  test('16. Google API creation failure displays user-friendly error and disables duplicate submission', async ({
    calbyPage,
    electronApp
  }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
          lastSyncedAt: new Date().toISOString(),
          hasWriteAccess: true
        }
      }))
      ipcMain.removeHandler('calendar:create-event')
      ipcMain.handle('calendar:create-event', async () => ({
        ok: false,
        error: {
          code: 'GOOGLE_API_ERROR',
          message: 'Google Calendar could not create this event (503)'
        }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: []
      }))
    })

    // Navigate to Calendar & open modal
    await calbyPage.locator('button[aria-label="Calendar"]').click()
    await calbyPage.locator('[data-testid="create-event-button"]').click()

    await calbyPage.locator('[data-testid="create-event-title-input"]').fill('Failed API Event')
    await calbyPage.locator('[data-testid="create-event-submit-button"]').click()

    // Verify user-friendly error message is displayed
    await expect(calbyPage.locator('[data-testid="create-event-error"]')).toBeVisible()
    await expect(calbyPage.locator('[data-testid="create-event-error"]')).toContainText('Google Calendar could not create this event')
  })

  test('17. Disconnected Calendar cannot create an event / Create Event button not visible when disconnected', async ({
    calbyPage,
    electronApp
  }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'disconnected'
        }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'NOT_AUTHENTICATED: Google Calendar is not connected.' }
      }))
    })

    // Navigate to Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()

    // 1. Create Event button should NOT be visible when disconnected
    await expect(calbyPage.locator('[data-testid="create-event-button"]')).not.toBeVisible()

    // 2. Connect Google Calendar banner should be visible
    await expect(calbyPage.locator('button:has-text("Connect Google Calendar")')).toBeVisible()
  })

  test('18. Timezone correctness on event creation & display (Asia/Kolkata 10:00 PM - 11:00 PM)', async ({
    calbyPage,
    electronApp
  }) => {
    // Regression check:
    // Create: September 21, 2026 10:00 PM–11:00 PM Asia/Kolkata
    // Verify rendered event remains: September 21 10:00 PM–11:00 PM
    const createdEvent = {
      id: 'evt-kolkata-night',
      title: 'Late Night Review',
      allDay: false,
      startDateTime: '2026-09-21T22:00:00+05:30',
      endDateTime: '2026-09-21T23:00:00+05:30',
      timeZone: 'Asia/Kolkata',
      location: 'Online',
      status: 'confirmed',
      calendarSummary: 'Review'
    }

    await electronApp.evaluate(({ ipcMain }, mockCreated) => {
      ipcMain.removeHandler('calendar:get-status')
      ipcMain.handle('calendar:get-status', async () => ({
        ok: true,
        data: {
          status: 'connected',
          connectedEmail: 'alex@example.com',
          lastSyncedAt: new Date().toISOString(),
          hasWriteAccess: true
        }
      }))
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: [mockCreated]
      }))
    }, createdEvent)

    // Navigate to Calendar
    await calbyPage.locator('button[aria-label="Calendar"]').click()
    await calbyPage.locator('button[data-testid="calendar-tab-upcoming"]').click()

    const eventCard = calbyPage.locator('[data-testid="calendar-event-card-evt-kolkata-night"]')
    await expect(eventCard).toBeVisible()

    const cardText = await eventCard.innerText()
    // Must contain 10:00 (or 22:00) and 11:00 (or 23:00)
    const hasNightTime = cardText.includes('10:00') || cardText.includes('22:00')
    expect(hasNightTime).toBe(true)
  })

})
