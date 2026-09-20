import { type FC } from 'react'

interface PrivacySettingsProps {
  onRequestClearAllData: () => void
}

export const PrivacySettings: FC<PrivacySettingsProps> = ({ onRequestClearAllData }) => {
  return (
    <div data-testid="privacy-settings" className="space-y-4">
      {/* Informative breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#121826] border border-slate-800/80">
          <p className="text-xs font-semibold text-slate-200 mb-1">Local Storage</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Reminders and personal memories are stored strictly in local SQLite (<code className="text-sky-400 font-mono">calby.db</code>) on your device.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#121826] border border-slate-800/80">
          <p className="text-xs font-semibold text-slate-200 mb-1">Credentials & Encryption</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            API keys and OAuth tokens are encrypted with OS-level safeStorage before being written to disk.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#121826] border border-slate-800/80">
          <p className="text-xs font-semibold text-slate-200 mb-1">Live Voice Stream</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Microphone audio is transmitted over secure WebSocket directly to Gemini Live during active turns only.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#121826] border border-slate-800/80">
          <p className="text-xs font-semibold text-slate-200 mb-1">External Integrations</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Google Calendar queries are read-only and occur on-demand when checking your schedule.
          </p>
        </div>
      </div>

      {/* Danger zone for complete data wipe */}
      <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-red-300">Danger Zone: Clear All Local Data</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Permanently removes memories, reminders, Gemini credentials, and Google Calendar tokens from this device.
          </p>
        </div>
        <button
          onClick={onRequestClearAllData}
          type="button"
          data-testid="clear-all-data-button"
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm cursor-pointer shrink-0"
        >
          Clear All Local Data
        </button>
      </div>
    </div>
  )
}
