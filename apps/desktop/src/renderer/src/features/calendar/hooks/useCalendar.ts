import { useCallback } from 'react'
import {
  useCalendarStore,
  refreshCalendar,
  connectCalendar,
  disconnectCalendar,
  setCalendarError,
  setCalendarEvents,
  addCalendarEvent
} from '../calendar.store'
import type { CalendarEvent } from '../types'

export function useCalendar() {
  const store = useCalendarStore()

  const refresh = useCallback((forceSpinner = false) => {
    return refreshCalendar({ forceSpinner })
  }, [])

  const connect = useCallback(() => {
    return connectCalendar()
  }, [])

  const disconnect = useCallback(() => {
    return disconnectCalendar()
  }, [])

  const setError = useCallback((err: string | null) => {
    setCalendarError(err)
  }, [])

  const setEvents = useCallback((events: CalendarEvent[]) => {
    setCalendarEvents(events)
  }, [])

  const addEvent = useCallback((event: CalendarEvent) => {
    addCalendarEvent(event)
  }, [])

  return {
    status: store.status,
    events: store.events,
    isLoading: store.isLoading,
    isSyncing: store.isSyncing,
    isConnecting: store.isConnecting,
    error: store.error,
    refresh,
    connect,
    disconnect,
    setError,
    setEvents,
    addEvent
  }
}