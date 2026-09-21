import { useState, type FC } from 'react'
import { useReminders } from './hooks/useReminders'
import { ReminderSection } from './components/ReminderSection'
import { ReminderCard } from './components/ReminderCard'
import { CreateEditReminderModal } from './components/CreateEditReminderModal'
import { ReminderAlarmToast } from './components/ReminderAlarmToast'
import type { Reminder } from './types'

interface RemindersPageProps {
  highlightedReminderId?: string | null
}

export const RemindersPage: FC<RemindersPageProps> = ({ highlightedReminderId }) => {
  const {
    isLoading,
    error,
    activeTab,
    setActiveTab,
    upcomingCount,
    completedCount,
    groupedUpcoming,
    completedReminders,
    triggeredReminder,
    setTriggeredReminder,
    refresh,
    onComplete,
    onDelete,
    onSnooze,
    onDismiss
  } = useReminders()

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  const handleOpenCreate = (): void => {
    setEditingReminder(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (reminder: Reminder): void => {
    setEditingReminder(reminder)
    setIsModalOpen(true)
  }

  const handleModalClose = (): void => {
    setIsModalOpen(false)
    setEditingReminder(null)
  }

  const handleSaved = (): void => {
    void refresh()
  }

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: 'var(--ds-canvas-base)', color: 'var(--ds-text-primary)' }}
    >
      {/* Page content — Phase 3 layout preserved */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 pt-5 pb-6">

        {/* Header Row: Title + New Reminder button — matching Phase 3 design */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
            >
              Reminders
            </h1>
            <p className="mt-0.5" style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}>
              Stay on track with what matters.
            </p>
          </div>

          {/* Primary Action: + New Reminder */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>New Reminder</span>
          </button>
        </div>

        {/* Filter Tabs: Upcoming & Completed — Phase 3 tab design */}
        <div className="flex items-center gap-2 mb-5" data-purpose="tab-filter-bar">
          <button
            onClick={() => setActiveTab('upcoming')}
            data-testid="reminders-tab-upcoming"
            className={[
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
              activeTab === 'upcoming'
                ? 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/40'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] hover:border-[#334155]',
            ].join(' ')}
            style={{ backgroundColor: activeTab === 'upcoming' ? undefined : 'var(--ds-surface-card)' }}
            type="button"
          >
            <span>Upcoming</span>
            <span
              className={[
                'px-1.5 py-0.5 rounded-full text-xs font-bold leading-none',
                activeTab === 'upcoming'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                  : 'bg-[#1E293B] text-[#64748B]',
              ].join(' ')}
            >
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            data-testid="reminders-tab-completed"
            className={[
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              activeTab === 'completed'
                ? 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/40'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] hover:border-[#334155]',
            ].join(' ')}
            style={{ backgroundColor: activeTab === 'completed' ? undefined : 'var(--ds-surface-card)' }}
            type="button"
          >
            <span>Completed</span>
            <span
              className={[
                'px-1.5 py-0.5 rounded-full text-xs font-bold leading-none',
                activeTab === 'completed'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                  : 'bg-[#1E293B] text-[#64748B]',
              ].join(' ')}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="mb-4 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
          >
            <span>{error}</span>
          </div>
        )}

        {/* Main List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4" data-purpose="reminders-list-container">
          {isLoading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono" style={{ color: 'var(--ds-text-muted)' }}>Loading reminders...</p>
            </div>
          ) : activeTab === 'upcoming' ? (
            groupedUpcoming.length === 0 ? (
              /* Empty state */
              <div
                className="h-56 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed"
                style={{ borderColor: 'var(--ds-border-subtle)' }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', color: '#38BDF8' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-text-primary)' }}>No upcoming reminders</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)', maxWidth: '240px' }}>
                  You&apos;re all caught up. Say &quot;Remind me to...&quot; or create one manually.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--ds-surface-card)', border: '1px solid rgba(56,189,248,0.25)', color: '#38BDF8' }}
                  type="button"
                >
                  + Create Reminder
                </button>
              </div>
            ) : (
              groupedUpcoming.map((group) => (
                <ReminderSection
                  key={group.label}
                  label={group.label}
                  reminders={group.reminders}
                  highlightedReminderId={highlightedReminderId}
                  onComplete={onComplete}
                  onEdit={handleOpenEdit}
                  onDelete={onDelete}
                />
              ))
            )
          ) : (
            completedReminders.length === 0 ? (
              /* Completed empty state */
              <div
                className="h-56 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed"
                style={{ borderColor: 'var(--ds-border-subtle)' }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'var(--ds-surface-card)', border: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-muted)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-text-primary)' }}>No completed reminders</h3>
                <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                  Completed and dismissed reminders will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className="text-xs font-semibold tracking-wider uppercase pl-1 pb-1"
                  style={{ color: 'var(--ds-text-muted)' }}
                >
                  Completed
                </div>
                {completedReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    isHighlighted={reminder.id === highlightedReminderId}
                    onComplete={onComplete}
                    onEdit={handleOpenEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <CreateEditReminderModal
        isOpen={isModalOpen}
        editingReminder={editingReminder}
        onClose={handleModalClose}
        onSaved={handleSaved}
      />

      {/* Floating In-App Alarm Toast */}
      <ReminderAlarmToast
        reminder={triggeredReminder}
        onSnooze={(id) => void onSnooze(id)}
        onDismiss={(id) => void onDismiss(id)}
        onClose={() => setTriggeredReminder(null)}
      />
    </div>
  )
}
