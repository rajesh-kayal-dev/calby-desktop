import { useState, useEffect, useMemo, type FC } from 'react'
import { useCalendar } from './hooks/useCalendar'
import type { CalendarEvent } from './types'
import { CalendarEventCard } from './components/CalendarEventCard'
import { CalendarEmptyState } from './components/CalendarEmptyState'
import { CalendarConnectionBanner } from './components/CalendarConnectionBanner'
import { EventDetailsModal } from './components/EventDetailsModal'
import { CalendarWeekStrip } from './components/CalendarWeekStrip'
import { CreateCalendarEventModal } from './components/CreateCalendarEventModal'
import { getEventDateKey, getDateKey } from './utils/dateTime'

export const CalendarPage: FC = () => {
  const {
    status,
    events,
    isLoading,
    isSyncing,
    isConnecting,
    error,
    refresh,
    connect,
    disconnect,
    setError,
    addEvent
  } = useCalendar()

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current))
    }, 4000)
  }

  // Silent background revalidation on mount
  useEffect(() => {
    void refresh(false)
  }, [refresh])

  const handleConnect = async () => {
    setError(null)
    const success = await connect()
    if (success) {
      showToast('Google Calendar connected successfully')
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (err: unknown) {
      console.error('[CalendarPage] Disconnect error:', err)
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    }
  }

  const handleSetReminder = async (event: CalendarEvent) => {
    try {
      let scheduledAt = event.startDateTime
      if (!scheduledAt && event.startDate) {
        scheduledAt = new Date(event.startDate + 'T09:00:00').toISOString()
      }
      if (!scheduledAt) {
        scheduledAt = new Date().toISOString()
      }

      await window.calby.reminders.create({
        title: `Meeting: ${event.title}`,
        scheduledAt: scheduledAt,
        alarmEnabled: true
      })
      showToast(`Reminder created for "${event.title}"`)
    } catch (err: unknown) {
      console.error('[CalendarPage] Set reminder error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create reminder')
    }
  }

  const handleSelectTab = (tab: 'today' | 'tomorrow' | 'upcoming') => {
    setActiveTab(tab)
    const now = new Date()
    if (tab === 'today') {
      setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    } else if (tab === 'tomorrow') {
      setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
    }
  }

  const handleSelectDateFromStrip = (d: Date) => {
    setSelectedDate(d)
    const now = new Date()
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()

    if (isToday) {
      setActiveTab('today')
    } else if (isTomorrow) {
      setActiveTab('tomorrow')
    } else {
      setActiveTab('today')
    }
  }

  const activeDayEvents = useMemo(() => {
    const selectedKey = getDateKey(selectedDate)
    return events.filter((e) => getEventDateKey(e) === selectedKey)
  }, [events, selectedDate])

  const todayEventsCount = useMemo(() => {
    const todayKey = getDateKey(new Date())
    return events.filter((e) => getEventDateKey(e) === todayKey).length
  }, [events])

  const tomorrowEventsCount = useMemo(() => {
    const now = new Date()
    const tomorrowKey = getDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
    return events.filter((e) => getEventDateKey(e) === tomorrowKey).length
  }, [events])

  const groupedUpcomingEvents = useMemo(() => {
    const groups: { dateKey: string; dayLabel: string; events: CalendarEvent[] }[] = []
    const map = new Map<string, CalendarEvent[]>()

    for (const event of events) {
      const key = getEventDateKey(event) || 'unknown'
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(event)
    }

    const sortedKeys = Array.from(map.keys()).sort()
    for (const key of sortedKeys) {
      let dayLabel = key
      if (key !== 'unknown') {
        const [y, m, d] = key.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)
        dayLabel = dateObj.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        })
      }
      groups.push({
        dateKey: key,
        dayLabel,
        events: map.get(key)!
      })
    }

    return groups
  }, [events])

  const activeSectionTitle = useMemo(() => {
    if (activeTab === 'upcoming') {
      return `Next 7 Days · ${events.length} event${events.length === 1 ? '' : 's'}`
    }
    const isToday = getDateKey(selectedDate) === getDateKey(new Date())
    const isTomorrow =
      getDateKey(selectedDate) ===
      getDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1))

    const dateStr = selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    if (isToday) {
      return `Today (${dateStr}) · ${activeDayEvents.length} event${activeDayEvents.length === 1 ? '' : 's'}`
    }
    if (isTomorrow) {
      return `Tomorrow (${dateStr}) · ${activeDayEvents.length} event${activeDayEvents.length === 1 ? '' : 's'}`
    }
    return `${dateStr} · ${activeDayEvents.length} event${activeDayEvents.length === 1 ? '' : 's'}`
  }, [activeTab, selectedDate, activeDayEvents.length, events.length])

  const isConnected = status.status === 'connected'

  return (
    <div data-testid="calendar-page" className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--ds-canvas-base)', color: 'var(--ds-text-primary)' }}>
      {/* Page Header — Phase 4 layout: title left, Create Event + Refresh right */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ backgroundColor: 'var(--ds-canvas-base)', borderBottomColor: 'var(--ds-border-subtle)' }}
      >
        <div>
          <h1
            className="font-semibold tracking-tight"
            style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
          >
            Calendar &amp; Schedule
          </h1>
          <p style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}>
            Your upcoming schedule. Smarter with Calby. Google Calendar integration for Calby voice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Event Button — only when connected */}
          {isConnected && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              type="button"
              data-testid="create-event-button"
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Event</span>
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => void refresh(false)}
            disabled={isLoading || isSyncing || isConnecting}
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-40"
            style={{ backgroundColor: 'var(--ds-surface-card)', borderColor: 'var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}
            title="Refresh schedule"
            aria-label="Refresh calendar"
          >
            <svg
              className={`w-4 h-4 ${isLoading || isSyncing ? 'animate-spin text-[#38BDF8]' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Connection State Banner */}
        <CalendarConnectionBanner
          status={status}
          isConnecting={isConnecting}
          onConnect={() => void handleConnect()}
          onDisconnect={() => void handleDisconnect()}
        />

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Persistent Calendar Overview Strip */}
        <CalendarWeekStrip
          selectedDate={selectedDate}
          onSelectDate={handleSelectDateFromStrip}
          events={events}
        />

        {/* Filter Quick-Tabs & Sync Status */}
        {isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectTab('today')}
                  type="button"
                  data-testid="calendar-tab-today"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'today'
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
                  }`}
                >
                  Today ({todayEventsCount})
                </button>
                <button
                  onClick={() => handleSelectTab('tomorrow')}
                  type="button"
                  data-testid="calendar-tab-tomorrow"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'tomorrow'
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
                  }`}
                >
                  Tomorrow ({tomorrowEventsCount})
                </button>
                <button
                  onClick={() => handleSelectTab('upcoming')}
                  type="button"
                  data-testid="calendar-tab-upcoming"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'upcoming'
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
                  }`}
                >
                  Next 7 Days ({events.length})
                </button>
              </div>

              <span className="text-[11px] text-slate-500">
                {status.lastSyncedAt
                  ? `Synced ${new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                  : 'Up to date'}
              </span>
            </div>

            {/* Section Summary Header */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-300">{activeSectionTitle}</span>
            </div>

            {/* Events Timeline / Agenda View */}
            {isLoading && events.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
                <svg className="w-4 h-4 animate-spin text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Loading calendar schedule...</span>
              </div>
            ) : (activeTab === 'upcoming' ? events.length === 0 : activeDayEvents.length === 0) ? (
              <CalendarEmptyState
                filter={activeTab}
                selectedDateLabel={selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              />
            ) : activeTab === 'upcoming' && groupedUpcomingEvents.length > 0 ? (
              <div className="space-y-6">
                {groupedUpcomingEvents.map((group) => (
                  <div key={group.dateKey} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-400 tracking-wide uppercase">
                        {group.dayLabel}
                      </span>
                      <div className="flex-1 h-[1px] bg-[#1E293B]" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {group.events.map((event: CalendarEvent) => (
                        <CalendarEventCard
                          key={event.id}
                          event={event}
                          onClick={() => setSelectedEvent(event)}
                          onSetReminder={handleSetReminder}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {activeDayEvents.map((event: CalendarEvent) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                    onSetReminder={handleSetReminder}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSetReminder={handleSetReminder}
      />

      {/* Create Event Modal */}
      <CreateCalendarEventModal
        isOpen={isCreateModalOpen}
        hasWriteAccess={status?.hasWriteAccess ?? true}
        onClose={() => setIsCreateModalOpen(false)}
        onWriteAccessGranted={() => {
          void refresh(false)
        }}
        onSuccess={(createdEvent) => {
          showToast('Event created successfully')
          if (createdEvent) {
            addEvent(createdEvent)
            setSelectedEvent(createdEvent)
            const dateKey = getEventDateKey(createdEvent)
            if (dateKey) {
              const [y, m, d] = dateKey.split('-').map(Number)
              setSelectedDate(new Date(y, m - 1, d))
            }
          }
          void refresh(false)
        }}
      />

      {/* Success Toast Notification */}
      {toastMessage && (
        <div
          data-testid="calendar-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#121826] border border-emerald-500/30 rounded-xl shadow-xl text-xs font-medium text-emerald-300 animate-in fade-in slide-in-from-bottom-2"
        >
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
