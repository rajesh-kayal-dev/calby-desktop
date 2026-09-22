import { useState, useEffect, useMemo, type FC } from 'react'
import { useCalendar } from './hooks/useCalendar'
import type { CalendarEvent } from './types'
import { CalendarEventCard } from './components/CalendarEventCard'
import { CalendarEmptyState } from './components/CalendarEmptyState'
import { CalendarConnectionBanner } from './components/CalendarConnectionBanner'
import { EventDetailsModal } from './components/EventDetailsModal'
import { CalendarWeekStrip } from './components/CalendarWeekStrip'
import { CreateCalendarEventModal } from './components/CreateCalendarEventModal'
import { SetCalendarReminderModal } from './components/SetCalendarReminderModal'
import { getEventDateKey, getDateKey } from './utils/dateTime'

// ── Icons ─────────────────────────────────────────────────────────────────

const JoinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

const PrepareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.5 2A2.5 2.5 0 007 4.5v.7A3 3 0 004 8c0 1.2.7 2.2 1.7 2.7A3 3 0 004 13.5c0 1.2.7 2.2 1.7 2.7-.2.6-.2 1.3 0 1.8A2.5 2.5 0 008.2 20h.8a2.5 2.5 0 002.5-2.5V4.5A2.5 2.5 0 009.5 2z" />
    <path d="M14.5 2a2.5 2.5 0 012.5 2.5v.7A3 3 0 0120 8c0 1.2-.7 2.2-1.7 2.7A3 3 0 0120 13.5c0 1.2-.7 2.2-1.7 2.7.2.6.2 1.3 0 1.8a2.5 2.5 0 01-2.5 2h-.8a2.5 2.5 0 01-2.5-2.5V4.5A2.5 2.5 0 0114.5 2z" />
  </svg>
)

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg
    className={`w-4 h-4 ${spinning ? 'animate-spin text-[#38BDF8]' : ''}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)


const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const WifiOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
    <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0122.56 9" />
    <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
    <path d="M8.53 16.11a6 6 0 016.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
)

// ── What's Next Panel ──────────────────────────────────────────────────────

interface WhatsNextPanelProps {
  events: CalendarEvent[]
  status: { status: string; lastSyncedAt?: string | null }
  isSyncing: boolean
  onRefresh: () => void
  onSetReminder: (event: CalendarEvent) => void
}

const WhatsNextPanel: FC<WhatsNextPanelProps> = ({ events, status, isSyncing, onRefresh, onSetReminder }) => {
  const [memories, setMemories] = useState<string[]>([])
  const [isPreparing, setIsPreparing] = useState(false)
  const [prepareTarget, setPrepareTarget] = useState<CalendarEvent | null>(null)

  const now = new Date()

  // Find next upcoming event
  const nextEvent = useMemo(() => {
    const sorted = events
      .filter(e => e.startDateTime)
      .map(e => ({ event: e, start: new Date(e.startDateTime!).getTime() }))
      .filter(({ start }) => start >= now.getTime())
      .sort((a, b) => a.start - b.start)
    return sorted[0] ?? null
  }, [events])

  // Find currently happening event
  const currentEvent = useMemo(() => {
    return events.find(e => {
      if (!e.startDateTime || !e.endDateTime) return false
      const start = new Date(e.startDateTime).getTime()
      const end = new Date(e.endDateTime).getTime()
      const n = now.getTime()
      return n >= start && n <= end
    }) ?? null
  }, [events])

  const displayEvent = currentEvent ?? nextEvent?.event ?? null

  const relativeLabel = useMemo(() => {
    if (!displayEvent) return null
    if (currentEvent) return 'Happening Now'
    if (nextEvent) {
      const diffMs = nextEvent.start - now.getTime()
      const diffMin = Math.round(diffMs / 60000)
      if (diffMin < 60) return `in ${diffMin} min`
      const diffHr = Math.round(diffMin / 60)
      return `in ${diffHr}h`
    }
    return null
  }, [displayEvent, currentEvent, nextEvent])

  const eventTimeLabel = useMemo(() => {
    if (!displayEvent) return null
    if (displayEvent.allDay) return 'All day'
    if (displayEvent.startDateTime && displayEvent.endDateTime) {
      const s = new Date(displayEvent.startDateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const e = new Date(displayEvent.endDateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      return `${s} – ${e}`
    }
    return null
  }, [displayEvent])

  const attendeeNames = useMemo(() => {
    if (!displayEvent?.attendees) return []
    return displayEvent.attendees
      .filter(a => !a.self)
      .map(a => a.displayName || a.email.split('@')[0])
      .slice(0, 3)
  }, [displayEvent])

  const handlePrepare = async (): Promise<void> => {
    if (!displayEvent) return
    setIsPreparing(true)
    setPrepareTarget(displayEvent)
    try {
      if (window.calby?.memory?.list) {
        const res = await window.calby.memory.list()
        if (res.ok && res.data.length > 0) {
          // Filter for relevant memories (mention attendee names or keywords from event)
          const eventWords = [
            displayEvent.title,
            ...(displayEvent.attendees?.map(a => a.displayName || a.email.split('@')[0]) ?? [])
          ].map(w => w.toLowerCase())

          const relevant = res.data
            .filter(m => eventWords.some(w => m.content.toLowerCase().includes(w)))
            .slice(0, 3)
            .map(m => m.content)

          setMemories(relevant.length > 0 ? relevant : res.data.slice(0, 2).map(m => m.content))
        }
      }
    } catch {
      // No memories available
    } finally {
      setIsPreparing(false)
    }
  }

  const syncTime = status.lastSyncedAt
    ? `Synced ${new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : null

  const isConnected = status.status === 'connected'

  return (
    <aside
      className="w-[280px] shrink-0 flex flex-col gap-4"
      aria-label="What's next and calendar summary"
    >
      {/* What's Next Card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--ds-surface-card)', border: '1px solid var(--ds-border-subtle)' }}
      >
        <div className="px-4 pt-4 pb-3 border-b" style={{ borderBottomColor: 'var(--ds-border-subtle)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              {currentEvent ? 'Happening Now' : "What's Next"}
            </span>
            {relativeLabel && !currentEvent && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8' }}>
                {relativeLabel}
              </span>
            )}
            {currentEvent && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                Live
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {!isConnected ? (
            <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
              Connect Google Calendar to see what&apos;s next.
            </p>
          ) : !displayEvent ? (
            <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
              No upcoming events. Enjoy the free time.
            </p>
          ) : (
            <div className="space-y-3">
              {eventTimeLabel && (
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                  <ClockIcon />
                  <span>{eventTimeLabel}</span>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--ds-text-primary)' }}>
                  {displayEvent.title}
                </p>
                {attendeeNames.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                    {attendeeNames.join(', ')}
                    {displayEvent.meetingUrl ? ' · Google Meet' : ''}
                  </p>
                )}
              </div>

              {displayEvent.description && (
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--ds-text-secondary)' }}>
                  {displayEvent.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                {displayEvent.meetingUrl && (
                  <button
                    type="button"
                    onClick={() => window.calby?.system?.openExternal(displayEvent.meetingUrl!)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer"
                  >
                    <JoinIcon />
                    <span>Join Meeting</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handlePrepare()}
                  disabled={isPreparing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--ds-surface-overlay)', border: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}
                >
                  {isPreparing ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PrepareIcon />
                  )}
                  <span>Prepare with Calby</span>
                </button>

                <button
                  type="button"
                  onClick={() => void onSetReminder(displayEvent)}
                  className="w-full text-xs text-center transition-colors cursor-pointer hover:text-[#38BDF8]"
                  style={{ color: 'var(--ds-text-muted)' }}
                >
                  + Set reminder
                </button>
              </div>

              {/* Prepare results */}
              {prepareTarget?.id === displayEvent.id && memories.length > 0 && (
                <div className="pt-2 border-t space-y-1.5" style={{ borderTopColor: 'var(--ds-border-subtle)' }}>
                  {memories.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#F59E0B' }} />
                      <p className="text-xs leading-snug" style={{ color: 'var(--ds-text-secondary)' }}>{m}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's Overview Card */}
      {isConnected && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--ds-surface-card)', border: '1px solid var(--ds-border-subtle)' }}
        >
          <div className="px-4 pt-4 pb-3 border-b" style={{ borderBottomColor: 'var(--ds-border-subtle)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                Today Overview
              </span>
              <span className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
                {events.length} event{events.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-4">
            {events.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                Clear day. No events scheduled.
              </p>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 4).map(e => {
                  const timeStr = e.allDay
                    ? 'All day'
                    : e.startDateTime
                    ? new Date(e.startDateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                    : null
                  return (
                    <div key={e.id} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.meetingUrl ? '#2563EB' : '#38BDF8' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--ds-text-primary)' }}>{e.title}</p>
                      </div>
                      {timeStr && (
                        <span className="text-[11px] shrink-0" style={{ color: 'var(--ds-text-muted)' }}>{timeStr}</span>
                      )}
                    </div>
                  )
                })}
                {events.length > 4 && (
                  <p className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>+{events.length - 4} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync status */}
      {isConnected && (
        <div
          className="rounded-xl p-3.5 flex items-center justify-between"
          style={{ backgroundColor: 'var(--ds-surface-card)', border: '1px solid var(--ds-border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <WifiOffIcon />
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--ds-text-primary)' }}>Calendar available offline</p>
              {syncTime && (
                <p className="text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>Last synced: {syncTime}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            style={{ color: 'var(--ds-text-muted)' }}
            title="Sync now"
            aria-label="Sync calendar now"
          >
            <RefreshIcon spinning={isSyncing} />
          </button>
        </div>
      )}
    </aside>
  )
}

// ── Main CalendarPage ──────────────────────────────────────────────────────

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
  const [reminderTargetEvent, setReminderTargetEvent] = useState<CalendarEvent | null>(null)
  const [reminderInitialLead, setReminderInitialLead] = useState<string>('5')
  const [reminderInitialCustom, setReminderInitialCustom] = useState<string>('20')
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

  const handleSetReminder = (event: CalendarEvent) => {
    setReminderInitialLead('5')
    setReminderInitialCustom('20')
    setReminderTargetEvent(event)
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

  const syncTime = status.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <div data-testid="calendar-page" className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--ds-canvas-base)', color: 'var(--ds-text-primary)' }}>
      {/* Page Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ backgroundColor: 'var(--ds-canvas-base)', borderBottomColor: 'var(--ds-border-subtle)' }}
      >
        <div>
          <h1
            className="font-semibold tracking-tight"
            style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
          >
            Calendar
          </h1>
          <p style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}>
            Your schedule, with Calby keeping you ready.
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
              <PlusIcon />
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
            <RefreshIcon spinning={isLoading || isSyncing} />
          </button>
        </div>
      </header>

      {/* Main Content: Left agenda + Right panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Main Agenda Column ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Connection Banner */}
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

          {/* Week Strip */}
          <CalendarWeekStrip
            selectedDate={selectedDate}
            onSelectDate={handleSelectDateFromStrip}
            events={events}
          />

          {/* Tabs + Events (only when connected) */}
          {isConnected && (
            <div className="space-y-4">
              {/* Tab row + sync status */}
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectTab('today')}
                    type="button"
                    data-testid="calendar-tab-today"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'today'
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
                    }`}
                  >
                    <CalendarIcon />
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

                <div className="flex items-center gap-2">
                  {syncTime && (
                    <span className="text-[11px] text-slate-500">Synced {syncTime}</span>
                  )}
                  {isConnected && (
                    <span className="text-[11px] text-emerald-500">● Calendar available offline</span>
                  )}
                </div>
              </div>

              {/* Section header */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-xs font-semibold text-slate-300">{activeSectionTitle}</span>
                {isConnected && (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors hover:text-[#38BDF8]"
                    style={{ color: 'var(--ds-text-muted)' }}
                  >
                    <PlusIcon />
                    Add Event
                  </button>
                )}
              </div>

              {/* Events list */}
              {isLoading && events.length === 0 ? (
                <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
                  <svg className="w-4 h-4 animate-spin text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Loading schedule...</span>
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

        {/* ── Right: What's Next Panel ── */}
        <div className="px-4 py-4 border-l shrink-0" style={{ borderLeftColor: 'var(--ds-border-subtle)', width: '300px' }}>
          <WhatsNextPanel
            events={activeTab === 'upcoming' ? events : activeDayEvents}
            status={status}
            isSyncing={isSyncing}
            onRefresh={() => void refresh(false)}
            onSetReminder={handleSetReminder}
          />
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSetReminder={handleSetReminder}
      />

      {/* Set Reminder Configuration Modal */}
      <SetCalendarReminderModal
        event={reminderTargetEvent}
        isOpen={Boolean(reminderTargetEvent)}
        initialLeadOption={reminderInitialLead}
        initialCustomMinutes={reminderInitialCustom}
        onClose={() => setReminderTargetEvent(null)}
        onSuccess={(message) => showToast(message)}
      />

      {/* Create Event Modal */}
      <CreateCalendarEventModal
        isOpen={isCreateModalOpen}
        hasWriteAccess={status?.hasWriteAccess ?? true}
        onClose={() => setIsCreateModalOpen(false)}
        onWriteAccessGranted={() => {
          void refresh(false)
        }}
        onSuccess={(createdEvent, leadOption, customMins) => {
          showToast('Event created successfully')
          if (createdEvent) {
            addEvent(createdEvent)
            setSelectedEvent(createdEvent)
            const dateKey = getEventDateKey(createdEvent)
            if (dateKey) {
              const [y, m, d] = dateKey.split('-').map(Number)
              setSelectedDate(new Date(y, m - 1, d))
            }
            // Show the post-creation Reminder box
            setReminderInitialLead(leadOption)
            setReminderInitialCustom(customMins)
            setReminderTargetEvent(createdEvent)
          }
          void refresh(false)
        }}
      />

      {/* Toast */}
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
