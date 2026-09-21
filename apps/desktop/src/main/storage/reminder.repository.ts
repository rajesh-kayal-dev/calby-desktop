import { getDatabase } from './database'

export type ReminderStatus = 'scheduled' | 'triggered' | 'snoozed' | 'completed' | 'dismissed' | 'missed'
export type AlertType = 'notification' | 'alarm'

export interface Reminder {
  id: string
  title: string
  scheduledAt: string
  alarmEnabled: boolean
  alertType: AlertType
  status: ReminderStatus
  snoozeCount: number
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  missedAt?: string | null
}

export interface ReminderRow {
  id: string
  title: string
  scheduled_at: number
  alarm_enabled: number
  alert_type: string
  status: string
  snooze_count: number
  created_at: number
  updated_at: number
  completed_at: number | null
  missed_at: number | null
}

export interface CreateReminderRecord {
  id: string
  title: string
  scheduledAt: number
  alarmEnabled: boolean
  alertType?: AlertType
  status?: ReminderStatus
}

export interface UpdateReminderRecord {
  id: string
  title?: string
  scheduledAt?: number
  alarmEnabled?: boolean
  alertType?: AlertType
  status?: ReminderStatus
  snoozeCount?: number
  completedAt?: number | null
  missedAt?: number | null
}

export class ReminderRepository {
  private static instance: ReminderRepository | null = null

  private constructor() {}

  public static getInstance(): ReminderRepository {
    if (!ReminderRepository.instance) {
      ReminderRepository.instance = new ReminderRepository()
    }
    return ReminderRepository.instance
  }

  private mapRowToReminder(row: ReminderRow): Reminder {
    const rawType = row.alert_type as AlertType | undefined
    const alertType: AlertType =
      rawType === 'alarm' || rawType === 'notification'
        ? rawType
        : row.alarm_enabled
        ? 'alarm'
        : 'notification'

    return {
      id: row.id,
      title: row.title,
      scheduledAt: new Date(row.scheduled_at).toISOString(),
      alarmEnabled: Boolean(row.alarm_enabled),
      alertType,
      status: row.status as ReminderStatus,
      snoozeCount: row.snooze_count,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      missedAt: row.missed_at ? new Date(row.missed_at).toISOString() : null
    }
  }

  public listAll(): Reminder[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM reminders ORDER BY scheduled_at ASC, created_at DESC')
      .all() as ReminderRow[]
    return rows.map((row) => this.mapRowToReminder(row))
  }

  public listPending(): Reminder[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        "SELECT * FROM reminders WHERE status IN ('scheduled', 'snoozed') ORDER BY scheduled_at ASC"
      )
      .all() as ReminderRow[]
    return rows.map((row) => this.mapRowToReminder(row))
  }

  public listActive(): Reminder[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        "SELECT * FROM reminders WHERE status IN ('scheduled', 'snoozed', 'triggered', 'missed') ORDER BY scheduled_at ASC"
      )
      .all() as ReminderRow[]
    return rows.map((row) => this.mapRowToReminder(row))
  }

  public findById(id: string): Reminder | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as
      | ReminderRow
      | undefined
    return row ? this.mapRowToReminder(row) : null
  }

  public create(data: CreateReminderRecord): Reminder {
    const db = getDatabase()
    const now = Date.now()
    const status = data.status || 'scheduled'
    const alertType: AlertType = data.alertType || (data.alarmEnabled ? 'alarm' : 'notification')

    const stmt = db.prepare(`
      INSERT INTO reminders (
        id, title, scheduled_at, alarm_enabled, alert_type, status, snooze_count, created_at, updated_at, completed_at
      ) VALUES (
        @id, @title, @scheduled_at, @alarm_enabled, @alert_type, @status, 0, @created_at, @updated_at, NULL
      )
    `)

    stmt.run({
      id: data.id,
      title: data.title,
      scheduled_at: data.scheduledAt,
      alarm_enabled: data.alarmEnabled ? 1 : 0,
      alert_type: alertType,
      status,
      created_at: now,
      updated_at: now
    })

    const created = this.findById(data.id)
    if (!created) {
      throw new Error(`Failed to retrieve newly created reminder with id ${data.id}`)
    }
    return created
  }

  public update(data: UpdateReminderRecord): Reminder | null {
    const db = getDatabase()
    const existing = this.findById(data.id)
    if (!existing) {
      return null
    }

    const updates: string[] = ['updated_at = @updated_at']
    const params: Record<string, unknown> = {
      id: data.id,
      updated_at: Date.now()
    }

    if (data.title !== undefined) {
      updates.push('title = @title')
      params.title = data.title
    }

    if (data.scheduledAt !== undefined) {
      updates.push('scheduled_at = @scheduled_at')
      params.scheduled_at = data.scheduledAt
    }

    if (data.alarmEnabled !== undefined) {
      updates.push('alarm_enabled = @alarm_enabled')
      params.alarm_enabled = data.alarmEnabled ? 1 : 0
    }

    if (data.alertType !== undefined) {
      updates.push('alert_type = @alert_type')
      params.alert_type = data.alertType
    }

    if (data.status !== undefined) {
      updates.push('status = @status')
      params.status = data.status
    }

    if (data.snoozeCount !== undefined) {
      updates.push('snooze_count = @snooze_count')
      params.snooze_count = data.snoozeCount
    }

    if (data.completedAt !== undefined) {
      updates.push('completed_at = @completed_at')
      params.completed_at = data.completedAt
    }

    if (data.missedAt !== undefined) {
      updates.push('missed_at = @missed_at')
      params.missed_at = data.missedAt
    }

    const query = `UPDATE reminders SET ${updates.join(', ')} WHERE id = @id`
    db.prepare(query).run(params)

    return this.findById(data.id)
  }

  public clearAll(): number {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM reminders').run()
    return result.changes
  }

  public delete(id: string): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM reminders WHERE id = ?').run(id)
    return result.changes > 0
  }
}