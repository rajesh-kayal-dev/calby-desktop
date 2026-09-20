import { randomUUID } from 'node:crypto'
import { BrowserWindow } from 'electron'
import { z } from 'zod'
import { getDatabase } from '../storage/database'
import {
  ReminderRepository,
  type Reminder
} from '../storage/reminder.repository'
import { ReminderScheduler } from './reminder.scheduler'
import { NotificationService } from './notification.service'

export const CreateReminderSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  scheduledAt: z.string().datetime({ message: 'scheduledAt must be a valid ISO 8601 UTC date string' }),
  alarmEnabled: z.boolean().optional().default(true)
})

export type CreateReminderInput = z.infer<typeof CreateReminderSchema>

export const UpdateReminderSchema = z.object({
  id: z.string().min(1, 'id is required'),
  title: z.string().trim().min(1, 'Title cannot be empty').max(255).optional(),
  scheduledAt: z.string().datetime().optional(),
  alarmEnabled: z.boolean().optional()
})

export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>

export interface ReminderChangePayload {
  action: 'created' | 'updated' | 'deleted'
  reminder: Reminder
}

export interface ReminderTriggeredPayload {
  reminder: Reminder
}

export class ReminderService {
  private static instance: ReminderService | null = null
  private repository: ReminderRepository
  private scheduler: ReminderScheduler
  private notificationService: NotificationService
  private isInitialized: boolean = false

  private constructor() {
    this.repository = ReminderRepository.getInstance()
    this.scheduler = ReminderScheduler.getInstance()
    this.notificationService = NotificationService.getInstance()
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService()
    }
    return ReminderService.instance
  }

  public init(): void {
    if (this.isInitialized) return
    this.isInitialized = true

    // Initialize SQLite database schema
    getDatabase()

    // Register notification action handlers
    this.notificationService.registerCallbacks({
      onSnooze: (id) => void this.snooze(id, 5),
      onDismiss: (id) => void this.dismiss(id)
    })

    // Initialize scheduler with due callback
    this.scheduler.init((id) => this.onReminderDue(id))
    console.log('[ReminderService] Initialized and scheduler hooked.')
  }

  public listAll(): Reminder[] {
    return this.repository.listAll()
  }

  public getById(id: string): Reminder | null {
    return this.repository.findById(id)
  }

  public async create(input: CreateReminderInput): Promise<Reminder> {
    const validated = CreateReminderSchema.parse(input)
    const scheduledMs = new Date(validated.scheduledAt).getTime()

    // Date safety: Allow 60s tolerance for clock drift / network latency
    const now = Date.now()
    if (scheduledMs < now - 60 * 1000) {
      throw new Error('Reminder scheduled time cannot be in the past.')
    }

    const id = randomUUID()
    const reminder = this.repository.create({
      id,
      title: validated.title,
      scheduledAt: scheduledMs,
      alarmEnabled: validated.alarmEnabled ?? true,
      status: 'scheduled'
    })

    this.scheduler.reschedule()
    this.broadcast('reminders:on-changed', {
      action: 'created',
      reminder
    } as ReminderChangePayload)

    return reminder
  }

  public async update(input: UpdateReminderInput): Promise<Reminder> {
    const validated = UpdateReminderSchema.parse(input)
    const existing = this.repository.findById(validated.id)
    if (!existing) {
      throw new Error(`Reminder with id "${validated.id}" not found.`)
    }

    let scheduledMs: number | undefined
    if (validated.scheduledAt) {
      scheduledMs = new Date(validated.scheduledAt).getTime()
      if (scheduledMs < Date.now() - 60 * 1000) {
        throw new Error('Updated reminder scheduled time cannot be in the past.')
      }
    }

    const updated = this.repository.update({
      id: validated.id,
      title: validated.title,
      scheduledAt: scheduledMs,
      alarmEnabled: validated.alarmEnabled
    })

    if (!updated) {
      throw new Error(`Failed to update reminder "${validated.id}".`)
    }

    this.scheduler.reschedule()
    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder: updated
    } as ReminderChangePayload)

    return updated
  }

  public async delete(id: string): Promise<{ id: string }> {
    const existing = this.repository.findById(id)
    if (!existing) {
      throw new Error(`Reminder with id "${id}" not found.`)
    }

    const deleted = this.repository.delete(id)
    if (!deleted) {
      throw new Error(`Failed to delete reminder "${id}".`)
    }

    this.scheduler.reschedule()
    this.broadcast('reminders:on-changed', {
      action: 'deleted',
      reminder: existing
    } as ReminderChangePayload)

    return { id }
  }

  public async snooze(id: string, minutes: number = 5): Promise<Reminder> {
    const existing = this.repository.findById(id)
    if (!existing) {
      throw new Error(`Reminder with id "${id}" not found.`)
    }

    const snoozeDurationMs = Math.max(1, minutes) * 60 * 1000
    const newScheduledMs = Date.now() + snoozeDurationMs
    const newSnoozeCount = existing.snoozeCount + 1

    const updated = this.repository.update({
      id,
      scheduledAt: newScheduledMs,
      status: 'snoozed',
      snoozeCount: newSnoozeCount
    })

    if (!updated) {
      throw new Error(`Failed to snooze reminder "${id}".`)
    }

    this.scheduler.reschedule()
    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder: updated
    } as ReminderChangePayload)

    return updated
  }

  public async complete(id: string): Promise<Reminder> {
    const existing = this.repository.findById(id)
    if (!existing) {
      throw new Error(`Reminder with id "${id}" not found.`)
    }

    const updated = this.repository.update({
      id,
      status: 'completed',
      completedAt: Date.now()
    })

    if (!updated) {
      throw new Error(`Failed to mark reminder "${id}" as complete.`)
    }

    this.scheduler.reschedule()
    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder: updated
    } as ReminderChangePayload)

    return updated
  }

  public async dismiss(id: string): Promise<Reminder> {
    const existing = this.repository.findById(id)
    if (!existing) {
      throw new Error(`Reminder with id "${id}" not found.`)
    }

    const updated = this.repository.update({
      id,
      status: 'dismissed'
    })

    if (!updated) {
      throw new Error(`Failed to dismiss reminder "${id}".`)
    }

    this.scheduler.reschedule()
    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder: updated
    } as ReminderChangePayload)

    return updated
  }

  public async onReminderDue(id: string): Promise<void> {
    const reminder = this.repository.findById(id)
    if (!reminder) return

    // Only transition if scheduled or snoozed
    if (reminder.status !== 'scheduled' && reminder.status !== 'snoozed') {
      return
    }

    const updated = this.repository.update({
      id,
      status: 'triggered'
    })

    if (!updated) return

    console.log(`[ReminderService] Triggering reminder: "${updated.title}" (id: ${updated.id})`)

    // 1. Show native OS notification
    this.notificationService.showReminderNotification(updated)

    // 2. Broadcast in-app alarm trigger
    this.broadcast('reminders:on-triggered', {
      reminder: updated
    } as ReminderTriggeredPayload)

    // 3. Broadcast status change
    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder: updated
    } as ReminderChangePayload)
  }

  private broadcast(channel: string, ...args: unknown[]): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args)
      }
    }
  }
}