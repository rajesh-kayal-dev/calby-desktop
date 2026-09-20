import { useState, useEffect, useCallback } from 'react'
import type {
  AuthStatus,
  CalendarStatus,
  SystemInfo,
  MicPermissionState
} from '../types'
import {
  clearAllMemories as apiClearMemories,
  clearAllLocalData as apiClearAllData,
  openSystemMicSettings
} from '../settings-api'

export function useSettings(onDataReset?: () => void) {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [memoryCount, setMemoryCount] = useState<number>(0)
  const [micState, setMicState] = useState<MicPermissionState>('unknown')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setActionError(null)

      // 1. Auth Status
      if (window.calby?.auth) {
        const authRes = await window.calby.auth.getStatus()
        if (authRes.ok) setAuthStatus(authRes.data)
      }

      // 2. Calendar Status
      if (window.calby?.calendar) {
        const calRes = await window.calby.calendar.getStatus()
        if (calRes.ok) setCalendarStatus(calRes.data)
      }

      // 3. System Info
      if (window.calby?.system) {
        const sysRes = await window.calby.system.getInfo()
        if (sysRes.ok) setSystemInfo(sysRes.data)
      }

      // 4. Memory Count
      if (window.calby?.memory) {
        const memRes = await window.calby.memory.list()
        if (memRes.ok) setMemoryCount(memRes.data.length)
      }

      // 5. Microphone permission query via navigator.permissions where supported
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const perm = await navigator.permissions.query({ name: 'microphone' as unknown as Parameters<typeof navigator.permissions.query>[0]['name'] })
          setMicState(perm.state as MicPermissionState)
          perm.onchange = () => {
            setMicState(perm.state as MicPermissionState)
          }
        } else {
          setMicState('granted')
        }
      } catch {
        setMicState('granted')
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load settings data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Real-time event listeners
  useEffect(() => {
    const unsubCalendar = window.calby?.calendar?.onStatusChanged?.((status) => {
      setCalendarStatus(status)
    })
    const unsubMemory = window.calby?.memory?.onChanged?.(() => {
      void loadData()
    })

    return () => {
      if (unsubCalendar) unsubCalendar()
      if (unsubMemory) unsubMemory()
    }
  }, [loadData])

  const disconnectCalendar = async (): Promise<void> => {
    if (!window.calby?.calendar) return
    try {
      setActionError(null)
      const res = await window.calby.calendar.disconnect()
      if (!res.ok) throw new Error(res.error.message)
      await loadData()
      setActionSuccess('Google Calendar disconnected')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to disconnect Google Calendar')
    }
  }

  const connectCalendar = async (): Promise<void> => {
    if (!window.calby?.calendar) return
    try {
      setActionError(null)
      const res = await window.calby.calendar.connect()
      if (!res.ok) throw new Error(res.error.message)
      await loadData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to initiate Google Calendar connection')
    }
  }

  const clearMemories = async (): Promise<void> => {
    try {
      setActionError(null)
      const res = await apiClearMemories()
      await loadData()
      setActionSuccess('Successfully cleared all saved memories (' + res.count + ' removed)')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to clear memories')
    }
  }

  const clearAllData = async (): Promise<void> => {
    try {
      setActionError(null)
      const res = await apiClearAllData()
      if (res.errors && res.errors.length > 0) {
        setActionError('Partial cleanup error: ' + res.errors.join(', '))
      } else {
        setActionSuccess('All local data and connections cleared successfully')
      }
      if (onDataReset) {
        onDataReset()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to clear local data')
    }
  }

  const openMicSettings = async (): Promise<void> => {
    try {
      await openSystemMicSettings()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to open system settings')
    }
  }

  return {
    authStatus,
    calendarStatus,
    systemInfo,
    memoryCount,
    micState,
    isLoading,
    actionError,
    actionSuccess,
    setActionSuccess,
    setActionError,
    clearActionFeedback: () => {
      setActionError(null)
      setActionSuccess(null)
    },
    disconnectCalendar,
    connectCalendar,
    clearMemories,
    clearAllData,
    openMicSettings,
    refresh: loadData
  }
}
