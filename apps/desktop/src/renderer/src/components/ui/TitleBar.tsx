import type { FC, ReactNode } from 'react'
import type { ActiveView } from '../../app/App'

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'not-connected' | 'error'

interface TitleBarProps {
  activeView?: ActiveView
  onNavigate?: (view: ActiveView) => void
  connectionStatus?: ConnectionStatus
  stepInfo?: {
    step: number
    totalSteps: number
    label: string
  }
}

const CalbyWordmarkIcon = () => (
  <img src="/logo.png" alt="Calby Logo" className="h-[22px] object-contain" />
)

// Subtle stroke icons for navigation tabs
const HomeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const BellIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const MemoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z" />
    <path d="M9 17v1a3 3 0 006 0v-1" />
  </svg>
)

const GearIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)

interface NavItem {
  view: ActiveView
  label: string
  icon: () => ReactNode
  testId: string
  aliasTestIds?: string[]
}

// Main navigation contains ONLY Home, Reminders, Calendar, Memory
const NAV_ITEMS: NavItem[] = [
  {
    view: 'home',
    label: 'Home',
    icon: HomeIcon,
    testId: 'nav-home',
    aliasTestIds: ['back-to-home-button'],
  },
  {
    view: 'reminders',
    label: 'Reminders',
    icon: BellIcon,
    testId: 'nav-reminders',
    aliasTestIds: ['memory-nav-reminders-button', 'calendar-nav-reminders-button', 'settings-nav-reminders-button'],
  },
  {
    view: 'calendar',
    label: 'Calendar',
    icon: CalendarIcon,
    testId: 'nav-calendar',
    aliasTestIds: ['memory-nav-calendar-button', 'reminders-nav-calendar-button', 'settings-nav-calendar-button'],
  },
  {
    view: 'memory',
    label: 'Memory',
    icon: MemoryIcon,
    testId: 'nav-memory',
    aliasTestIds: ['calendar-nav-memory-button', 'reminders-nav-memory-button', 'settings-nav-memory-button'],
  },
]

export const TitleBar: FC<TitleBarProps> = ({
  activeView,
  onNavigate,
  connectionStatus,
  stepInfo,
}) => {
  // Map connection status to dot color, label, and breathing glow animation
  const statusInfo = (() => {
    switch (connectionStatus) {
      case 'connected':
        return {
          dotClass: 'bg-[#10B981] glow-dot-green',
          label: 'Online',
        }
      case 'checking':
        return {
          dotClass: 'bg-[#94A3B8] glow-dot-muted',
          label: 'Checking...',
        }
      case 'disconnected':
      case 'not-connected':
      case 'error':
        return {
          dotClass: 'bg-[#EF4444] glow-dot-red',
          label: 'Offline',
        }
      default:
        return null
    }
  })()

  return (
    <header
      className="relative h-11 px-4 flex items-center justify-between shrink-0 select-none drag-region z-30"
      style={{
        backgroundColor: 'var(--ds-canvas-base)',
        borderBottom: '1px solid var(--ds-border-subtle)',
      }}
    >
      {/* Left: Brand + Navigation tabs with professional spacing */}
      <div className="flex items-center gap-7 no-drag">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="flex items-center" aria-hidden="true">
            <CalbyWordmarkIcon />
          </span>
        </div>

        {/* Main Navigation tabs (Home, Reminders, Calendar, Memory) */}
        {onNavigate && activeView && (
          <nav
            className="flex items-center gap-1 no-drag"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(({ view, label, icon: Icon, testId, aliasTestIds }) => {
              const isActive = activeView === view
              return (
                <button
                  key={view}
                  type="button"
                  data-testid={testId}
                  aria-label={view === 'home' ? 'Back to Home' : label}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate(view)}
                  className={[
                    'relative flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium',
                    'transition-all duration-150 cursor-pointer select-none',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500',
                    isActive
                      ? 'bg-white/[0.08] text-[#F8FAFC]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  {aliasTestIds?.map((alias) => (
                    <span
                      key={alias}
                      data-testid={alias}
                      className="absolute inset-0 pointer-events-none"
                    />
                  ))}
                  <Icon />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* Center: Step indicator (during onboarding flow only) */}
      {stepInfo && (
        <div
          className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border no-drag"
          style={{
            backgroundColor: 'var(--ds-surface-card)',
            borderColor: 'var(--ds-border-subtle)',
            color: 'var(--ds-text-secondary)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse inline-block" />
          <span style={{ color: 'var(--ds-text-primary)' }}>
            Step {stepInfo.step} of {stepInfo.totalSteps}
          </span>
          <span style={{ color: 'var(--ds-text-muted)' }}>·</span>
          <span>{stepInfo.label}</span>
        </div>
      )}

      {/* Right: Connection status dot + Settings gear icon */}
      <div className="flex items-center gap-2.5 no-drag">
        {/* Connection status dot with accessible tooltip */}
        {statusInfo && (
          <div className="relative flex items-center group">
            <button
              type="button"
              tabIndex={0}
              role="status"
              aria-label={`Connection status: ${statusInfo.label}`}
              className="w-5 h-5 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500 cursor-default"
            >
              <span
                className={`w-2 h-2 rounded-full transition-all ${statusInfo.dotClass}`}
              />
            </button>

            {/* Tooltip on hover or focus-within */}
            <div
              role="tooltip"
              className="absolute top-full right-0 mt-1.5 px-2 py-0.5 rounded text-[11px] font-medium opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-md border"
              style={{
                backgroundColor: 'var(--ds-surface-overlay)',
                borderColor: 'var(--ds-border-subtle)',
                color: 'var(--ds-text-primary)',
              }}
            >
              {statusInfo.label}
            </div>
          </div>
        )}

        {/* Dedicated Settings gear icon */}
        {onNavigate && (
          <button
            type="button"
            data-testid="nav-settings-button"
            onClick={() => onNavigate('settings')}
            aria-label="Settings"
            aria-current={activeView === 'settings' ? 'page' : undefined}
            className={[
              'relative w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500',
              activeView === 'settings'
                ? 'bg-white/[0.08] text-[#F8FAFC]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]',
            ].join(' ')}
          >
            <span data-testid="titlebar-settings-button" className="contents" />
            <span data-testid="memory-nav-settings-button" className="contents" />
            <span data-testid="calendar-nav-settings-button" className="contents" />
            <span data-testid="reminders-nav-settings-button" className="contents" />
            <GearIcon />
          </button>
        )}
      </div>
    </header>
  )
}
