import { type FC } from 'react'

interface ConfirmDangerModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmButtonText: string
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export const ConfirmDangerModal: FC<ConfirmDangerModalProps> = ({
  isOpen,
  title,
  description,
  confirmButtonText,
  isSubmitting = false,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null

  return (
    <div
      data-testid="confirm-danger-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#0C101A] border border-red-500/30 rounded-2xl shadow-2xl p-6 text-left">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 data-testid="danger-modal-title" className="text-sm font-semibold text-white">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400">Irreversible action</p>
          </div>
        </div>

        <p data-testid="danger-modal-description" className="text-xs text-slate-300 leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-danger-button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md hover:shadow-red-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Clearing...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}
