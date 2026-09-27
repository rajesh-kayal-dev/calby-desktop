import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// ActionExecutor is exercised end-to-end at the tool boundary with the
// calendar + reminder backends faked. Focus: validation-before-execution,
// structured results, safe error messages, and connection-state handling.
// ---------------------------------------------------------------------------

type Status = { status: string; hasWriteAccess: boolean; error?: string | null }

const calendarState = vi.hoisted(() => ({
  status: 'connected' as string,
  events: null as unknown[] | null,
  throwOnGet: null as Error | null,
  getEventResult: null as { id: string; title: string } | null,
  throwOnGetEvent: null as Error | null,
  updateResult: null as unknown,
  deleteResult: { deleted: true, alreadyGone: false },
  calls: { update: [] as unknown[], delete: [] as string[] }
}))

vi.mock('./google-calendar.service', () => {
  class FakeGoogleCalendarService {
    private static instance: FakeGoogleCalendarService | null = null
    public static getInstance(): FakeGoogleCalendarService {
      if (!FakeGoogleCalendarService.instance) FakeGoogleCalendarService.instance = new FakeGoogleCalendarService()
      return FakeGoogleCalendarService.instance
    }
    public async getStatus(): Promise<Status> {
      return {
        status: calendarState.status,
        hasWriteAccess: true,
        error: null
      }
    }
    public async getUpcomingEvents(): Promise<unknown[] | null> {
      if (calendarState.throwOnGet) throw calendarState.throwOnGet
      return calendarState.events
    }
    public async getEvent(id: string): Promise<{ id: string; title: string }> {
      if (calendarState.throwOnGetEvent) throw calendarState.throwOnGetEvent
      if (!calendarState.getEventResult) throw new Error('EVENT_NOT_FOUND: gone')
      expect(id).toBeTruthy()
      return calendarState.getEventResult
    }
    public async updateEvent(id: string, patch: unknown): Promise<unknown> {
      calendarState.calls.update.push({ id, patch })
      if (!calendarState.updateResult) throw new Error('GOOGLE_API_ERROR: nope (500)')
      return calendarState.updateResult
    }
    public async deleteEvent(id: string): Promise<{ deleted: boolean; alreadyGone: boolean }> {
      calendarState.calls.delete.push(id)
      return calendarState.deleteResult
    }
    public async createEvent(input: unknown): Promise<unknown> {
      return { id: 'new-evt', title: (input as { title: string }).title, allDay: false }
    }
  }
  return { GoogleCalendarService: FakeGoogleCalendarService }
})

vi.mock('./reminder.service', () => {
  const store = new Map<string, Record<string, unknown>>()
  let nextId = 1

  class FakeReminderService {
    private static instance: FakeReminderService | null = null
    public static getInstance(): FakeReminderService {
      if (!FakeReminderService.instance) FakeReminderService.instance = new FakeReminderService()
      return FakeReminderService.instance
    }
    public static __store = store

    public listAll(): Record<string, unknown>[] {
      return [...store.values()]
    }
    public getById(id: string): Record<string, unknown> | null {
      return store.get(id) ?? null
    }
    public async createWithResult(input: Record<string, unknown>): Promise<{
      reminder: Record<string, unknown>
      alreadyExisted: boolean
    }> {
      const dedupeKey = `${String(input.eventId ?? '')}:${String(input.title)}:${String(input.scheduledAt)}`
      if (input.eventId) {
        for (const r of store.values()) {
          if (r.dedupeKey === dedupeKey) return { reminder: r, alreadyExisted: true }
        }
      }
      const reminder = {
        id: `r-${nextId++}`,
        title: input.title,
        scheduledAt: input.scheduledAt,
        status: 'scheduled',
        alertType: input.alertType ?? 'notification',
        eventId: input.eventId ?? null,
        leadMinutes: input.leadMinutes ?? null,
        source: input.source ?? null,
        dedupeKey
      }
      store.set(reminder.id as string, reminder)
      return { reminder, alreadyExisted: false }
    }
    public async create(input: Record<string, unknown>): Promise<Record<string, unknown>> {
      return (await this.createWithResult(input)).reminder
    }
    public async update(input: Record<string, unknown>): Promise<Record<string, unknown>> {
      const existing = store.get(String(input.id))
      if (!existing) throw new Error(`Reminder with id "${String(input.id)}" not found.`)
      const next = { ...existing, ...input }
      store.set(String(input.id), next)
      return next
    }
    public async delete(id: string): Promise<{ id: string }> {
      if (!store.has(id)) throw new Error(`Reminder with id "${id}" not found.`)
      store.delete(id)
      return { id }
    }
    public async snooze(id: string, minutes: number): Promise<Record<string, unknown>> {
      const existing = store.get(id)
      if (!existing) throw new Error('not found')
      const next = { ...existing, snoozeMinutes: minutes }
      store.set(id, next)
      return next
    }
  }
  return { ReminderService: FakeReminderService }
})

vi.mock('./memory.service', () => {
  class FakeMemoryService {
    private static instance: FakeMemoryService | null = null
    public static getInstance(): FakeMemoryService {
      if (!FakeMemoryService.instance) FakeMemoryService.instance = new FakeMemoryService()
      return FakeMemoryService.instance
    }
    public listAll(): unknown[] {
      return []
    }
    public getById(): unknown {
      return null
    }
  }
  return { MemoryService: FakeMemoryService }
})

vi.mock('./voice-trace', () => {
  const recorded: Array<{ stage: string; detail: unknown }> = []
  return {
    getVoiceTrace: () => ({
      record: (stage: string, detail: unknown) => recorded.push({ stage, detail }),
      getTrace: () => recorded,
      clear: () => recorded.length = 0
    })
  }
})

import { ActionExecutor } from './action-executor'
import { ReminderService } from './reminder.service'

const HOUR = 3600 * 1000
const futureIso = (ms: number): string => new Date(Date.now() + ms).toISOString()

function upcomingEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'evt-1',
    title: 'Design review',
    allDay: false,
    startDateTime: futureIso(HOUR),
    endDateTime: futureIso(HOUR + 1800 * 1000),
    startDate: null,
    endDate: null,
    timeZone: 'Asia/Kolkata',
    location: null,
    meetingUrl: null,
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] },
    ...overrides
  }
}

describe('ActionExecutor tool contract', () => {
  let executor: ActionExecutor

  beforeEach(() => {
    executor = ActionExecutor.getInstance()
    calendarState.status = 'connected'
    calendarState.events = null
    calendarState.throwOnGet = null
    calendarState.getEventResult = null
    calendarState.throwOnGetEvent = null
    calendarState.updateResult = null
    calendarState.deleteResult = { deleted: true, alreadyGone: false }
    calendarState.calls = { update: [], delete: [] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ReminderService as any).__store.clear()
  })

  it('exposes every declared tool in the executor switch', async () => {
    const declarations = executor.getToolDeclarations()
    expect(declarations.length).toBeGreaterThan(0)
    const names = new Set(declarations.map((d) => d.name))
    for (const required of [
      'create_reminder',
      'list_reminders',
      'get_upcoming_events',
      'create_calendar_event',
      'update_calendar_event',
      'delete_calendar_event',
      'update_reminder',
      'delete_reminder'
    ]) {
      expect(names.has(required)).toBe(true)
    }
    // Deprecated alias must still exist for older prompts.
    expect(names.has('cancel_reminder')).toBe(true)
  })

  it('every declaration has a description and object parameters', () => {
    for (const d of executor.getToolDeclarations()) {
      expect(d.description.length).toBeGreaterThan(10)
      expect(d.parameters.type).toBe('OBJECT')
      expect(typeof d.parameters.properties).toBe('object')
    }
  })

  describe('get_upcoming_events', () => {
    it('reports not-connected when the backend says disconnected', async () => {
      calendarState.status = 'disconnected'
      const result = await executor.executeTool('get_upcoming_events', {})
      expect(result.success).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any
      expect(data.notConnected).toBe(true)
      expect(data.instruction).toContain('Google Calendar is not connected')
      expect(data.instruction).toContain('Settings')
      expect(calendarState.throwOnGet).toBeNull()
    })

    it('reports not-connected when reauthorization is required', async () => {
      calendarState.status = 'reauth_required'
      const result = await executor.executeTool('get_upcoming_events', {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).notConnected).toBe(true)
    })

    it('keeps the e2e contract: null events from the backend means not connected', async () => {
      calendarState.status = 'connected'
      calendarState.events = null
      const result = await executor.executeTool('get_upcoming_events', {})
      expect(result.success).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any
      expect(data.notConnected).toBe(true)
      expect(data.instruction).toContain('Google Calendar is not connected')
    })

    it('returns timezone-normalized events with top-level id/title/allDay', async () => {
      calendarState.events = [upcomingEvent()]
      const result = await executor.executeTool('get_upcoming_events', { range: 'next_7_days' })
      expect(result.success).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any
      expect(data.userTimeZone).toBeTruthy()
      expect(data.count).toBe(1)

      const evt = data.events[0]
      expect(evt.id).toBe('evt-1')
      expect(evt.title).toBe('Design review')
      expect(evt.allDay).toBe(false)
      expect(evt.timeZone).toBe('Asia/Kolkata')
      expect(evt.startHumanReadable).toBeTruthy()
      expect(evt.endHumanReadable).toBeTruthy()
      // Reminders are separate lead times, never a start time.
      expect(evt.reminders.overrides[0].minutesBefore).toBe(5)
      expect(typeof evt.startDateTime).toBe('string')
    })

    it('maps transient network failures to a safe message, not "not connected"', async () => {
      calendarState.throwOnGet = new Error('CALENDAR_UNAVAILABLE: fetch failed')
      const result = await executor.executeTool('get_upcoming_events', {})
      expect(result.success).toBe(false)
      expect(result.message).toBe("Can't reach Google Calendar right now. Check your internet connection.")
      expect(result.message).not.toContain('CALENDAR_UNAVAILABLE')
      expect(result.message).not.toContain('fetch failed')
    })

    it('maps auth failures to the not-connected payload', async () => {
      calendarState.throwOnGet = new Error('NOT_AUTHENTICATED: no tokens')
      const result = await executor.executeTool('get_upcoming_events', {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).notConnected).toBe(true)
    })

    it('never leaks raw internal errors for unknown failures', async () => {
      calendarState.throwOnGet = new Error('SQLITE_CORRUPT: /home/user/secret/path.db')
      const result = await executor.executeTool('get_upcoming_events', {})
      expect(result.success).toBe(false)
      expect(result.message).not.toContain('SQLITE_CORRUPT')
      expect(result.message).not.toContain('secret/path.db')
    })
  })

  describe('update_calendar_event validation flow', () => {
    it('asks for missing info instead of guessing', async () => {
      const result = await executor.executeTool('update_calendar_event', {
        eventId: 'evt-1'
      })
      expect(result.success).toBe(false)
      expect(result.needsClarification).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).code).toBe('missing_info')
      expect(calendarState.calls.update).toHaveLength(0)
    })

    it('asks which event when the title matches several', async () => {
      calendarState.events = [
        upcomingEvent({ id: 'a', title: 'Team sync daily' }),
        upcomingEvent({ id: 'b', title: 'Team sync weekly' })
      ]

      const result = await executor.executeTool('update_calendar_event', {
        title: 'Team sync',
        newTitle: 'Team sync renamed'
      })

      expect(result.success).toBe(false)
      expect(result.ambiguous).toBe(true)
      expect(result.needsClarification).toBe(true)
      expect(result.message).toContain('Team sync')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).candidates.length).toBe(2)
      // Nothing was written.
      expect(calendarState.calls.update).toHaveLength(0)
    })

    it('proceeds without asking when exactly one event matches', async () => {
      calendarState.events = [upcomingEvent({ id: 'only', title: 'Dentist' })]
      calendarState.updateResult = upcomingEvent({ id: 'only', title: 'Dentist renamed' })

      const result = await executor.executeTool('update_calendar_event', {
        title: 'Dentist',
        newTitle: 'Dentist renamed'
      })

      expect(result.success).toBe(true)
      expect(calendarState.calls.update).toHaveLength(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).verified).toBe(true)
    })

    it('reports honestly when nothing matches', async () => {
      calendarState.events = [upcomingEvent({ id: 'x', title: 'Unrelated' })]

      const result = await executor.executeTool('update_calendar_event', {
        title: 'Ghost meeting',
        newTitle: 'Renamed'
      })

      expect(result.success).toBe(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).code).toBe('not_found')
      expect(calendarState.calls.update).toHaveLength(0)
    })

    it('does not claim success when the provider write fails', async () => {
      calendarState.getEventResult = { id: 'evt-1', title: 'Standup' }
      calendarState.updateResult = null // updateEvent throws GOOGLE_API_ERROR

      const result = await executor.executeTool('update_calendar_event', {
        eventId: 'evt-1',
        newTitle: 'Standup renamed'
      })

      expect(result.success).toBe(false)
      expect(result.message).not.toContain('GOOGLE_API_ERROR')
      expect(result.message).not.toContain('500')
      expect(calendarState.calls.update).toHaveLength(1)
    })
  })

  describe('delete_calendar_event validation flow', () => {
    it('requires an identifier', async () => {
      const result = await executor.executeTool('delete_calendar_event', {})
      expect(result.success).toBe(false)
      expect(result.needsClarification).toBe(true)
      expect(calendarState.calls.delete).toHaveLength(0)
    })

    it('asks which event when several match rather than deleting one', async () => {
      calendarState.events = [
        upcomingEvent({ id: 'a', title: 'Party prep' }),
        upcomingEvent({ id: 'b', title: 'Party planning' })
      ]

      const result = await executor.executeTool('delete_calendar_event', { title: 'Party' })

      expect(result.success).toBe(false)
      expect(result.ambiguous).toBe(true)
      expect(calendarState.calls.delete).toHaveLength(0)
    })

    it('deletes the single match and reports the verified outcome', async () => {
      calendarState.events = [upcomingEvent({ id: 'solo', title: 'Obsolete sync' })]

      const result = await executor.executeTool('delete_calendar_event', {
        title: 'Obsolete sync'
      })

      expect(result.success).toBe(true)
      expect(calendarState.calls.delete).toEqual(['solo'])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).verified).toBe(true)
      expect(result.message).toContain('deleted')
    })

    it('is honest when the event was already gone', async () => {
      calendarState.getEventResult = { id: 'evt-9', title: 'Vanished' }
      calendarState.deleteResult = { deleted: false, alreadyGone: true }

      const result = await executor.executeTool('delete_calendar_event', { eventId: 'evt-9' })

      expect(result.success).toBe(true)
      expect(result.message).toContain('already gone')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).deleted).toBe(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).alreadyGone).toBe(true)
    })
  })

  describe('reminder tools', () => {
    const store = (): Map<string, Record<string, unknown>> =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ReminderService as any).__store

    it('delete_reminder asks which one when several match (never guesses)', async () => {
      store().set('r-1', {
        id: 'r-1',
        title: 'Dentist appointment morning',
        scheduledAt: futureIso(HOUR),
        status: 'scheduled',
        alertType: 'notification'
      })
      store().set('r-2', {
        id: 'r-2',
        title: 'Dentist appointment follow-up',
        scheduledAt: futureIso(2 * HOUR),
        status: 'scheduled',
        alertType: 'notification'
      })

      const result = await executor.executeTool('delete_reminder', {
        title: 'Dentist appointment'
      })

      expect(result.success).toBe(false)
      expect(result.ambiguous).toBe(true)
      expect(result.needsClarification).toBe(true)
      // Nothing deleted.
      expect(store().size).toBe(2)
    })

    it('delete_reminder removes the single match and verifies it is gone', async () => {
      store().clear()
      store().set('r-9', {
        id: 'r-9',
        title: 'Solo task',
        scheduledAt: futureIso(HOUR),
        status: 'scheduled',
        alertType: 'notification'
      })

      const result = await executor.executeTool('delete_reminder', { title: 'Solo task' })

      expect(result.success).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).verified).toBe(true)
      expect(store().size).toBe(0)
    })

    it('reports not-found rather than a false success', async () => {
      store().clear()
      const result = await executor.executeTool('delete_reminder', { title: 'a' })
      expect(result.success).toBe(false)
      expect(result.message).toMatch(/Couldn't find/i)
    })

    it('cancel_reminder remains a working alias', async () => {
      store().clear()
      const created = await executor.executeTool('create_reminder', {
        title: 'Alias check',
        scheduledAt: futureIso(HOUR)
      })
      expect(created.success).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (created.data as any).id as string

      const deleted = await executor.executeTool('cancel_reminder', { id })
      expect(deleted.success).toBe(true)
      expect(deleted.message).toContain('deleted')
      expect(deleted.message).toContain('Alias check')
      expect(store().size).toBe(0)
    })

    it('create_reminder reports duplicates instead of creating them', async () => {
      const payload = { title: 'Dup', scheduledAt: futureIso(HOUR), eventId: 'evt-1', leadMinutes: 5 }
      const first = await executor.executeTool('create_reminder', payload)
      const second = await executor.executeTool('create_reminder', payload)

      expect(first.success).toBe(true)
      expect(second.success).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((second.data as any).alreadyExisted).toBe(true)
      expect(second.message).toContain('already exists')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((second.data as any).id).toBe((first.data as any).id)
    })

    it('list_reminders returns normalized reminders with local time', async () => {
      await executor.executeTool('create_reminder', {
        title: 'Listed',
        scheduledAt: futureIso(HOUR)
      })

      const result = await executor.executeTool('list_reminders', {})
      expect(result.success).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any
      expect(data.userTimeZone).toBeTruthy()
      expect(Array.isArray(data.reminders)).toBe(true)
      expect(data.reminders[0].localTime).toBeTruthy()
      expect(data.reminders[0].scheduledAt).toContain('T')
    })
  })
})
