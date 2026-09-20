import { useState, useEffect, useCallback } from 'react'
import type { CalendarStatus, CalendarEvent } from '../types'
import {
  getCalendarStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getUpcomingCalendarEvents
} from '../calendar-api'

export function useCalendar() {
  const [status, setStatus] = useState<CalendarStatus>({ status: 'disconnected' })
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setError(null)
      const data = await getUpcomingCalendarEvents()
      setEvents(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load upcoming events'
      setError(message)
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const currentStatus = await getCalendarStatus()
      setStatus(currentStatus)
      if (currentStatus.status === 'connected') {
        await fetchEvents()
      } else {
        setEvents([])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refresh calendar'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [fetchEvents])

  useEffect(() => {
    void refresh()

    // Listen for live status change broadcasts
    const unsub = window.calby?.calendar?.onStatusChanged((newStatus) => {
      setStatus(newStatus)
      if (newStatus.status === 'connected') {
        void fetchEvents()
      } else {
        setEvents([])
      }
    })

    return () => {
      if (unsub) unsub()
    }
  }, [refresh, fetchEvents])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      await connectGoogleCalendar()
      await refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }, [refresh])

  const disconnect = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await disconnectGoogleCalendar()
      setStatus({ status: 'disconnected' })
      setEvents([])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Disconnection failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    status,
    events,
    isLoading,
    isConnecting,
    error,
    connect,
    disconnect,
    refresh
  }
}