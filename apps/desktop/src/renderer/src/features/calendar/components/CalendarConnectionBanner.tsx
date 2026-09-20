import type { FC } from 'react'
import type { CalendarStatus } from '../types'

interface CalendarConnectionBannerProps {
  status: CalendarStatus
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export const CalendarConnectionBanner: FC<CalendarConnectionBannerProps> = ({
  status,
  isConnecting,
  onConnect,
  onDisconnect
}) => {
  if (status.status === 'connected') {
    return (
      <div className="flex items-center justify-between p-3.5 bg-[#121826] border border-[#1E293B] rounded-xl text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <div className="flex flex-col">
            <span className="font-medium text-slate-200">Google Calendar Connected</span>
            <span className="text-slate-400">{status.connectedEmail || 'Active Sync'}</span>
          </div>
        </div>
        <button
          onClick={onDisconnect}
          type="button"
          className="px-3 py-1.5 rounded-lg bg-[#1E293B]/60 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700/50 hover:border-red-500/30 font-medium transition-colors cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (status.status === 'reauth_required') {
    return (
      <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-medium text-amber-300">Reconnection Required</span>
            <span className="text-amber-400/80">Your Google Calendar connection expired or was revoked.</span>
          </div>
        </div>
        <button
          onClick={onConnect}
          disabled={isConnecting}
          type="button"
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Reconnect'}
        </button>
      </div>
    )
  }

  // Disconnected
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#121826] border border-cyan-500/20 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[#38BDF8]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Connect your Google Calendar</h4>
          <p className="text-xs text-slate-400">Enable Calby to understand your daily schedule and upcoming meetings.</p>
        </div>
      </div>
      <button
        onClick={onConnect}
        disabled={isConnecting}
        type="button"
        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{isConnecting ? 'Opening Browser...' : 'Connect Google Calendar'}</span>
      </button>
    </div>
  )
}