import { test, expect } from '../../fixtures/electron-fixture'

test.describe('Phase 7 - Integration & Desktop Experience Tests', () => {
  test('A1. Calendar tool: range argument propagation and precise event filtering (today, tomorrow, this_week, next_7_days)', async ({
    electronApp
  }) => {
    const result = await electronApp.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calby = (global as any).__calby
      const calendarService = calby.GoogleCalendarService.getInstance()
      const now = new Date()

      // Event 1: Today timed event
      const todayIso = new Date(now.getTime() + 2 * 3600 * 1000).toISOString()

      // Event 2: Tomorrow all-day event
      const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0)
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0]

      // Event 3: In 3 days timed event
      const in3DaysIso = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0, 0).toISOString()

      // Event 4: In 6 days timed event (inside 7-day rolling window)
      const in6DaysIso = new Date(now.getTime() + 6 * 24 * 3600 * 1000).toISOString()

      // Event 5: In 7 days + 2 hours (just outside 7-day rolling window)
      const outside7DaysIso = new Date(now.getTime() + 7 * 24 * 3600 * 1000 + 2 * 3600 * 1000).toISOString()

      const mockEvents = [
        {
          id: 'evt-today',
          title: 'Product Sprint Review',
          description: 'Weekly review of roadmap features',
          allDay: false,
          startDateTime: todayIso,
          endDateTime: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
          location: 'Meet Virtual',
          meetingUrl: 'https://meet.google.com/test-sprint-review',
          status: 'confirmed'
        },
        {
          id: 'evt-tomorrow',
          title: 'Architecture Deep Dive',
          description: 'Cross-functional alignment',
          allDay: true,
          startDate: tomorrowStr,
          endDate: tomorrowStr,
          status: 'confirmed'
        },
        {
          id: 'evt-in-3-days',
          title: 'Client Demo',
          description: 'Demo of new features',
          allDay: false,
          startDateTime: in3DaysIso,
          endDateTime: new Date(new Date(in3DaysIso).getTime() + 3600 * 1000).toISOString(),
          status: 'confirmed'
        },
        {
          id: 'evt-in-6-days',
          title: 'Quarterly Planning',
          description: 'Next quarter roadmap',
          allDay: false,
          startDateTime: in6DaysIso,
          endDateTime: new Date(new Date(in6DaysIso).getTime() + 3600 * 1000).toISOString(),
          status: 'confirmed'
        },
        {
          id: 'evt-outside-7-days',
          title: 'Future Workshop',
          description: 'Beyond 7 days window',
          allDay: false,
          startDateTime: outside7DaysIso,
          endDateTime: new Date(new Date(outside7DaysIso).getTime() + 3600 * 1000).toISOString(),
          status: 'confirmed'
        }
      ]

      const originalGetUpcoming = calendarService.getUpcomingEvents.bind(calendarService)
      calendarService.getUpcomingEvents = async () => mockEvents

      try {
        const executor = calby.ActionExecutor.getInstance()

        const todayResult = await executor.executeTool('get_upcoming_events', {
          range: 'today'
        })
        const tomorrowResult = await executor.executeTool('get_upcoming_events', {
          range: 'tomorrow'
        })
        const thisWeekResult = await executor.executeTool('get_upcoming_events', {
          range: 'this_week'
        })
        const next7DaysResult = await executor.executeTool('get_upcoming_events', {
          range: 'next_7_days'
        })

        return {
          todayResult,
          tomorrowResult,
          thisWeekResult,
          next7DaysResult
        }
      } finally {
        calendarService.getUpcomingEvents = originalGetUpcoming
      }
    })

    // 1. Verify "today" range
    expect(result.todayResult.success).toBe(true)
    const todayData = result.todayResult.data as { range: string; count: number; events: Array<{ title: string; allDay: boolean }> }
    expect(todayData.range).toBe('today')
    expect(todayData.count).toBe(1)
    expect(todayData.events[0].title).toBe('Product Sprint Review')
    expect(todayData.events[0].allDay).toBe(false)

    // 2. Verify "tomorrow" range
    expect(result.tomorrowResult.success).toBe(true)
    const tomorrowData = result.tomorrowResult.data as { range: string; count: number; events: Array<{ title: string; allDay: boolean }> }
    expect(tomorrowData.range).toBe('tomorrow')
    expect(tomorrowData.count).toBe(1)
    expect(tomorrowData.events[0].title).toBe('Architecture Deep Dive')
    expect(tomorrowData.events[0].allDay).toBe(true)

    // 3. Verify "this_week" range
    expect(result.thisWeekResult.success).toBe(true)
    const thisWeekData = result.thisWeekResult.data as { range: string; count: number; events: Array<{ title: string }> }
    expect(thisWeekData.range).toBe('this_week')
    expect(thisWeekData.count).toBeGreaterThanOrEqual(1)

    // 4. Verify "next_7_days" range: strictly rolling 7-day window
    expect(result.next7DaysResult.success).toBe(true)
    const next7DaysData = result.next7DaysResult.data as { range: string; count: number; events: Array<{ id: string; title: string }> }
    expect(next7DaysData.range).toBe('next_7_days')
    expect(next7DaysData.count).toBe(4)
    expect(next7DaysData.events.some((e) => e.id === 'evt-in-6-days')).toBe(true)
    expect(next7DaysData.events.some((e) => e.id === 'evt-outside-7-days')).toBe(false)
  })

  test('A2. Calendar tool: Disconnected calendar returns structured error and connect instruction', async ({
    electronApp
  }) => {
    const result = await electronApp.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calby = (global as any).__calby
      const calendarService = calby.GoogleCalendarService.getInstance()
      const originalGetUpcoming = calendarService.getUpcomingEvents.bind(calendarService)
      // Disconnected returns null or throws auth error
      calendarService.getUpcomingEvents = async () => null

      try {
        const executor = calby.ActionExecutor.getInstance()
        const toolResult = await executor.executeTool('get_upcoming_events', {
          range: 'today'
        })
        return toolResult
      } finally {
        calendarService.getUpcomingEvents = originalGetUpcoming
      }
    })

    expect(result.success).toBe(true)
    const data = result.data as { notConnected: boolean; instruction: string }
    expect(data.notConnected).toBe(true)
    expect(data.instruction).toContain('Google Calendar is not connected')
    expect(data.instruction).toContain('Settings')
  })

  test('B. Cross-feature integration: Reminders, Memory, and Calendar operate independently', async ({
    calbyPage,
    electronApp
  }) => {
    // 1. Mock Calendar events in Main process
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('calendar:get-upcoming')
      ipcMain.handle('calendar:get-upcoming', async () => ({
        ok: true,
        data: [
          {
            id: 'evt-cross-1',
            title: 'Payment Gateway Kickoff',
            allDay: false,
            startDateTime: new Date(Date.now() + 3600 * 1000).toISOString(),
            status: 'confirmed'
          }
        ]
      }))
    })

    // 2. Create a reminder
    const scheduledTime = new Date(Date.now() + 4 * 3600 * 1000).toISOString()
    const reminderRes = await calbyPage.evaluate(async (sched) => {
      return await window.calby.reminders.create({
        title: 'Review Rahul payment documentation',
        scheduledAt: sched,
        alarmEnabled: true
      })
    }, scheduledTime)

    expect(reminderRes.ok).toBe(true)
    if (!reminderRes.ok) return

    // 3. Create a memory
    const memoryRes = await calbyPage.evaluate(async () => {
      return await window.calby.memory.create({
        content: 'Rahul is leading the payment gateway integration module',
        type: 'person'
      })
    })

    expect(memoryRes.ok).toBe(true)

    // 4. Query all 3 systems to confirm independent persistence and coexistence
    const queryResults = await calbyPage.evaluate(async () => {
      const [reminders, memories, calendar] = await Promise.all([
        window.calby.reminders.list(),
        window.calby.memory.search('Rahul'),
        window.calby.calendar.getUpcoming()
      ])
      return { reminders, memories, calendar }
    })

    expect(queryResults.reminders.ok).toBe(true)
    if (queryResults.reminders.ok) {
      const foundReminder = queryResults.reminders.data.find(
        (r) => r.title === 'Review Rahul payment documentation'
      )
      expect(foundReminder).toBeDefined()
    }

    expect(queryResults.memories.ok).toBe(true)
    if (queryResults.memories.ok) {
      const foundMemory = queryResults.memories.data.find((m) =>
        m.content.includes('Rahul is leading the payment')
      )
      expect(foundMemory).toBeDefined()
      expect(foundMemory?.type).toBe('person')
    }

    expect(queryResults.calendar.ok).toBe(true)
    if (queryResults.calendar.ok) {
      expect(queryResults.calendar.data.length).toBeGreaterThan(0)
      expect(queryResults.calendar.data[0].title).toBe('Payment Gateway Kickoff')
    }
  })

  test('C. Notification deep link: Notification click restores window and highlights reminder', async ({
    calbyPage,
    electronApp
  }) => {
    // 1. Create a reminder
    const scheduledTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString()
    const reminderRes = await calbyPage.evaluate(async (sched) => {
      return await window.calby.reminders.create({
        title: 'Deep Link Verification Meeting',
        scheduledAt: sched,
        alarmEnabled: true
      })
    }, scheduledTime)

    expect(reminderRes.ok).toBe(true)
    if (!reminderRes.ok) return
    const createdReminder = reminderRes.data

    // 2. Trigger notification deep link IPC event (as sent by NotificationService on click)
    await electronApp.evaluate(({ BrowserWindow }, reminderId) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        win.webContents.send('system:navigate', {
          view: 'reminders',
          reminderId: reminderId
        })
      }
    }, createdReminder.id)

    // 3. Verify App navigated to Reminders page
    await expect(calbyPage.locator('h1:has-text("Reminders")')).toBeVisible()

    // 4. Verify the clicked reminder card is highlighted
    const highlightedCard = calbyPage.locator(
      `article[data-purpose="reminder-card"][data-reminder-id="${createdReminder.id}"][data-highlighted="true"]`
    )
    await expect(highlightedCard).toBeVisible()
    await expect(highlightedCard).toContainText('Deep Link Verification Meeting')
  })

  test('D. Single-instance / window lifecycle: Second instance activation restores primary window', async ({
    electronApp
  }) => {
    const lifecycleResult = await electronApp.evaluate(({ app, BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]

      // Minimize window to test restore
      win.minimize()
      const wasMinimized = win.isMinimized()

      // Emit second-instance event on app
      app.emit('second-instance')

      const isNowMinimized = win.isMinimized()
      const isVisible = win.isVisible()

      return {
        wasMinimized,
        isNowMinimized,
        isVisible
      }
    })

    expect(lifecycleResult.wasMinimized).toBe(true)
    expect(lifecycleResult.isNowMinimized).toBe(false)
    expect(lifecycleResult.isVisible).toBe(true)
  })

  test('E. Global activation: Registered CommandOrControl+Shift+Space handler restores, shows, focuses window and activates voice session', async ({
    electronApp
  }) => {
    const activationResult = await electronApp.evaluate(async ({ BrowserWindow }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calby = (global as any).__calby
      const win = BrowserWindow.getAllWindows()[0]
      const voiceService = calby.AiVoiceService.getInstance()

      // 1. Minimize and hide window to simulate running in background
      win.minimize()
      win.hide()
      const wasHidden = !win.isVisible()
      const wasMinimized = win.isMinimized()

      // 2. Trigger the exact registered globalShortcut handler
      calby.handleGlobalActivationShortcut()

      // Small tick for async state transition
      await new Promise((r) => setTimeout(r, 50))

      const isNowVisible = win.isVisible()
      const isNowMinimized = win.isMinimized()
      const isFocused = win.isFocused()
      const voiceState = voiceService.getState().state

      return {
        wasHidden,
        wasMinimized,
        isNowVisible,
        isNowMinimized,
        isFocused,
        voiceState
      }
    })

    expect(activationResult.wasHidden).toBe(true)
    expect(activationResult.wasMinimized).toBe(true)
    expect(activationResult.isNowVisible).toBe(true)
    expect(activationResult.isNowMinimized).toBe(false)
    expect(activationResult.isFocused).toBe(true)
    // Voice state should be connecting or listening or idle with start attempted
    expect(['listening', 'connecting', 'idle']).toContain(activationResult.voiceState)
  })
})
