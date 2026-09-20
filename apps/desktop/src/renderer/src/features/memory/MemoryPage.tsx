import { useState, type FC } from 'react'
import { useMemory } from './hooks/useMemory'
import { MemoryCard } from './components/MemoryCard'
import { CreateMemoryModal } from './components/CreateMemoryModal'
import { EditMemoryModal } from './components/EditMemoryModal'
import { MemoryEmptyState } from './components/MemoryEmptyState'
import { MemorySearch } from './components/MemorySearch'
import type { Memory } from './types'

interface MemoryPageProps {
  onNavigateHome: () => void
  onNavigateReminders?: () => void
  onNavigateCalendar?: () => void
  onNavigateSettings?: () => void
}

export const MemoryPage: FC<MemoryPageProps> = ({
  onNavigateHome,
  onNavigateReminders,
  onNavigateCalendar,
  onNavigateSettings
}) => {
  const {
    memories,
    isLoading,
    error,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    create,
    update,
    remove
  } = useMemory()

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)

  const hasFilterOrSearch = Boolean(searchQuery.trim() || filterType !== 'all')

  return (
    <div
      data-testid="memory-page"
      className="flex-1 flex flex-col h-full overflow-hidden bg-[#070A11] text-slate-100 p-6 space-y-6"
    >
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          type="button"
          data-testid="back-to-home-button"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-sky-400 transition-colors font-medium cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to Voice Assistant</span>
        </button>

        <div className="flex items-center gap-3">
                    {onNavigateSettings && (
            <button
              onClick={onNavigateSettings}
              type="button"
              data-testid="memory-nav-settings-button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          )}
          {onNavigateCalendar && (
            <button
              onClick={onNavigateCalendar}
              type="button"
              data-testid="memory-nav-calendar-button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Calendar</span>
            </button>
          )}
          {onNavigateReminders && (
            <button
              onClick={onNavigateReminders}
              type="button"
              data-testid="memory-nav-reminders-button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Reminders</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Row: Title, Subtitle, & Add Memory Button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Personal Memory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Facts, notes, and preferences Calby remembers about you
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          type="button"
          data-testid="add-memory-button"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-400 hover:bg-sky-300 text-slate-900 font-semibold text-xs rounded-xl transition-all shadow-md hover:shadow-sky-500/20 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Add Memory</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <MemorySearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterChange={setFilterType}
      />

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading memories...</p>
          </div>
        ) : memories.length === 0 ? (
          <MemoryEmptyState
            hasFilterOrSearch={hasFilterOrSearch}
            onAddMemory={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {memories.map((mem) => (
              <MemoryCard
                key={mem.id}
                memory={mem}
                onEdit={(m) => setEditingMemory(m)}
                onDelete={(id) => void remove(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateMemoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (input) => {
          await create(input)
        }}
      />

      <EditMemoryModal
        memory={editingMemory}
        isOpen={Boolean(editingMemory)}
        onClose={() => setEditingMemory(null)}
        onSubmit={async (input) => {
          await update(input)
        }}
      />
    </div>
  )
}
