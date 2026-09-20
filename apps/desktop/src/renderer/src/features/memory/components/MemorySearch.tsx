import { type FC } from 'react'
import type { MemoryFilterType } from '../types'

interface MemorySearchProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  filterType: MemoryFilterType
  onFilterChange: (type: MemoryFilterType) => void
}

const FILTERS: { type: MemoryFilterType; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'work', label: 'Work' },
  { type: 'person', label: 'Person' },
  { type: 'preference', label: 'Preference' },
  { type: 'fact', label: 'Fact' },
  { type: 'general', label: 'General' }
]

export const MemorySearch: FC<MemorySearchProps> = ({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange
}) => {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <svg
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          type="text"
          data-testid="memory-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search personal memories..."
          className="w-full pl-10 pr-4 py-2 bg-[#0C101A] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            data-testid={`filter-tab-${type}`}
            onClick={() => onFilterChange(type)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap border cursor-pointer ${
              filterType === type
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-[#0C101A] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
