import { useState, useCallback, type FC } from 'react'
import type { Memory, MemoryType } from '../types'

interface MemoryCardProps {
  memory: Memory
  onEdit: (memory: Memory) => void
  onDelete: (id: string) => void
}

const TYPE_LABELS: Record<MemoryType, string> = {
  fact: 'Fact',
  preference: 'Preference',
  person: 'Person',
  work: 'Work',
  general: 'General'
}

const TYPE_COLORS: Record<MemoryType, string> = {
  fact: '#10B981',
  preference: '#A855F7',
  person: '#F59E0B',
  work: '#38BDF8',
  general: '#64748B'
}

function getRelativeDate(iso: string): string {
  const now = new Date()
  const date = new Date(iso)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────

interface ConfirmDeleteProps {
  content: string
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}

const ConfirmDeleteModal: FC<ConfirmDeleteProps> = ({ content, onCancel, onConfirm, isDeleting }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    onClick={onCancel}
    role="dialog"
    aria-modal="true"
    aria-label="Delete memory confirmation"
  >
    <div
      className="w-full max-w-sm bg-[#0C101A] border border-slate-800 rounded-2xl shadow-2xl p-6 text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-sm font-semibold text-white mb-1">Delete memory?</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
        &ldquo;{content}&rdquo;
      </p>
      <p className="text-xs text-slate-500 mb-5">This cannot be undone.</p>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          data-testid="confirm-delete-memory-button"
          className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)

// ── Memory Card ───────────────────────────────────────────────────────────

export const MemoryCard: FC<MemoryCardProps> = ({ memory, onEdit, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const typeLabel = TYPE_LABELS[memory.type] || 'General'
  const typeColor = TYPE_COLORS[memory.type] || TYPE_COLORS.general
  const relDate = getRelativeDate(memory.createdAt)

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true)
    try {
      onDelete(memory.id)
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }, [memory.id, onDelete])

  return (
    <>
      <div
        data-testid="memory-card"
        className="group px-4 py-3.5 rounded-xl transition-all hover:bg-white/[0.02]"
        style={{
          backgroundColor: '#0C101A',
          border: '1px solid #1E293B'
        }}
      >
        {/* Content — primary, dominant */}
        <p
          data-testid="memory-content"
          className="text-sm leading-relaxed break-words font-normal"
          style={{ color: '#F8FAFC' }}
        >
          {memory.content}
        </p>

        {/* Bottom row: type + date (left) | actions (right) */}
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <span
              data-testid="memory-type-badge"
              className="text-[11px] font-medium"
              style={{ color: typeColor }}
            >
              {typeLabel}
            </span>
            <span className="text-[11px]" style={{ color: '#475569' }}>·</span>
            <span className="text-[11px]" style={{ color: '#475569' }}>
              Added {relDate}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(memory)}
              type="button"
              data-testid="edit-memory-button"
              className="px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer"
              style={{ color: '#64748B' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#38BDF8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
            >
              Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              type="button"
              data-testid="delete-memory-button"
              className="px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer"
              style={{ color: '#64748B' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDeleteModal
          content={memory.content}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => void handleDeleteConfirm()}
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}
