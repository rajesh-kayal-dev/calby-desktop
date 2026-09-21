import { type FC } from 'react'

interface PrivacySettingsProps {
  memoryCount?: number
  onNavigateMemory?: () => void
  onRequestClearMemories: () => void
  onRequestClearAllData: () => void
}

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

export const PrivacySettings: FC<PrivacySettingsProps> = ({
  memoryCount = 0,
  onNavigateMemory,
  onRequestClearMemories,
  onRequestClearAllData
}) => {
  return (
    <div data-testid="privacy-settings" className="space-y-6">
      {/* Your memories section */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
          Your memories
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
          Calby only remembers things you explicitly ask it to remember.
        </p>

        <div className="flex items-center justify-between pt-1">
          <span data-testid="memory-count-badge" className="text-xs font-mono" style={{ color: 'var(--ds-text-muted)' }}>
            {memoryCount} items stored
          </span>
          {onNavigateMemory && (
            <button
              type="button"
              data-testid="view-memory-button"
              onClick={onNavigateMemory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
            >
              View Memory <ChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Your data section */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
          Your data
        </h3>
        <ul className="text-xs space-y-2 leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
          <li className="flex items-start gap-2">
            <span className="text-[#38BDF8] font-bold">•</span>
            <span>Reminders and memories are stored locally on this device.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#38BDF8] font-bold">•</span>
            <span>Google Calendar is accessed when you use Calendar features.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#38BDF8] font-bold">•</span>
            <span>Your Gemini API key and Google credentials are stored securely using the device&apos;s secure storage.</span>
          </li>
        </ul>
      </div>

      {/* Danger zone */}
      <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-4">
        <h3 className="text-sm font-semibold text-rose-400">
          Danger Zone
        </h3>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-rose-200">
              Clear saved memories
            </p>
            <p className="text-xs text-rose-300/70 mt-0.5">
              Permanently remove all facts and notes stored in Calby memory.
            </p>
          </div>
          <button
            type="button"
            data-testid="clear-memories-button"
            onClick={onRequestClearMemories}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Clear Memories
          </button>
        </div>

        <hr className="border-rose-500/20" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-rose-200">
              Clear all local data
            </p>
            <p className="text-xs text-rose-300/70 mt-0.5">
              Remove all local Calby setup, credentials, memories, and return to initial setup.
            </p>
          </div>
          <button
            type="button"
            data-testid="clear-all-data-button"
            onClick={onRequestClearAllData}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Clear All Local Data
          </button>
        </div>
      </div>
    </div>
  )
}
