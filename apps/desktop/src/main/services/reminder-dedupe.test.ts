import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// The storage layer is faked in-memory: `better-sqlite3` ships a native binary
// compiled for Electron's ABI, which system Node cannot load. Everything above
// the repository (ReminderService idempotency, dedupe keying, validation,
// update behaviour) runs for real.
// ---------------------------------------------------------------------------

vi.mock('../storage/reminder.repository', () => {
  const ACTIVE = ['scheduled', 'triggered', 'snoozed']

  interface Row {
    id: string
    title: string
    scheduledAt: string
    alarmEnabled: boolean
    alertType: 'notification' | 'alarm'
    status: string
    snoozeCount: number
    createdAt: string
    updatedAt: string
    completedAt: string | null
    missedAt: string | null
    eventId: string | null
    leadMinutes: number | null
    dedupeKey: string | null
    source: string | null
  }

  const rows = new Map<string, Row>()

  class FakeReminderRepository {
    private static instance: FakeReminderRepository | null = null
    public static getInstance(): FakeReminderRepository {
      if (!FakeReminderRepository.instance) FakeReminderRepository.instance = new FakeReminderRepository()
      return FakeReminderRepository.instance
    }

    /** Test hook: the in-memory table. */
    public static __rows = rows

    public create(data: Record<string, unknown>): Row {
      const status = (data.status as string) || 'scheduled'
      const dedupeKey = (data.dedupeKey as string | null) ?? null

      // Mirrors the partial unique index: only ACTIVE rows are constrained.
      if (dedupeKey && ACTIVE.includes(status)) {
        for (const row of rows.values()) {
          if (row.dedupeKey === dedupeKey && ACTIVE.includes(row.status)) {
            throw new Error('UNIQUE constraint failed: reminders.dedupe_key')
          }
        }
      }

      const now = new Date().toISOString()
      const row: Row = {
        id: data.id as string,
        title: data.title as string,
        scheduledAt: new Date(data.scheduledAt as number).toISOString(),
        alarmEnabled: Boolean(data.alarmEnabled),
        alertType: (data.alertType as 'notification' | 'alarm') || 'notification',
        status,
        snoozeCount: 0,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        missedAt: null,
        eventId: (data.eventId as string | null) ?? null,
        leadMinutes: (data.leadMinutes as number | null) ?? null,
        dedupeKey,
        source: (data.source as string | null) ?? null
      }
      rows.set(row.id, row)
      return { ...row }
    }

    public findById(id: string): Row | null {
      const row = rows.get(id)
      return row ? { ...row } : null
    }

    public findByDedupeKey(dedupeKey: string): Row | null {
      for (const row of rows.values()) {
        if (row.dedupeKey === dedupeKey && ACTIVE.includes(row.status)) return { ...row }
      }
      return null
    }

    public listAll(): Row[] {
      return [...rows.values()].map((r) => ({ ...r }))
    }

    public listPending(): Row[] {
      return this.listAll()
    }

    public update(data: Record<string, unknown>): Row | null {
      const row = rows.get(data.id as string)
      if (!row) return null
      const next: Row = { ...row, updatedAt: new Date().toISOString() }
      if (data.title !== undefined) next.title = data.title as string
      if (data.scheduledAt !== undefined)
        next.scheduledAt = new Date(data.scheduledAt as number).toISOString()
      if (data.alertType !== undefined) next.alertType = data.alertType as 'notification' | 'alarm'
      if (data.alarmEnabled !== undefined) next.alarmEnabled = Boolean(data.alarmEnabled)
      if (data.status !== undefined) next.status = data.status as string
      if (data.dedupeKey !== undefined) next.dedupeKey = (data.dedupeKey as string | null) ?? null
      rows.set(next.id, next)
      return { ...next }
    }

    public delete(id: string): boolean {
      return rows.delete(id)
    }
  }

  return { ReminderRepository: FakeReminderRepository }
})

vi.mock('../storage/database', () => ({
  getDatabase: () => ({
    prepare: () => ({ run: () => {}, get: () => undefined, all: () => [] }),
    pragma: () => [],
    exec: () => {},
    close: () => {}
  })
}))

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp', isPackaged: true },
  BrowserWindow: { getAllWindows: () => [] },
  powerMonitor: { on: () => {} }
}))

vi.mock('./reminder.scheduler', () => ({
  ReminderScheduler: {
    getInstance: () => ({
      init: () => {},
      reschedule: () => {},
      stop: () => {},
      sweep: async () => {}
    })
  }
}))

vi.mock('./notification.service', () => ({
  NotificationService: {
    getInstance: () => ({ registerCallbacks: () => {}, showReminderNotification: () => {} })
  }
}))

vi.mock('./wake-scheduler', () => ({
  getReminderWakeScheduler: () => ({
    scheduleWake: async () => {},
    cancelWake: async () => {},
    reconcile: async () => {}
  })
}))

vi.mock('../windows/alarm.window', () => ({
  ReminderAlarmWindowManager: {
    getInstance: () => ({ closeAlarmWindow: () => {}, showAlarmWindow: () => {} })
  }
}))

vi.mock('./config.service', () => ({
  ConfigService: { getInstance: () => ({ get: () => ({}) }) }
}))

import { ReminderService, computeReminderDedupeKey, type CreateReminderInput } from './reminder.service'
import { ReminderRepository } from '../storage/reminder.repository'

type Row = {
  id: string
  title: string
  status: string
  dedupeKey: string | null
  eventId: string | null
  leadMinutes: number | null
  source: string | null
}

// The mocked module exposes its in-memory table for assertions.
const rows = (ReminderRepository as unknown as { __rows: Map<string, Row> }).__rows

const HOUR = 3600 * 1000
const futureIso = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString()

describe('computeReminderDedupeKey', () => {
  const base = {
    title: 'Standup',
    scheduledAtMs: Date.parse('2026-09-27T07:30:00Z'),
    alertType: 'notification' as const
  }

  it('produces the same key for the same configuration', () => {
    expect(computeReminderDedupeKey(base)).toBe(computeReminderDedupeKey({ ...base }))
  })

  it('normalizes title whitespace and case', () => {
    expect(computeReminderDedupeKey({ ...base, title: '  Standup  ' })).toBe(
      computeReminderDedupeKey({ ...base, title: 'standup' })
    )
  })

  it('separates different configurations', () => {
    const keys = new Set([
      computeReminderDedupeKey(base),
      computeReminderDedupeKey({ ...base, alertType: 'alarm' }),
      computeReminderDedupeKey({ ...base, scheduledAtMs: base.scheduledAtMs + 60_000 }),
      computeReminderDedupeKey({ ...base, title: 'Lunch' })
    ])
    expect(keys.size).toBe(4)
  })

  it('uses the event id for event-linked reminders', () => {
    const a = computeReminderDedupeKey({ ...base, eventId: 'evt-1', leadMinutes: 5 })
    const b = computeReminderDedupeKey({
      ...base,
      eventId: 'evt-1',
      leadMinutes: 5,
      title: 'Anything'
    })
    expect(a).toBe(b)
    expect(a).toBe('evt:evt-1:5:notification')
    expect(computeReminderDedupeKey({ ...base, eventId: 'evt-1', leadMinutes: 10 })).not.toBe(a)
  })
})

describe('ReminderService idempotent creation', () => {
  let service: ReminderService

  beforeEach(() => {
    rows.clear()
    service = ReminderService.getInstance()
  })

  it('returns the existing reminder instead of inserting a duplicate', async () => {
    const input: CreateReminderInput = {
      title: 'Call the dentist',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification',
      source: 'voice'
    }

    const first = await service.createWithResult(input)
    expect(first.alreadyExisted).toBe(false)
    expect(first.reminder.dedupeKey).toBeTruthy()

    const second = await service.createWithResult(input)
    expect(second.alreadyExisted).toBe(true)
    expect(second.reminder.id).toBe(first.reminder.id)
    expect(rows.size).toBe(1)
  })

  it('does not delete or modify the existing reminder when a duplicate arrives', async () => {
    const input: CreateReminderInput = {
      title: 'Water plants',
      scheduledAt: futureIso(2 * HOUR),
      alertType: 'notification',
      source: 'ui'
    }

    const first = await service.createWithResult(input)
    const before = service.getById(first.reminder.id)

    await service.createWithResult(input)

    const after = service.getById(first.reminder.id)
    expect(after).toEqual(before)
    expect(after?.status).toBe('scheduled')
    expect(rows.size).toBe(1)
  })

  it('creates a genuinely different reminder when the configuration differs', async () => {
    const first = await service.createWithResult({
      title: 'Buy milk',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification'
    })
    const second = await service.createWithResult({
      title: 'Buy milk',
      scheduledAt: futureIso(HOUR + 60_000),
      alertType: 'notification'
    })

    expect(first.alreadyExisted).toBe(false)
    expect(second.alreadyExisted).toBe(false)
    expect(first.reminder.id).not.toBe(second.reminder.id)
    expect(rows.size).toBe(2)
  })

  it('suppresses duplicates for event-linked reminders (eventId + leadMinutes)', async () => {
    const payload: CreateReminderInput = {
      title: 'Meeting: Design review',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification',
      eventId: 'google-evt-123',
      leadMinutes: 5,
      source: 'voice'
    }

    const first = await service.createWithResult(payload)
    const second = await service.createWithResult(payload)

    expect(first.alreadyExisted).toBe(false)
    expect(second.alreadyExisted).toBe(true)
    expect(second.reminder.id).toBe(first.reminder.id)
    expect([...rows.values()].filter((r) => r.eventId === 'google-evt-123')).toHaveLength(1)
  })

  it('allows re-creating a reminder once the original is no longer active', async () => {
    const payload: CreateReminderInput = {
      title: 'Old task',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification'
    }

    const first = await service.createWithResult(payload)
    rows.get(first.reminder.id)!.status = 'completed'

    const again = await service.createWithResult(payload)
    expect(again.alreadyExisted).toBe(false)
    expect(again.reminder.id).not.toBe(first.reminder.id)
  })

  it('falls back to the unique-index backstop when the pre-check misses (race)', async () => {
    const payload: CreateReminderInput = {
      title: 'Racy task',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification'
    }

    const first = await service.createWithResult(payload)

    // Simulate a concurrent insert winning between the check and the write:
    // the first lookup in this call returns null, the second (post-error) does not.
    const repo = ReminderRepository.getInstance() as unknown as {
      findByDedupeKey: (k: string) => Row | null
    }
    const original = repo.findByDedupeKey
    let bypassed = false
    repo.findByDedupeKey = (k: string) => {
      if (!bypassed) {
        bypassed = true
        return null
      }
      return original.call(repo, k)
    }

    try {
      const raced = await service.createWithResult(payload)
      expect(raced.alreadyExisted).toBe(true)
      expect(raced.reminder.id).toBe(first.reminder.id)
    } finally {
      repo.findByDedupeKey = original
    }
    expect(rows.size).toBe(1)
  })

  it('keeps create() backward compatible (returns the reminder)', async () => {
    const reminder = await service.create({
      title: 'Compat check',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification'
    })
    expect(reminder.id).toBeTruthy()
    expect(reminder.title).toBe('Compat check')
  })

  it('still rejects past schedules', async () => {
    await expect(
      service.createWithResult({
        title: 'Too late',
        scheduledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      })
    ).rejects.toThrow(/past/i)
  })

  it('stores the event linkage and source columns', async () => {
    const created = await service.createWithResult({
      title: 'Linked',
      scheduledAt: futureIso(HOUR),
      alertType: 'alarm',
      eventId: 'evt-42',
      leadMinutes: 15,
      source: 'voice'
    })

    const row = rows.get(created.reminder.id)!
    expect(row.eventId).toBe('evt-42')
    expect(row.leadMinutes).toBe(15)
    expect(row.source).toBe('voice')
    expect(created.reminder.eventId).toBe('evt-42')
    expect(created.reminder.leadMinutes).toBe(15)
    expect(created.reminder.source).toBe('voice')
  })

  it('recomputes the dedupe key on update and never collides with another reminder', async () => {
    const a = await service.createWithResult({
      title: 'Shared title',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification'
    })
    expect(a.reminder.dedupeKey).toBeTruthy()

    // Rename A away so B can claim the same configuration.
    rows.get(a.reminder.id)!.dedupeKey = null
    const b = await service.createWithResult({
      title: 'Shared title',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification'
    })
    expect(b.alreadyExisted).toBe(false)

    const updated = await service.update({ id: b.reminder.id, title: 'Shared title' })
    expect(updated.dedupeKey).toBeTruthy()
  })

  it('clears the key instead of failing when another reminder already owns it', async () => {
    const a = await service.createWithResult({
      title: 'Owner',
      scheduledAt: futureIso(HOUR),
      alertType: 'notification'
    })
    const b = await service.createWithResult({
      title: 'Challenger',
      scheduledAt: futureIso(HOUR + 60_000),
      alertType: 'notification'
    })

    // Point A's key at exactly the key B's update will recompute, forcing the
    // collision path (we never delete A, so the update must clear ours instead).
    const renamed = 'Challenger Renamed'
    const nextKey = computeReminderDedupeKey({
      title: renamed,
      scheduledAtMs: Date.parse(b.reminder.scheduledAt),
      alertType: 'notification'
    })
    rows.get(a.reminder.id)!.dedupeKey = nextKey

    const updated = await service.update({ id: b.reminder.id, title: renamed })
    expect(updated.dedupeKey).toBeNull()
    expect(rows.get(a.reminder.id)!.dedupeKey).toBe(nextKey)
  })
})

describe('Schema migration guarantees', () => {
  it('declares the dedupe columns and the active-only unique index in database.ts', async () => {
    const { readFile } = await import('node:fs/promises')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const here = dirname(fileURLToPath(import.meta.url))
    const src = await readFile(join(here, '..', 'storage', 'database.ts'), 'utf8')

    for (const col of ['event_id TEXT', 'lead_minutes INTEGER', 'dedupe_key TEXT', 'source TEXT']) {
      expect(src).toContain(col)
    }
    expect(src).toContain('idx_reminders_dedupe_key')
    expect(src).toContain("'scheduled', 'triggered', 'snoozed'")
    // Existing databases get the columns via ALTER, not only on fresh create.
    expect(src).toContain('ALTER TABLE reminders ADD COLUMN')
  })
})
