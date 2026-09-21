import { type FC } from 'react'
import type { CalendarStatus } from '../types'

interface ConnectSettingsProps {
  status: CalendarStatus | null
  onConnect: () => void
  onDisconnect: () => void
}

const GoogleCalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="3" fill="#4285F4" />
    <path d="M7 4V2M17 4V2" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <rect x="6" y="9" width="12" height="10" rx="1" fill="white" />
    <path d="M9 13H15M9 16H13" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const GoogleDriveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.71 3.5L1.5 14.25L5.25 20.75L11.46 10L7.71 3.5Z" fill="#FFBA00" />
    <path d="M16.29 3.5H7.71L11.46 10H20.04L16.29 3.5Z" fill="#0066DA" />
    <path d="M12.5 14.25L8.75 20.75H22.5L20.04 10H14.96L12.5 14.25Z" fill="#00AC47" />
  </svg>
)

const NotionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.459 4.258c.746.606 1.026.56 2.447.466l11.23-.746c.326 0 .093-.326-.047-.42L16.48 2.37c-.513-.373-.886-.466-2.145-.373L3.107 2.977c-.42.047-.513.233-.326.466zm.886 3.68v13.56c0 .746.42 1.026 1.258.98l12.441-.746c.84-.047 1.073-.513 1.073-1.258V6.953c0-.653-.326-.886-.98-.84l-12.72.746c-.746.047-1.072.326-1.072 1.079zm12.394 1.166c.093.373 0 .746-.373.793l-1.026.14v10.163c-.466.28-.98.42-1.446.42-.466 0-.746-.14-1.073-.466l-4.15-6.387v5.827l1.492.28c.093.373-.093.746-.466.746l-3.217.187c-.093-.373 0-.746.373-.793l.933-.14V9.897l-1.213-.14c-.093-.373.093-.746.466-.746l3.357-.233 4.29 6.574V9.803l-1.306-.14c-.093-.373.093-.746.466-.746z" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

export const ConnectSettingsComponent: FC<ConnectSettingsProps> = ({
  status,
  onConnect,
  onDisconnect
}) => {
  const isConnected = status?.status === 'connected'
  const isReauth = status?.status === 'reauth_required'
  const isLegacyReadOnly = isConnected && status?.hasWriteAccess === false

  const handleOpenGoogleCalendarWeb = () => {
    if (window.calby?.system?.openExternal) {
      void window.calby.system.openExternal('https://calendar.google.com')
    } else {
      window.open('https://calendar.google.com', '_blank')
    }
  }

  return (
    <div data-testid="connect-settings" className="space-y-6">
      <div data-testid="calendar-settings" className="space-y-6">

      {/* Connected services section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--ds-text-muted)' }}>
          Connected services
        </h4>

        {/* Google Calendar Card */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                <GoogleCalendarIcon />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                    Google Calendar
                  </h3>
                  <span
                    data-testid="calendar-status-badge"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isReauth
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                    {isConnected ? 'Connected' : isReauth ? 'Re-auth required' : 'Disconnected'}
                  </span>
                </div>

                {isConnected && (
                  <p data-testid="calendar-email-text" className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>
                    Account: <span className="font-medium text-white">{status?.connectedEmail || 'Google Account'}</span> {isLegacyReadOnly ? '(Read-only)' : '(Read & Create)'}
                  </p>
                )}

                <p className="text-xs mt-1" style={{ color: 'var(--ds-text-muted)' }}>
                  Calby can read and create events in your Google Calendar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            {isLegacyReadOnly && (
              <button
                onClick={onConnect}
                type="button"
                data-testid="reconnect-calendar-button"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reconnect Calendar
              </button>
            )}
            {isConnected ? (
              <>
                <button
                  type="button"
                  data-testid="open-google-calendar-web"
                  onClick={handleOpenGoogleCalendarWeb}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer"
                >
                  Open Google Calendar <ExternalLinkIcon />
                </button>
                <button
                  onClick={onDisconnect}
                  type="button"
                  data-testid="disconnect-calendar-button"
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                type="button"
                data-testid="connect-calendar-button"
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {isReauth ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--ds-text-muted)' }}>
          More integrations
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 opacity-70 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <GoogleDriveIcon />
              <span className="text-xs font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                Google Drive
              </span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
              Coming soon
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 opacity-70 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <NotionIcon />
              <span className="text-xs font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                Notion
              </span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
              Coming soon
            </span>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export const CalendarSettings = ConnectSettingsComponent
