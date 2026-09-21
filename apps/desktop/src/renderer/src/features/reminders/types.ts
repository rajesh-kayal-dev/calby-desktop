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

export interface CreateReminderInput {
  title: string
  scheduledAt: string
  alarmEnabled?: boolean
  alertType?: AlertType
}

export interface UpdateReminderInput {
  id: string
  title?: string
  scheduledAt?: string
  alarmEnabled?: boolean
  alertType?: AlertType
}

export type RemindersTab = 'upcoming' | 'completed'

export interface ReminderGroup {
  label: string
  reminders: Reminder[]
}