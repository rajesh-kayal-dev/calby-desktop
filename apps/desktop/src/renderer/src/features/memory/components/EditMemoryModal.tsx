import { useState, useEffect, type FC, type FormEvent } from 'react'
import type { Memory, MemoryType, UpdateMemoryInput } from '../types'

interface EditMemoryModalProps {
  memory: Memory | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: UpdateMemoryInput) => Promise<void>
}

const MEMORY_TYPES: { type: MemoryType; label: string }[] = [
  { type: 'general', label: 'General' },
  { type: 'work', label: 'Work' },
  { type: 'person', label: 'Person' },
  { type: 'preference', label: 'Preference' },
  { type: 'fact', label: 'Fact' }
]

export const EditMemoryModal: FC<EditMemoryModalProps> = ({
  memory,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [content, setContent] = useState<string>('')
  const [type, setType] = useState<MemoryType>('general')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (memory) {
      setContent(memory.content)
      setType(memory.type)
      setError(null)
    }
  }, [memory])

  if (!isOpen || !memory) return null

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = content.trim()

    if (!trimmed) {
      setError('Memory content cannot be empty')
      return
    }

    if (trimmed.length > 1000) {
      setError('Memory content cannot exceed 1000 characters')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit({ id: memory.id, content: trimmed, type })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memory')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      data-testid="edit-memory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#0C101A] border border-slate-800 rounded-2xl shadow-2xl p-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Edit Memory</h3>
              <p className="text-[11px] text-slate-400">Update stored content or category</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div
            data-testid="edit-memory-error"
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Memory Content
            </label>
            <textarea
              data-testid="edit-memory-content-input"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (error) setError(null)
              }}
              rows={3}
              maxLength={1000}
              className="w-full px-3.5 py-2.5 bg-[#121826] border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
              autoFocus
            />
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MEMORY_TYPES.map(({ type: t, label }) => (
                <button
                  key={t}
                  type="button"
                  data-testid={`edit-type-select-${t}`}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-center border cursor-pointer ${
                    type === t
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                      : 'bg-[#121826] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-edit-memory-button"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-xl transition-all shadow-md hover:shadow-sky-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Update Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
