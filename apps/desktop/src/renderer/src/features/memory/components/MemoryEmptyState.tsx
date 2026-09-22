import { type FC } from 'react'

interface MemoryEmptyStateProps {
  hasFilterOrSearch: boolean
  onAddMemory: () => void
}

export const MemoryEmptyState: FC<MemoryEmptyStateProps> = ({
  hasFilterOrSearch,
  onAddMemory
}) => {
  return (
    <div
      data-testid="memory-empty-state"
      className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800/90 rounded-2xl bg-[#0C101A]/50 my-6"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#121826] border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">
        {hasFilterOrSearch ? 'No memories found' : 'No memories saved yet'}
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
        {hasFilterOrSearch
          ? 'Try adjusting your search query or category filter.'
          : 'Calby remembers things when you tell it to. Ask Calby by voice or click the button below to add personal notes and preferences.'}
      </p>
      {!hasFilterOrSearch && (
        <button
          onClick={onAddMemory}
          type="button"
          data-testid="empty-add-memory-button"
          className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Add First Memory
        </button>
      )}
    </div>
  )
}
