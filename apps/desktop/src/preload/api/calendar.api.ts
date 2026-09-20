import { ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  CalbyCalendarAPI,
  CalendarStatus,
  CalendarEvent,
  CreateCalendarEventInput,
  IpcResult
} from '../index.d'

export const calendarApi: CalbyCalendarAPI = {
  getStatus: (): Promise<IpcResult<CalendarStatus>> => {
    return ipcRenderer.invoke('calendar:get-status')
  },

  connect: (): Promise<IpcResult<{ connected: boolean }>> => {
    return ipcRenderer.invoke('calendar:connect')
  },

  disconnect: (): Promise<IpcResult<void>> => {
    return ipcRenderer.invoke('calendar:disconnect')
  },

  getUpcoming: (): Promise<IpcResult<CalendarEvent[]>> => {
    return ipcRenderer.invoke('calendar:get-upcoming')
  },

  createEvent: (input: CreateCalendarEventInput): Promise<IpcResult<CalendarEvent>> => {
    return ipcRenderer.invoke('calendar:create-event', input)
  },

  requestWriteAccess: (): Promise<IpcResult<CalendarStatus>> => {
    return ipcRenderer.invoke('calendar:request-write-access')
  },

  onStatusChanged: (callback: (status: CalendarStatus) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, status: CalendarStatus): void => {
      callback(status)
    }
    ipcRenderer.on('calendar:status-changed', handler)
    return () => {
      ipcRenderer.removeListener('calendar:status-changed', handler)
    }
  }
}
