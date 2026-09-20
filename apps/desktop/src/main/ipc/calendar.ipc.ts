import { ipcMain } from 'electron'
import {
  GoogleCalendarService,
  type CalendarStatus,
  type CalendarEvent,
  type CreateCalendarEventInput
} from '../services/google-calendar.service'

export interface IpcResult<T> {
  ok: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export function registerCalendarIpc(): void {
  const service = GoogleCalendarService.getInstance()

  // 1. Get Status
  ipcMain.handle('calendar:get-status', async (): Promise<IpcResult<CalendarStatus>> => {
    try {
      const status = await service.getStatus()
      return { ok: true, data: status }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch calendar status'
      return {
        ok: false,
        error: { code: 'CALENDAR_STATUS_ERROR', message }
      }
    }
  })

  // 2. Connect
  ipcMain.handle('calendar:connect', async (): Promise<IpcResult<{ connected: boolean }>> => {
    try {
      const result = await service.connect()
      return { ok: true, data: result }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect Google Calendar'
      return {
        ok: false,
        error: { code: 'CALENDAR_CONNECT_ERROR', message }
      }
    }
  })

  // 3. Disconnect
  ipcMain.handle('calendar:disconnect', async (): Promise<IpcResult<void>> => {
    try {
      await service.disconnect()
      return { ok: true, data: undefined }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect Google Calendar'
      return {
        ok: false,
        error: { code: 'CALENDAR_DISCONNECT_ERROR', message }
      }
    }
  })

  // 4. Get Upcoming Events
  ipcMain.handle('calendar:get-upcoming', async (): Promise<IpcResult<CalendarEvent[]>> => {
    try {
      const events = await service.getUpcomingEvents()
      return { ok: true, data: events }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve upcoming calendar events'
      return {
        ok: false,
        error: { code: 'CALENDAR_FETCH_ERROR', message }
      }
    }
  })

  // 5. Create Event
  ipcMain.handle(
    'calendar:create-event',
    async (_event, input: CreateCalendarEventInput): Promise<IpcResult<CalendarEvent>> => {
      try {
        const created = await service.createEvent(input)
        return { ok: true, data: created }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create calendar event'
        const code = message.includes('CALENDAR_WRITE_AUTH_REQUIRED')
          ? 'CALENDAR_WRITE_AUTH_REQUIRED'
          : message.includes('NOT_AUTHENTICATED')
          ? 'NOT_AUTHENTICATED'
          : message.includes('INVALID_INPUT')
          ? 'INVALID_INPUT'
          : 'CALENDAR_CREATE_ERROR'
        return {
          ok: false,
          error: { code, message }
        }
      }
    }
  )

  // 6. Request Write Access
  ipcMain.handle('calendar:request-write-access', async (): Promise<IpcResult<CalendarStatus>> => {
    try {
      const status = await service.requestWriteAccess()
      return { ok: true, data: status }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to request write access'
      return {
        ok: false,
        error: { code: 'CALENDAR_WRITE_AUTH_ERROR', message }
      }
    }
  })

  console.log('[IPC] Calendar IPC channels registered.')
}
