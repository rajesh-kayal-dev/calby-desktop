import { useState, type FC } from 'react'
import { useReminders } from './hooks/useReminders'
import { ReminderSection } from './components/ReminderSection'
import { ReminderCard } from './components/ReminderCard'
import { CreateEditReminderModal } from './components/CreateEditReminderModal'
import { ReminderAlarmToast } from './components/ReminderAlarmToast'
import type { Reminder } from './types'

interface RemindersPageProps {
  onNavigateHome: () => void
  onNavigateCalendar?: () => void
}

export const RemindersPage: FC<RemindersPageProps> = ({ onNavigateHome, onNavigateCalendar }) => {
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
    <div className="relative flex-1 px-8 pt-4 pb-6 flex flex-col overflow-hidden bg-[#070A11] text-white select-none">
      {/* Top Navigation / Back Link */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center text-xs text-slate-400 hover:text-[#38BDF8] transition-colors font-medium group cursor-pointer"
          type="button"
        >
          <svg
            className="w-3.5 h-3.5 mr-1.5 transform group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Home
        </button>

        {onNavigateCalendar && (
          <button
            onClick={onNavigateCalendar}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#38BDF8] transition-colors font-medium cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Calendar</span>
          </button>
        )}
      </div>

      {/* Header Row: Title & Action */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-white leading-tight">Reminders</h1>
          <p className="text-xs text-slate-400 mt-0.5">Stay on track with what matters.</p>
        </div>

        {/* Primary Action Button: + New Reminder */}
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-[#2563EB] hover:from-blue-500 hover:to-blue-600 active:scale-95 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
          <span>New Reminder</span>
        </button>
      </div>

      {/* Filter Tabs: Upcoming & Completed */}
      <div className="flex items-center space-x-2 mb-4" data-purpose="tab-filter-bar">
        {/* Upcoming Tab */}
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-sky-950/40 text-[#38BDF8] border border-[#38BDF8]/40'
              : 'bg-[#111622]/60 hover:bg-[#111622] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
          }`}
          type="button"
        >
          <span>Upcoming</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'upcoming' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {upcomingCount}
          </span>
        </button>

        {/* Completed Tab */}
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-sky-950/40 text-[#38BDF8] border border-[#38BDF8]/40'
              : 'bg-[#111622]/60 hover:bg-[#111622] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
          }`}
          type="button"
        >
          <span>Completed</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
              activeTab === 'completed' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {completedCount}
          </span>
        </button>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Main List Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4" data-purpose="reminders-list-container">
        {isLoading ? (
          <div className="h-48 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-mono">Loading reminders...</p>
          </div>
        ) : activeTab === 'upcoming' ? (
          groupedUpcoming.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1E293B] rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">No upcoming reminders</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                You’re all caught up. Say &quot;Remind me to...&quot; or create one manually.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-3.5 py-1.5 bg-[#111622] hover:bg-[#162238] border border-cyan-500/30 text-sky-300 text-xs rounded-lg transition-colors cursor-pointer"
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
                onComplete={onComplete}
                onEdit={handleOpenEdit}
                onDelete={onDelete}
              />
            ))
          )
        ) : (
          completedReminders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1E293B] rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-slate-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">No completed reminders</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Completed and dismissed reminders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase pl-1">
                Completed
              </div>
              <div className="space-y-1.5">
                {completedReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onComplete={onComplete}
                    onEdit={handleOpenEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )
        )}
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