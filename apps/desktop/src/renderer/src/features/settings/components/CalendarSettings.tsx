import { type FC } from 'react'
import type { CalendarStatus } from '../types'

interface CalendarSettingsProps {
  status: CalendarStatus | null
  onConnect: () => void
  onDisconnect: () => void
}

export const CalendarSettings: FC<CalendarSettingsProps> = ({
  status,
  onConnect,
  onDisconnect
}) => {
  const isConnected = status?.status === 'connected'
  const isReauth = status?.status === 'reauth_required'
  const isLegacyReadOnly = isConnected && status?.hasWriteAccess === false

  return (
    <div data-testid="calendar-settings" className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#121826] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Google Calendar</span>
              <span
                data-testid="calendar-status-badge"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : isReauth
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected
                      ? 'bg-emerald-400'
                      : isReauth
                      ? 'bg-amber-400'
                      : 'bg-slate-400'
                  }`}
                />
                {isConnected ? 'Connected' : isReauth ? 'Re-auth Required' : 'Disconnected'}
              </span>
            </div>
            <p data-testid="calendar-email-text" className="text-[11px] text-slate-400 mt-0.5">
              {isConnected
                ? isLegacyReadOnly
                  ? `Account: ${status?.connectedEmail || 'Google Account'} (Read-only)`
                  : `Account: ${status?.connectedEmail || 'Google Account'} (Read & Create)`
                : 'Google Calendar integration for schedule awareness and event creation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLegacyReadOnly && (
            <button
              onClick={onConnect}
              type="button"
              data-testid="reconnect-calendar-button"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reconnect Calendar
            </button>
          )}

          {isConnected ? (
            <button
              onClick={onDisconnect}
              type="button"
              data-testid="disconnect-calendar-button"
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onConnect}
              type="button"
              data-testid="connect-calendar-button"
              className="px-3 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isReauth ? 'Reconnect' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
