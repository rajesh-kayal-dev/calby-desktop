export type ReminderStatus = 'scheduled' | 'triggered' | 'snoozed' | 'completed' | 'dismissed'

export interface Reminder {
  id: string
  title: string
  scheduledAt: string
  alarmEnabled: boolean
  status: ReminderStatus
  snoozeCount: number
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

export interface CreateReminderInput {
  title: string
  scheduledAt: string
  alarmEnabled?: boolean
}

export interface UpdateReminderInput {
  id: string
  title?: string
  scheduledAt?: string
  alarmEnabled?: boolean
}

export type RemindersTab = 'upcoming' | 'completed'

export interface ReminderGroup {
  label: string
  reminders: Reminder[]
}