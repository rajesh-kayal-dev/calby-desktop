import { useState, useEffect, type FC } from 'react'
import type { Reminder } from '../reminders/types'
import type { CalendarEvent } from '../calendar/types'

interface HomeContextCardProps {
  onNavigate?: (view: 'reminders' | 'calendar', reminderId?: string) => void
}

type ContextItem =
  | {
      type: 'reminder_soon'
      badge: string
      title: string
      timeDetail?: string
      reminderId: string
    }
  | {
      type: 'calendar_upcoming'
      badge: string
      title: string
      timeDetail?: string
    }
  | {
      type: 'missed_reminder'
      badge: string
      title: string
      subtitle: string
      reminderId: string
    }
  | {
      type: 'calendar_tomorrow'
      badge: string
      title: string
    }

export const HomeContextCard: FC<HomeContextCardProps> = ({ onNavigate }) => {
  const [contextItem, setContextItem] = useState<ContextItem | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true

    const loadContext = async (): Promise<void> => {
      try {
        const now = new Date()
        const nowMs = now.getTime()
        const twoHoursMs = 2 * 60 * 60 * 1000
        const endOfDayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
        const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999)

        // 1. Fetch Reminders
        let reminders: Reminder[] = []
        if (window.calby?.reminders?.list) {
          const res = await window.calby.reminders.list()
          if (res.ok && Array.isArray(res.data)) {
            reminders = res.data
          }
        }

        // 2. Fetch Calendar Events
        let calendarEvents: CalendarEvent[] = []
        if (window.calby?.calendar?.getUpcoming) {
          try {
            const calStatus = await window.calby.calendar.getStatus?.()
            if (calStatus?.ok && calStatus.data?.status === 'connected') {
              const res = await window.calby.calendar.getUpcoming()
              if (res.ok && Array.isArray(res.data)) {
                calendarEvents = res.data
              }
            }
          } catch {
            // Calendar not available / not connected
          }
        }

        if (!isMounted) return

        // Priority 1: Reminder happening soon (in next 2 hours or today)
        const activeReminders = reminders.filter(
          (r) => r.status === 'scheduled' || r.status === 'snoozed'
        )

        const soonReminder = activeReminders
          .map((r) => ({ reminder: r, time: new Date(r.scheduledAt).getTime() }))
          .filter(({ time }) => time >= nowMs && time <= nowMs + twoHoursMs)
          .sort((a, b) => a.time - b.time)[0]

        if (soonReminder) {
          const diffMinutes = Math.max(1, Math.round((soonReminder.time - nowMs) / 60000))
          const badgeText = diffMinutes < 60 ? `Reminder in ${diffMinutes} min` : `Reminder in ${Math.round(diffMinutes / 60)} hr`
          setContextItem({
            type: 'reminder_soon',
            badge: badgeText,
            title: soonReminder.reminder.title,
            reminderId: soonReminder.reminder.id
          })
          return
        }

        // Check if reminder is later today
        const todayReminder = activeReminders
          .map((r) => ({ reminder: r, time: new Date(r.scheduledAt).getTime() }))
          .filter(({ time }) => time >= nowMs && time <= endOfDayMs)
          .sort((a, b) => a.time - b.time)[0]

        if (todayReminder) {
          const timeStr = new Date(todayReminder.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          setContextItem({
            type: 'reminder_soon',
            badge: `Today · ${timeStr}`,
            title: todayReminder.reminder.title,
            reminderId: todayReminder.reminder.id
          })
          return
        }

        // Priority 2: Upcoming calendar event (today or tomorrow)
        const validEvents = calendarEvents
          .filter((e) => e.startDateTime || e.startDate)
          .map((e) => {
            const startTime = new Date(e.startDateTime || e.startDate || '').getTime()
            return { event: e, startTime }
          })
          .filter(({ startTime }) => !isNaN(startTime) && startTime >= nowMs)
          .sort((a, b) => a.startTime - b.startTime)

        const nextEvent = validEvents[0]
        if (nextEvent) {
          const eventDate = new Date(nextEvent.startTime)
          const isToday = eventDate.toDateString() === now.toDateString()
          const isTomorrow = eventDate.toDateString() === tomorrowStart.toDateString()
          const timeStr = nextEvent.event.allDay
            ? 'All day'
            : eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

          if (isToday) {
            const diffMinutes = Math.round((nextEvent.startTime - nowMs) / 60000)
            const badge = diffMinutes > 0 && diffMinutes <= 60 ? `In ${diffMinutes} min` : `Today · ${timeStr}`
            setContextItem({
              type: 'calendar_upcoming',
              badge,
              title: nextEvent.event.title || 'Untitled Event'
            })
            return
          }

          if (isTomorrow) {
            setContextItem({
              type: 'calendar_upcoming',
              badge: `Tomorrow · ${timeStr}`,
              title: nextEvent.event.title || 'Untitled Event'
            })
            return
          }
        }

        // Priority 3: Missed reminder
        const missedReminder = reminders
          .filter((r) => r.status === 'missed' || (r.status === 'scheduled' && new Date(r.scheduledAt).getTime() < nowMs - 60000))
          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0]

        if (missedReminder) {
          const timeStr = new Date(missedReminder.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          setContextItem({
            type: 'missed_reminder',
            badge: 'Missed reminder',
            title: missedReminder.title,
            subtitle: `Scheduled for ${timeStr}`,
            reminderId: missedReminder.id
          })
          return
        }

        // Priority 4: Tomorrow calendar summary if any
        const tomorrowEvents = validEvents.filter(
          ({ startTime }) => startTime >= tomorrowStart.getTime() && startTime <= tomorrowEnd.getTime()
        )
        if (tomorrowEvents.length > 0) {
          const count = tomorrowEvents.length
          setContextItem({
            type: 'calendar_tomorrow',
            badge: 'Tomorrow',
            title: `${count} meeting${count > 1 ? 's' : ''} on your calendar`
          })
          return
        }

        // Nothing useful to show
        setContextItem(null)
      } catch (err) {
        console.error('[HomeContextCard] Failed to compute context:', err)
        if (isMounted) setContextItem(null)
      }
    }

    void loadContext()

    // Subscribe to reminder changes
    const unsubReminders = window.calby?.reminders?.onChanged?.(() => {
      void loadContext()
    })

    // Refresh interval (every 30s)
    const interval = setInterval(() => {
      void loadContext()
    }, 30000)

    return () => {
      isMounted = false
      if (unsubReminders) unsubReminders()
      clearInterval(interval)
    }
  }, [])

  if (!contextItem || dismissed) {
    return null
  }

  const handleClick = (): void => {
    if (contextItem.type === 'reminder_soon' || contextItem.type === 'missed_reminder') {
      onNavigate?.('reminders', contextItem.reminderId)
    } else if (contextItem.type === 'calendar_upcoming' || contextItem.type === 'calendar_tomorrow') {
      onNavigate?.('calendar')
    }
  }

  return (
    <aside
      aria-label="Contextual summary"
      onClick={handleClick}
      className={[
        'group cursor-pointer transition-all duration-200',
        'px-3.5 py-2.5 rounded-xl border backdrop-blur-md',
        'max-w-[240px] text-left shadow-lg',
        contextItem.type === 'missed_reminder'
          ? 'bg-[#1C1318]/80 border-amber-500/30 hover:border-amber-500/50 shadow-amber-950/20'
          : 'bg-[#0B1320]/80 border-[#1E293B] hover:border-sky-500/40 shadow-black/30'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={[
            'text-[11px] font-medium tracking-wide mt-0.5',
            contextItem.type === 'missed_reminder' ? 'text-amber-400' : 'text-sky-400'
          ].join(' ')}
        >
          {contextItem.badge}
        </span>
        <div className="flex items-center gap-1.5 -mt-1 -mr-1">
          {contextItem.type === 'missed_reminder' && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 group-hover:bg-amber-500/30">
              View
            </span>
          )}
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs font-semibold text-slate-100 truncate leading-snug">
        {contextItem.title}
      </p>

      {contextItem.type === 'missed_reminder' && (
        <p className="mt-0.5 text-[10px] text-slate-400 truncate">
          {contextItem.subtitle}
        </p>
      )}
    </aside>
  )
}
