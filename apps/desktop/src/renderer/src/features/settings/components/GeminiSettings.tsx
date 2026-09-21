import { useState, type FC } from 'react'
import type { AuthStatus } from '../types'
import { UpdateGeminiKeyModal } from './UpdateGeminiKeyModal'

interface GeminiSettingsProps {
  authStatus: AuthStatus | null
  onKeyUpdated?: () => void
}

const GeminiSparkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
      fill="url(#gemini-gradient)"
    />
    <defs>
      <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="0.5" stopColor="#818CF8" />
        <stop offset="1" stopColor="#C084FC" />
      </linearGradient>
    </defs>
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

export const GeminiSettings: FC<GeminiSettingsProps> = ({ authStatus, onKeyUpdated }) => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const isConnected = Boolean(authStatus?.isConfigured)

  const handleOpenAiStudio = () => {
    if (window.calby?.system?.openExternal) {
      void window.calby.system.openExternal('https://aistudio.google.com/app/apikey')
    } else {
      window.open('https://aistudio.google.com/app/apikey', '_blank')
    }
  }

  return (
    <div data-testid="gemini-settings" className="space-y-6">
      {/* Top Header Card */}
      <div className="flex items-start justify-between p-5 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
            <GeminiSparkIcon />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                Gemini
              </h3>
              <span
                data-testid="gemini-status-badge"
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                {isConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>
              Gemini powers Calby&apos;s understanding and voice assistant.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUpdateModalOpen(true)}
          type="button"
          data-testid="reconfigure-gemini-button"
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
        >
          {isConnected ? 'Update API Key' : 'Connect API Key'}
        </button>
      </div>

      {/* Security note & key representation */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
        <p className="text-xs font-medium" style={{ color: 'var(--ds-text-primary)' }}>
          API key
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
          Your API key is encrypted and stored securely on this device. Calby does not share your API key with other users.
        </p>
        <div className="pt-1 flex items-center justify-between">
          <span className="text-xs font-mono tracking-widest" style={{ color: 'var(--ds-text-muted)' }}>
            ••••••••••••••••
          </span>
          <button
            type="button"
            onClick={() => setIsUpdateModalOpen(true)}
            className="text-xs text-[#38BDF8] hover:underline font-medium cursor-pointer"
          >
            Update API Key
          </button>
        </div>
      </div>

      {/* External Link Section */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--ds-text-primary)' }}>
            Get a Gemini API key
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
            Create your API key in Google AI Studio.
          </p>
        </div>
        <button
          type="button"
          data-testid="open-ai-studio-button"
          onClick={handleOpenAiStudio}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
        >
          Open Google AI Studio <ExternalLinkIcon />
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
