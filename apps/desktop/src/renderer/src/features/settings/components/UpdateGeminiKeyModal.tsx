import { useState, type FC, type FormEvent, type KeyboardEvent } from 'react'

interface UpdateGeminiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const UpdateGeminiKeyModal: FC<UpdateGeminiKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [apiKey, setApiKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e?: FormEvent): Promise<void> => {
    if (e) e.preventDefault()
    const trimmed = apiKey.trim()

    if (!trimmed) {
      setError('Please enter your Gemini API key.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      if (!window.calby?.auth?.validateAndSaveKey) {
        throw new Error('Auth API is unavailable')
      }

      const result = await window.calby.auth.validateAndSaveKey(trimmed)
      if (result.ok) {
        setApiKey('')
        onSuccess()
        onClose()
      } else {
        setError(result.error?.message || 'Failed to validate API key. Please check the key.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div
      data-testid="update-gemini-key-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-md bg-[#0F1420] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Update Gemini API Key</h3>
              <p className="text-[11px] text-slate-400">Validate and encrypt a new API key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300" htmlFor="update-gemini-key-input">
              New Gemini API Key
            </label>
            <div className="relative flex items-center bg-[#070A11] rounded-xl border border-slate-700/80 focus-within:border-sky-400 transition-all">
              <input
                id="update-gemini-key-input"
                type={showPassword ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Paste new API key (AIzaSy...)"
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 px-3 py-2.5 pr-10 font-mono focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Toggle key visibility"
              >
                {showPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            The new key will be tested against Google Gemini and securely saved to OS-level encrypted credential storage.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="save-gemini-key-button"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              <span>{isSubmitting ? 'Validating...' : 'Validate & Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
