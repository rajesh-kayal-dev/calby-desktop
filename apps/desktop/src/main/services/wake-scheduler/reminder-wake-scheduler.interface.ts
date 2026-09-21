import type { Reminder } from '../../storage/reminder.repository'

export interface IReminderWakeScheduler {
  scheduleWake(reminder: Reminder): Promise<void>
  cancelWake(reminderId: string): Promise<void>
  reconcile(activeReminders: Reminder[]): Promise<void>
  cleanupAll(): Promise<void>
}
