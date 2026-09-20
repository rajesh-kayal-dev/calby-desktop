import { type FC } from 'react'
import type { Memory, MemoryType } from '../types'

interface MemoryCardProps {
  memory: Memory
  onEdit: (memory: Memory) => void
  onDelete: (id: string) => void
}

const TYPE_CONFIG: Record<
  MemoryType,
  { label: string; badgeClass: string; dotClass: string }
> = {
  fact: {
    label: 'Fact',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-400'
  },
  preference: {
    label: 'Preference',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    dotClass: 'bg-purple-400'
  },
  person: {
    label: 'Person',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-400'
  },
  work: {
    label: 'Work',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    dotClass: 'bg-sky-400'
  },
  general: {
    label: 'General',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dotClass: 'bg-slate-400'
  }
}

export const MemoryCard: FC<MemoryCardProps> = ({ memory, onEdit, onDelete }) => {
  const config = TYPE_CONFIG[memory.type] || TYPE_CONFIG.general

  const formattedDate = new Date(memory.updatedAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  })

  return (
    <div
      data-testid="memory-card"
      className="p-4 rounded-xl bg-[#0C101A] border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
    >
      <div className="space-y-3">
        {/* Top meta row: Category badge & updated time */}
        <div className="flex items-center justify-between">
          <span
            data-testid="memory-type-badge"
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
            {config.label}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {formattedDate}
          </span>
        </div>

        {/* Memory content */}
        <p
          data-testid="memory-content"
          className="text-sm text-slate-200 leading-relaxed break-words font-normal"
        >
          {memory.content}
        </p>
      </div>

      {/* Bottom action row */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/50 mt-3 opacity-90 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(memory)}
          type="button"
          data-testid="edit-memory-button"
          className="px-2.5 py-1 text-xs text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded transition-colors font-medium cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(memory.id)}
          type="button"
          data-testid="delete-memory-button"
          className="px-2.5 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors font-medium cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
