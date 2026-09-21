import type { IReminderWakeScheduler } from './reminder-wake-scheduler.interface'
import { WindowsReminderScheduler } from './windows-reminder.scheduler'
import { NoopReminderScheduler } from './noop-reminder.scheduler'

export type { IReminderWakeScheduler } from './reminder-wake-scheduler.interface'
export { WindowsReminderScheduler } from './windows-reminder.scheduler'
export { NoopReminderScheduler } from './noop-reminder.scheduler'

export function getReminderWakeScheduler(): IReminderWakeScheduler {
  if (process.platform === 'win32') {
    return WindowsReminderScheduler.getInstance()
  }
  return NoopReminderScheduler.getInstance()
}
