import { randomUUID } from 'node:crypto'
import { BrowserWindow } from 'electron'
import { z } from 'zod'
import {
  ReminderRepository,
  type Reminder,
  type AlertType
} from '../storage/reminder.repository'
import { getDatabase } from '../storage/database'
import { ReminderScheduler } from './reminder.scheduler'
import { NotificationService } from './notification.service'
import { ConfigService } from './config.service'
import { getReminderWakeScheduler, type IReminderWakeScheduler } from './wake-scheduler'
import { ReminderAlarmWindowManager } from '../windows/alarm.window'

export const CreateReminderSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200, 'Title is too long.'),
  scheduledAt: z.string().datetime({ message: 'Invalid ISO datetime string.' }),
  alarmEnabled: z.boolean().optional(),
  alertType: z.enum(['notification', 'alarm']).optional()
})

export type CreateReminderInput = z.infer<typeof CreateReminderSchema>

export const UpdateReminderSchema = z.object({
  id: z.string().uuid('Invalid reminder ID.'),
  title: z.string().min(1, 'Title is required.').max(200, 'Title is too long.').optional(),
  scheduledAt: z.string().datetime({ message: 'Invalid ISO datetime string.' }).optional(),
  alarmEnabled: z.boolean().optional(),
  alertType: z.enum(['notification', 'alarm']).optional()
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
  private wakeScheduler: IReminderWakeScheduler
  private alarmWindowManager: ReminderAlarmWindowManager
  private isInitialized: boolean = false

  private constructor() {
    this.repository = ReminderRepository.getInstance()
    this.scheduler = ReminderScheduler.getInstance()
    this.notificationService = NotificationService.getInstance()
    this.wakeScheduler = getReminderWakeScheduler()
    this.alarmWindowManager = ReminderAlarmWindowManager.getInstance()
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

    // 1. Initialize SQLite database schema
    getDatabase()

    // 2. Register notification action handlers
    this.notificationService.registerCallbacks({
      onComplete: (id) => void this.complete(id),
      onSnooze: (id) => void this.snooze(id, 5),
      onDismiss: (id) => void this.dismiss(id)
    })

    // 3. Startup reconciliation: detect missed reminders that were due while app/computer was offline
    this.reconcileStartupReminders()

    // 4. Reconcile OS-level scheduled tasks (recreates missing, purges orphans)
    void this.wakeScheduler.reconcile(this.repository.listPending())

    // 5. Initialize in-app scheduler with due callback
    this.scheduler.init((id) => this.onReminderDue(id))
    console.log('[ReminderService] Initialized, wakeScheduler reconciled, and scheduler hooked.')
  }

  public reconcileStartupReminders(): void {
    const now = Date.now()
    const MISSED_THRESHOLD_MS = 60 * 1000 // 1 minute
    const active = this.repository.listActive()
    for (const r of active) {
      if (r.status === 'scheduled' || r.status === 'snoozed') {
        const scheduledMs = new Date(r.scheduledAt).getTime()
        if (scheduledMs < now - MISSED_THRESHOLD_MS) {
          console.log(`[ReminderService] Missed reminder detected at startup: "${r.title}" (id: ${r.id})`)
          const updated = this.repository.update({
            id: r.id,
            status: 'missed',
            missedAt: now
          })
          if (updated) {
            void this.deliverMissedReminder(updated)
          }
        }
      }
    }
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

    const alertType: AlertType =
      validated.alertType || (validated.alarmEnabled ? 'alarm' : 'notification')

    const id = randomUUID()
    const reminder = this.repository.create({
      id,
      title: validated.title,
      scheduledAt: scheduledMs,
      alarmEnabled: alertType === 'alarm',
      alertType,
      status: 'scheduled'
    })

    console.log(`[ReminderService] Reminder scheduled: "${reminder.title}" (id: ${reminder.id}, scheduledAt: ${new Date(reminder.scheduledAt).toISOString()}, alertType: ${reminder.alertType})`)

    // Schedule OS-level wake task for offline / post-quit reliability
    void this.wakeScheduler.scheduleWake(reminder)

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

    const alertType: AlertType | undefined = validated.alertType

    const updated = this.repository.update({
      id: validated.id,
      title: validated.title,
      scheduledAt: scheduledMs,
      alarmEnabled: alertType !== undefined ? alertType === 'alarm' : validated.alarmEnabled,
      alertType
    })

    if (!updated) {
      throw new Error(`Failed to update reminder "${validated.id}".`)
    }

    console.log(`[ReminderService] Reminder updated: "${updated.title}" (id: ${updated.id}, alertType: ${updated.alertType})`)

    // Update OS-level wake task
    void this.wakeScheduler.scheduleWake(updated)

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

    // Cancel OS-level wake task and close any active alarm window
    void this.wakeScheduler.cancelWake(id)
    this.alarmWindowManager.closeAlarmWindow()

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

    console.log(`[ReminderService] Reminder snoozed: "${updated.title}" for ${minutes}m (id: ${updated.id})`)

    // Reschedule OS-level wake task and close active alarm window
    void this.wakeScheduler.scheduleWake(updated)
    this.alarmWindowManager.closeAlarmWindow()

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

    console.log(`[ReminderService] Reminder completed: "${updated.title}" (id: ${updated.id})`)

    // Cancel OS-level wake task and close active alarm window
    void this.wakeScheduler.cancelWake(id)
    this.alarmWindowManager.closeAlarmWindow()

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

    console.log(`[ReminderService] Reminder dismissed: "${updated.title}" (id: ${updated.id})`)

    // Cancel OS-level wake task and close active alarm window
    void this.wakeScheduler.cancelWake(id)
    this.alarmWindowManager.closeAlarmWindow()

    this.scheduler.reschedule()
    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder: updated
    } as ReminderChangePayload)

    return updated
  }

  public async onReminderDue(id: string): Promise<void> {
    const reminder = this.repository.findById(id)
    if (!reminder) {
      console.log(`[ReminderService] Reminder due check skipped: reminder ${id} not found in database.`)
      return
    }

    // Allow transition if scheduled, snoozed, or missed
    if (reminder.status !== 'scheduled' && reminder.status !== 'snoozed' && reminder.status !== 'missed') {
      console.log(`[ReminderService] Reminder ${id} is in status "${reminder.status}". Skipping trigger.`)
      return
    }

    console.log(`[ReminderService] Reminder due: "${reminder.title}" (id: ${reminder.id})`)
    console.log(`[ReminderService] Reminder trigger started: alertType = ${reminder.alertType}`)

    // Immediately mark as triggered in DB to prevent duplicate triggers
    const updated = this.repository.update({
      id,
      status: 'triggered'
    })

    if (!updated) {
      console.error(`[ReminderService] Failed to mark reminder ${id} as triggered in database.`)
      return
    }

    console.log(`[ReminderService] Delivery started for reminder ${updated.id} (${updated.alertType})`)

    try {
      if (updated.alertType === 'alarm') {
        const configService = ConfigService.getInstance()
        const settings = configService.getReminderSettings()

        if (!settings.alarmEnabled) {
          console.log(`[ReminderService] Alarm setting is disabled in Settings. Skipping audible alarm for "${updated.title}".`)
        } else {
          // Open dedicated Alarm window (independent from main window)
          this.alarmWindowManager.showAlarmWindow(updated, false)

          // Also broadcast in-app event for main window if open
          this.broadcast('reminders:on-triggered', {
            reminder: updated
          } as ReminderTriggeredPayload)

          console.log(`[ReminderService] Delivery succeeded: Dedicated Alarm Window shown for reminder ${updated.id}`)
        }
      } else {
        // alertType === 'notification' (default)
        this.notificationService.showReminderNotification(updated, false)
        console.log(`[ReminderService] Delivery succeeded: Notification triggered for reminder ${updated.id}`)
      }
    } catch (deliveryErr) {
      console.error(`[ReminderService] Delivery failed for reminder ${updated.id}:`, deliveryErr)
    }

    // Broadcast status change so UI updates
    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder: updated
    } as ReminderChangePayload)
  }

  public deliverMissedReminder(reminder: Reminder): void {
    console.log(`[ReminderService] Delivering missed reminder alert: "${reminder.title}" (${reminder.id})`)
    try {
      if (reminder.alertType === 'alarm') {
        // Show dedicated alarm window in missed reminder state
        this.alarmWindowManager.showAlarmWindow(reminder, true)
      } else {
        // Show desktop notification in missed reminder state
        this.notificationService.showReminderNotification(reminder, true)
      }
    } catch (err) {
      console.error(`[ReminderService] Failed to deliver missed reminder ${reminder.id}:`, err)
    }

    this.broadcast('reminders:on-changed', {
      action: 'updated',
      reminder
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