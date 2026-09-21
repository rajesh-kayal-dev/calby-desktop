import type { Reminder } from '../../storage/reminder.repository'
import type { IReminderWakeScheduler } from './reminder-wake-scheduler.interface'

export class NoopReminderScheduler implements IReminderWakeScheduler {
  private static instance: NoopReminderScheduler | null = null

  public static getInstance(): NoopReminderScheduler {
    if (!NoopReminderScheduler.instance) {
      NoopReminderScheduler.instance = new NoopReminderScheduler()
    }
    return NoopReminderScheduler.instance
  }

  public async scheduleWake(_reminder: Reminder): Promise<void> {}
  public async cancelWake(_reminderId: string): Promise<void> {}
  public async reconcile(_activeReminders: Reminder[]): Promise<void> {}
  public async cleanupAll(): Promise<void> {}
}
