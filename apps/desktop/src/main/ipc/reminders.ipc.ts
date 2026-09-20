import { ipcMain } from 'electron'
import {
  ReminderService,
  type CreateReminderInput,
  type UpdateReminderInput
} from '../services/reminder.service'
import type { Reminder } from '../storage/reminder.repository'

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export function registerRemindersIpc(): void {
  const reminderService = ReminderService.getInstance()

  // 1. List All Reminders
  ipcMain.handle('reminders:list', async (): Promise<IpcResult<Reminder[]>> => {
    try {
      const data = reminderService.listAll()
      return { ok: true, data }
    } catch (err) {
      console.error('[IPC][reminders:list] Error:', err)
      return {
        ok: false,
        error: {
          code: 'FETCH_FAILED',
          message: err instanceof Error ? err.message : 'Failed to retrieve reminders'
        }
      }
    }
  })

  // 2. Create Reminder
  ipcMain.handle(
    'reminders:create',
    async (_event, input: CreateReminderInput): Promise<IpcResult<Reminder>> => {
      try {
        const data = await reminderService.create(input)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][reminders:create] Error:', err)
        return {
          ok: false,
          error: {
            code: 'CREATE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to create reminder'
          }
        }
      }
    }
  )

  // 3. Update Reminder
  ipcMain.handle(
    'reminders:update',
    async (_event, input: UpdateReminderInput): Promise<IpcResult<Reminder>> => {
      try {
        const data = await reminderService.update(input)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][reminders:update] Error:', err)
        return {
          ok: false,
          error: {
            code: 'UPDATE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to update reminder'
          }
        }
      }
    }
  )

  // 4. Delete Reminder
  ipcMain.handle(
    'reminders:delete',
    async (_event, { id }: { id: string }): Promise<IpcResult<{ id: string }>> => {
      try {
        const data = await reminderService.delete(id)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][reminders:delete] Error:', err)
        return {
          ok: false,
          error: {
            code: 'DELETE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to delete reminder'
          }
        }
      }
    }
  )

  // 5. Snooze Reminder
  ipcMain.handle(
    'reminders:snooze',
    async (_event, { id, minutes }: { id: string; minutes?: number }): Promise<IpcResult<Reminder>> => {
      try {
        const data = await reminderService.snooze(id, minutes ?? 5)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][reminders:snooze] Error:', err)
        return {
          ok: false,
          error: {
            code: 'SNOOZE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to snooze reminder'
          }
        }
      }
    }
  )

  // 6. Complete Reminder
  ipcMain.handle(
    'reminders:complete',
    async (_event, { id }: { id: string }): Promise<IpcResult<Reminder>> => {
      try {
        const data = await reminderService.complete(id)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][reminders:complete] Error:', err)
        return {
          ok: false,
          error: {
            code: 'COMPLETE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to complete reminder'
          }
        }
      }
    }
  )

  // 7. Dismiss Reminder
  ipcMain.handle(
    'reminders:dismiss',
    async (_event, { id }: { id: string }): Promise<IpcResult<Reminder>> => {
      try {
        const data = await reminderService.dismiss(id)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][reminders:dismiss] Error:', err)
        return {
          ok: false,
          error: {
            code: 'DISMISS_FAILED',
            message: err instanceof Error ? err.message : 'Failed to dismiss reminder'
          }
        }
      }
    }
  )

  console.log('[IPC] Reminders IPC channels registered.')
}