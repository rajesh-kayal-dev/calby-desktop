import { useState, useEffect, useCallback } from 'react'
import type {
  AuthStatus,
  CalendarStatus,
  SystemInfo,
  MicPermissionState,
  AppConfig,
  GeneralSettings,
  PersonalizeSettings,
  VoiceSettings,
  ReminderSettings
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

  useEffect(() => {
    if (!actionSuccess) return
    const timer = setTimeout(() => {
      setActionSuccess(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [actionSuccess])

  useEffect(() => {
    if (!actionError) return
    const timer = setTimeout(() => {
      setActionError(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [actionError])

  const [config, setConfig] = useState<AppConfig | null>(null)

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

      // 5. Config Settings
      if (window.calby?.settings?.getConfig) {
        const cfgRes = await window.calby.settings.getConfig()
        if (cfgRes.ok) setConfig(cfgRes.data)
      }

      // 6. Microphone permission query via navigator.permissions where supported
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

  const updatePersonalize = async (input: Partial<PersonalizeSettings>): Promise<boolean> => {
    if (!window.calby?.settings?.updatePersonalize) return false
    try {
      setActionError(null)
      const res = await window.calby.settings.updatePersonalize(input)
      if (!res.ok) throw new Error(res.error.message)
      setConfig((prev) => (prev ? { ...prev, personalize: res.data } : null))
      setActionSuccess('Personalization preferences saved.')
      return true
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save personalization preferences')
      return false
    }
  }

  const updateVoiceSettings = async (input: Partial<VoiceSettings>): Promise<boolean> => {
    if (!window.calby?.settings?.updateVoiceSettings) return false
    try {
      setActionError(null)
      const res = await window.calby.settings.updateVoiceSettings(input)
      if (!res.ok) throw new Error(res.error.message)
      setConfig((prev) => (prev ? { ...prev, voice: res.data } : null))
      return true
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update voice settings')
      return false
    }
  }

  const updateReminderSettings = async (input: Partial<ReminderSettings>): Promise<boolean> => {
    if (!window.calby?.settings?.updateReminderSettings) return false
    try {
      setActionError(null)
      const res = await window.calby.settings.updateReminderSettings(input)
      if (!res.ok) throw new Error(res.error.message)
      setConfig((prev) => (prev ? { ...prev, reminders: res.data } : null))
      return true
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update reminder settings')
      return false
    }
  }

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

  const updateGeneralSettings = async (input: Partial<GeneralSettings>): Promise<boolean> => {
    if (!window.calby?.settings?.updateGeneralSettings) return false
    try {
      setActionError(null)
      const res = await window.calby.settings.updateGeneralSettings(input)
      if (!res.ok) throw new Error(res.error.message)
      setConfig((prev) => (prev ? { ...prev, general: res.data } : null))
      return true
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update general settings')
      return false
    }
  }

  const openNotificationSettings = async (): Promise<void> => {
    try {
      if (window.calby?.settings?.openNotificationSettings) {
        await window.calby.settings.openNotificationSettings()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to open system notification settings')
    }
  }

  return {
    authStatus,
    calendarStatus,
    systemInfo,
    memoryCount,
    micState,
    config,
    isLoading,
    actionError,
    actionSuccess,
    setActionSuccess,
    setActionError,
    clearActionFeedback: () => {
      setActionError(null)
      setActionSuccess(null)
    },
    updateGeneralSettings,
    updatePersonalize,
    updateVoiceSettings,
    updateReminderSettings,
    disconnectCalendar,
    connectCalendar,
    clearMemories,
    clearAllData,
    openMicSettings,
    openNotificationSettings,
    refresh: loadData
  }
}
