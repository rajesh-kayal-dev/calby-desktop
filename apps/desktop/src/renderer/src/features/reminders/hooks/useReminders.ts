import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Reminder, RemindersTab, ReminderGroup } from '../types'
import {
  fetchReminders,
  completeReminder,
  deleteReminder,
  snoozeReminder,
  dismissReminder
} from '../reminders-api'

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<RemindersTab>('upcoming')
  const [triggeredReminder, setTriggeredReminder] = useState<Reminder | null>(null)

  const loadReminders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const list = await fetchReminders()
      setReminders(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReminders()

    // 1. Subscribe to IPC data updates
    const unsubscribeChanged = window.calby?.reminders?.onChanged((payload) => {
      console.log('[useReminders] IPC change received:', payload)
      setReminders((prev) => {
        if (payload.action === 'created') {
          // Avoid duplicate if already in state
          if (prev.some((r) => r.id === payload.reminder.id)) return prev
          return [...prev, payload.reminder].sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
        }
        if (payload.action === 'updated') {
          return prev.map((r) => (r.id === payload.reminder.id ? payload.reminder : r))
        }
        if (payload.action === 'deleted') {
          return prev.filter((r) => r.id !== payload.reminder.id)
        }
        return prev
      })
    })

    // 2. Subscribe to Alarm triggers
    const unsubscribeTriggered = window.calby?.reminders?.onTriggered((payload) => {
      console.log('[useReminders] IPC triggered received:', payload)
      setTriggeredReminder(payload.reminder)
    })

    return () => {
      if (unsubscribeChanged) unsubscribeChanged()
      if (unsubscribeTriggered) unsubscribeTriggered()
    }
  }, [loadReminders])

  const onComplete = useCallback(async (id: string) => {
    try {
      const updated = await completeReminder(id)
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)))
      if (triggeredReminder?.id === id) {
        setTriggeredReminder(null)
      }
    } catch (err) {
      console.error('Failed to complete reminder:', err)
    }
  }, [triggeredReminder])

  const onDelete = useCallback(async (id: string) => {
    try {
      await deleteReminder(id)
      setReminders((prev) => prev.filter((r) => r.id !== id))
      if (triggeredReminder?.id === id) {
        setTriggeredReminder(null)
      }
    } catch (err) {
      console.error('Failed to delete reminder:', err)
    }
  }, [triggeredReminder])

  const onSnooze = useCallback(async (id: string, minutes: number = 5) => {
    try {
      const updated = await snoozeReminder(id, minutes)
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)))
      if (triggeredReminder?.id === id) {
        setTriggeredReminder(null)
      }
    } catch (err) {
      console.error('Failed to snooze reminder:', err)
    }
  }, [triggeredReminder])

  const onDismiss = useCallback(async (id: string) => {
    try {
      const updated = await dismissReminder(id)
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)))
      if (triggeredReminder?.id === id) {
        setTriggeredReminder(null)
      }
    } catch (err) {
      console.error('Failed to dismiss reminder:', err)
    }
  }, [triggeredReminder])

  // Counts
  const upcomingReminders = useMemo(() => {
    return reminders.filter(
      (r) => r.status === 'scheduled' || r.status === 'snoozed' || r.status === 'triggered'
    )
  }, [reminders])

  const completedReminders = useMemo(() => {
    return reminders.filter((r) => r.status === 'completed' || r.status === 'dismissed')
  }, [reminders])

  // Group upcoming reminders by date (Today, Tomorrow, Upcoming)
  const groupedUpcoming = useMemo((): ReminderGroup[] => {
    const today: Reminder[] = []
    const tomorrow: Reminder[] = []
    const upcoming: Reminder[] = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000
    const dayAfterTomorrowStart = tomorrowStart + 24 * 60 * 60 * 1000

    for (const r of upcomingReminders) {
      const rTime = new Date(r.scheduledAt).getTime()
      if (rTime < tomorrowStart) {
        today.push(r)
      } else if (rTime < dayAfterTomorrowStart) {
        tomorrow.push(r)
      } else {
        upcoming.push(r)
      }
    }

    const groups: ReminderGroup[] = []
    if (today.length > 0) groups.push({ label: 'Today', reminders: today })
    if (tomorrow.length > 0) groups.push({ label: 'Tomorrow', reminders: tomorrow })
    if (upcoming.length > 0) groups.push({ label: 'Upcoming', reminders: upcoming })
    return groups
  }, [upcomingReminders])

  return {
    reminders,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    upcomingCount: upcomingReminders.length,
    completedCount: completedReminders.length,
    groupedUpcoming,
    completedReminders,
    triggeredReminder,
    setTriggeredReminder,
    refresh: loadReminders,
    onComplete,
    onDelete,
    onSnooze,
    onDismiss
  }
}