import { useState, type FC } from 'react'
import { useMemory } from './hooks/useMemory'
import { MemoryCard } from './components/MemoryCard'
import { CreateMemoryModal } from './components/CreateMemoryModal'
import { EditMemoryModal } from './components/EditMemoryModal'
import { MemoryEmptyState } from './components/MemoryEmptyState'
import { MemorySearch } from './components/MemorySearch'
import type { Memory } from './types'

// No navigation props — all navigation is handled by the shared NavBar in App
export const MemoryPage: FC = () => {
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
      className="flex-1 flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: 'var(--ds-canvas-base)', color: 'var(--ds-text-primary)' }}
    >
      {/* Page content — Phase 5 layout preserved */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 pt-5 pb-6 gap-5">

        {/* Header Row: Title + Add Memory button */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
            >
              Personal Memory
            </h1>
            <p className="mt-0.5" style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}>
              What Calby remembers about you.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            type="button"
            data-testid="add-memory-button"
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white font-medium text-sm px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Add Memory</span>
          </button>
        </div>

        {/* Search bar — full width, Phase 5 design */}
        <MemorySearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterChange={setFilterType}
        />

        {/* Error alert */}
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
          >
            {error}
          </div>
        )}

        {/* Memory list / empty / loading */}
        <div className="flex-1 overflow-y-auto pr-1 pb-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
              <div className="w-5 h-5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono" style={{ color: 'var(--ds-text-muted)' }}>Loading memories...</p>
            </div>
          ) : memories.length === 0 ? (
            <MemoryEmptyState
              hasFilterOrSearch={hasFilterOrSearch}
              onAddMemory={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="space-y-2">
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
