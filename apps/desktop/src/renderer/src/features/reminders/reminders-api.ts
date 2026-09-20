import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput
} from './types'

export async function fetchReminders(): Promise<Reminder[]> {
  if (!window.calby?.reminders) {
    throw new Error('Calby Reminders API is not available')
  }
  const res = await window.calby.reminders.list()
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  if (!window.calby?.reminders) {
    throw new Error('Calby Reminders API is not available')
  }
  const res = await window.calby.reminders.create(input)
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function updateReminder(input: UpdateReminderInput): Promise<Reminder> {
  if (!window.calby?.reminders) {
    throw new Error('Calby Reminders API is not available')
  }
  const res = await window.calby.reminders.update(input)
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function deleteReminder(id: string): Promise<string> {
  if (!window.calby?.reminders) {
    throw new Error('Calby Reminders API is not available')
  }
  const res = await window.calby.reminders.delete(id)
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data.id
}

export async function snoozeReminder(id: string, minutes: number = 5): Promise<Reminder> {
  if (!window.calby?.reminders) {
    throw new Error('Calby Reminders API is not available')
  }
  const res = await window.calby.reminders.snooze(id, minutes)
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function completeReminder(id: string): Promise<Reminder> {
  if (!window.calby?.reminders) {
    throw new Error('Calby Reminders API is not available')
  }
  const res = await window.calby.reminders.complete(id)
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}

export async function dismissReminder(id: string): Promise<Reminder> {
  if (!window.calby?.reminders) {
    throw new Error('Calby Reminders API is not available')
  }
  const res = await window.calby.reminders.dismiss(id)
  if (!res.ok) {
    throw new Error(res.error.message)
  }
  return res.data
}