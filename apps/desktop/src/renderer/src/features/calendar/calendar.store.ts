import { useSyncExternalStore } from 'react'
import type { CalendarStatus, CalendarEvent } from './types'
import {
  getCalendarStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getUpcomingCalendarEvents
} from './calendar-api'

const STATUS_STORAGE_KEY = 'calby:calendar:cached_status'
const EVENTS_STORAGE_KEY = 'calby:calendar:cached_events'

export interface CalendarState {
  status: CalendarStatus
  events: CalendarEvent[]
  isLoading: boolean
  isSyncing: boolean
  isConnecting: boolean
  error: string | null
  hasLoadedOnce: boolean
}

function getStoredStatus(): CalendarStatus | null {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CalendarStatus
      if (parsed && typeof parsed.status === 'string') {
        return parsed
      }
    }
  } catch (err) {
    console.warn('[CalendarStore] Failed to read cached status from localStorage:', err)
  }
  return null
}

function saveStoredStatus(status: CalendarStatus | null): void {
  try {
    if (status) {
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(status))
    } else {
      localStorage.removeItem(STATUS_STORAGE_KEY)
    }
  } catch (err) {
    console.warn('[CalendarStore] Failed to save status to localStorage:', err)
  }
}

function getStoredEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed as CalendarEvent[]
      }
    }
  } catch (err) {
    console.warn('[CalendarStore] Failed to read cached events from localStorage:', err)
  }
  return []
}

function saveStoredEvents(events: CalendarEvent[]): void {
  try {
    if (events && events.length > 0) {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
    } else {
      localStorage.removeItem(EVENTS_STORAGE_KEY)
    }
  } catch (err) {
    console.warn('[CalendarStore] Failed to save events to localStorage:', err)
  }
}

const initialCachedStatus = getStoredStatus()
const initialCachedEvents = getStoredEvents()

let state: CalendarState = {
  status: initialCachedStatus || { status: 'disconnected' },
  events: initialCachedEvents,
  isLoading: !initialCachedStatus && initialCachedEvents.length === 0,
  isSyncing: false,
  isConnecting: false,
  error: null,
  hasLoadedOnce: !!initialCachedStatus
}

type Listener = () => void
const listeners = new Set<Listener>()

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): CalendarState {
  return state
}

let activeRefreshPromise: Promise<void> | null = null
let queuedRefresh = false

export async function refreshCalendar(options?: { forceSpinner?: boolean }): Promise<void> {
  if (activeRefreshPromise) {
    queuedRefresh = true
    await activeRefreshPromise
    if (!queuedRefresh) return
    queuedRefresh = false
  }

  const force = options?.forceSpinner ?? false
  if (force || (!state.hasLoadedOnce && state.events.length === 0)) {
    state = { ...state, isLoading: true, error: null }
  } else {
    state = { ...state, isSyncing: true, error: null }
  }
  notify()

  activeRefreshPromise = (async () => {
    try {
      const statusRes = await getCalendarStatus()
      const isNowConnected = statusRes.status === 'connected'

      let upcomingEvents = state.events
      if (isNowConnected) {
        upcomingEvents = await getUpcomingCalendarEvents()
      } else {
        upcomingEvents = []
      }

      state = {
        ...state,
        status: statusRes,
        events: upcomingEvents,
        isLoading: false,
        isSyncing: false,
        hasLoadedOnce: true,
        error: null
      }
      saveStoredStatus(statusRes)
      saveStoredEvents(upcomingEvents)
    } catch (err: unknown) {
      console.error('[CalendarStore] Refresh error:', err)
      const message = err instanceof Error ? err.message : 'Failed to refresh calendar'
      state = {
        ...state,
        isLoading: false,
        isSyncing: false,
        hasLoadedOnce: true,
        error: message.includes('NOT_AUTHENTICATED') ? null : message
      }
    } finally {
      activeRefreshPromise = null
      notify()
    }
  })()

  return activeRefreshPromise
}

export async function connectCalendar(): Promise<boolean> {
  state = { ...state, isConnecting: true, error: null }
  notify()
  try {
    await connectGoogleCalendar()
    await refreshCalendar({ forceSpinner: true })
    return true
  } catch (err: unknown) {
    console.error('[CalendarStore] Connect error:', err)
    const message = err instanceof Error ? err.message : 'Authentication failed'
    state = { ...state, error: message }
    return false
  } finally {
    state = { ...state, isConnecting: false }
    notify()
  }
}

export async function disconnectCalendar(): Promise<void> {
  state = { ...state, isLoading: true, error: null }
  notify()
  try {
    await disconnectGoogleCalendar()
    const disconnectedStatus: CalendarStatus = { status: 'disconnected', hasWriteAccess: false }
    state = {
      ...state,
      status: disconnectedStatus,
      events: [],
      isLoading: false,
      isSyncing: false
    }
    saveStoredStatus(disconnectedStatus)
    saveStoredEvents([])
  } catch (err: unknown) {
    console.error('[CalendarStore] Disconnect error:', err)
    const message = err instanceof Error ? err.message : 'Failed to disconnect'
    state = { ...state, error: message, isLoading: false }
  } finally {
    notify()
  }
}

export function setCalendarError(errorMessage: string | null): void {
  state = { ...state, error: errorMessage }
  notify()
}

export function setCalendarEvents(events: CalendarEvent[]): void {
  state = { ...state, events }
  saveStoredEvents(events)
  notify()
}

export function addCalendarEvent(event: CalendarEvent): void {
  const exists = state.events.some((e) => e.id === event.id)
  if (!exists) {
    const updated = [event, ...state.events]
    state = { ...state, events: updated }
    saveStoredEvents(updated)
    notify()
  }
}

export function setCalendarStatusDirect(status: CalendarStatus): void {
  state = { ...state, status }
  saveStoredStatus(status)
  notify()
}

// Global listener for status broadcasts from main process
if (typeof window !== 'undefined' && window.calby?.calendar?.onStatusChanged) {
  window.calby.calendar.onStatusChanged((newStatus) => {
    if (
      state.status.status === newStatus.status &&
      state.status.connectedEmail === newStatus.connectedEmail &&
      state.status.hasWriteAccess === newStatus.hasWriteAccess &&
      state.status.error === newStatus.error
    ) {
      return
    }

    const wasConnected = state.status.status === 'connected'
    state = { ...state, status: newStatus }
    saveStoredStatus(newStatus)

    if (newStatus.status === 'connected' && !wasConnected) {
      void refreshCalendar({ forceSpinner: false })
    } else if (newStatus.status === 'disconnected') {
      state = { ...state, events: [] }
      saveStoredEvents([])
    }
    notify()
  })
}

export function useCalendarStore(): CalendarState {
  return useSyncExternalStore(subscribe, getSnapshot)
}
