import { useState, useMemo, type FC } from 'react'
import { useCalendar } from './hooks/useCalendar'
import { CalendarConnectionBanner } from './components/CalendarConnectionBanner'
import { CalendarEventCard } from './components/CalendarEventCard'
import { EventDetailsModal } from './components/EventDetailsModal'
import { CalendarEmptyState } from './components/CalendarEmptyState'
import type { CalendarEvent, CalendarTabFilter } from './types'

interface CalendarPageProps {
  onNavigateHome: () => void
  onNavigateReminders?: () => void
  onNavigateMemory?: () => void
}

export const CalendarPage: FC<CalendarPageProps> = ({ onNavigateHome, onNavigateReminders, onNavigateMemory }) => {
  const {
    status,
    events,
    isLoading,
    isConnecting,
    error,
    connect,
    disconnect,
    refresh
  } = useCalendar()

  const [activeTab, setActiveTab] = useState<CalendarTabFilter>('today')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Filter events by tab
  const filteredEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tonight = new Date(today)
    tonight.setHours(23, 59, 59, 999)

    return events.filter((event) => {
      let eventDate: Date
      if (event.allDay && event.startDate) {
        const [y, m, d] = event.startDate.split('-').map(Number)
        eventDate = new Date(y, m - 1, d)
      } else if (event.startDateTime) {
        eventDate = new Date(event.startDateTime)
      } else {
        return false
      }

      if (activeTab === 'today') {
        return eventDate >= today && eventDate <= tonight
      }
      return true // 'upcoming' includes all 7 days
    })
  }, [events, activeTab])

  // Count for today
  const todayCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tonight = new Date(today)
    tonight.setHours(23, 59, 59, 999)

    return events.filter((event) => {
      if (event.allDay && event.startDate) {
        const [y, m, d] = event.startDate.split('-').map(Number)
        const date = new Date(y, m - 1, d)
        return date >= today && date <= tonight
      }
      if (event.startDateTime) {
        const date = new Date(event.startDateTime)
        return date >= today && date <= tonight
      }
      return false
    }).length
  }, [events])

  return (
    <div className="w-full h-full flex flex-col bg-[#070A11] text-slate-100 overflow-hidden select-none">
      {/* 1. Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0A0D14]/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            type="button"
            className="p-2 rounded-xl bg-[#121826] hover:bg-[#1A2236] border border-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to Home"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Calendar & Schedule</span>
            </h1>
            <p className="text-xs text-slate-400">Google Calendar integration for Calby voice & schedule awareness.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
                  {onNavigateMemory && (
          <button
            onClick={onNavigateMemory}
            type="button"
            data-testid="calendar-nav-memory-button"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#38BDF8] transition-colors font-medium cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Memory</span>
          </button>
        )}
        {onNavigateReminders && (
            <button
              onClick={onNavigateReminders}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-[#121826] hover:bg-[#162238] border border-[#1E293B] text-xs font-medium text-slate-300 hover:text-[#38BDF8] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Reminders</span>
            </button>
          )}

          <button
            onClick={() => void refresh()}
            disabled={isLoading || isConnecting}
            type="button"
            className="p-2 rounded-xl bg-[#121826] hover:bg-[#1A2236] border border-[#1E293B] text-slate-300 hover:text-[#38BDF8] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh schedule"
            aria-label="Refresh calendar"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
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
          onConnect={() => void connect()}
          onDisconnect={() => void disconnect()}
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

        {/* Filter Tabs & Content if Connected */}
        {status.status === 'connected' && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('today')}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'today'
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121826]'
                  }`}
                >
                  Today ({todayCount})
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  type="button"
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

            {/* Events List */}
            {isLoading && events.length === 0 ? (
              <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
                <svg className="w-4 h-4 animate-spin text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Loading calendar events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <CalendarEmptyState filter={activeTab} />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}