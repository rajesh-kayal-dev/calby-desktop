import { ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  ReminderChangePayload,
  ReminderTriggeredPayload,
  CalbyRemindersAPI,
  IpcResult
} from '../index.d'

export const remindersApi: CalbyRemindersAPI = {
  list: async (): Promise<IpcResult<Reminder[]>> => {
    return ipcRenderer.invoke('reminders:list')
  },

  create: async (input: CreateReminderInput): Promise<IpcResult<Reminder>> => {
    return ipcRenderer.invoke('reminders:create', input)
  },

  update: async (input: UpdateReminderInput): Promise<IpcResult<Reminder>> => {
    return ipcRenderer.invoke('reminders:update', input)
  },

  delete: async (id: string): Promise<IpcResult<{ id: string }>> => {
    return ipcRenderer.invoke('reminders:delete', { id })
  },

  snooze: async (id: string, minutes?: number): Promise<IpcResult<Reminder>> => {
    return ipcRenderer.invoke('reminders:snooze', { id, minutes })
  },

  complete: async (id: string): Promise<IpcResult<Reminder>> => {
    return ipcRenderer.invoke('reminders:complete', { id })
  },

  dismiss: async (id: string): Promise<IpcResult<Reminder>> => {
    return ipcRenderer.invoke('reminders:dismiss', { id })
  },

  onChanged: (callback: (payload: ReminderChangePayload) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: ReminderChangePayload): void => {
      callback(payload)
    }
    ipcRenderer.on('reminders:on-changed', handler)
    return () => {
      ipcRenderer.removeListener('reminders:on-changed', handler)
    }
  },

  onTriggered: (callback: (payload: ReminderTriggeredPayload) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, payload: ReminderTriggeredPayload): void => {
      callback(payload)
    }
    ipcRenderer.on('reminders:on-triggered', handler)
    return () => {
      ipcRenderer.removeListener('reminders:on-triggered', handler)
    }
  }
}