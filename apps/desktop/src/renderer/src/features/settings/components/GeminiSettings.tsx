import { useState, type FC } from 'react'
import type { AuthStatus } from '../types'
import { UpdateGeminiKeyModal } from './UpdateGeminiKeyModal'

interface GeminiSettingsProps {
  authStatus: AuthStatus | null
  onKeyUpdated?: () => void
}

export const GeminiSettings: FC<GeminiSettingsProps> = ({ authStatus, onKeyUpdated }) => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const isConnected = Boolean(authStatus?.isConfigured)

  return (
    <div data-testid="gemini-settings" className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#121826] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Gemini Live API</span>
              <span
                data-testid="gemini-status-badge"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {isConnected ? 'API Key: •••••••••••••••• (Encrypted locally)' : 'API key required for voice assistant'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUpdateModalOpen(true)}
          type="button"
          data-testid="reconfigure-gemini-button"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          {isConnected ? 'Update Key' : 'Connect Key'}
        </button>
      </div>

      <UpdateGeminiKeyModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => {
          if (onKeyUpdated) onKeyUpdated()
        }}
      />
    </div>
  )
}
