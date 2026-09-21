import type { FC, ReactNode } from 'react'
import type { ActiveView } from '../../app/App'

interface NavBarProps {
  activeView: ActiveView
  onNavigate: (view: ActiveView) => void
}

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

interface NavItem {
  view: ActiveView
  label: string
  icon: () => ReactNode
  testId: string
}

const NAV_ITEMS: NavItem[] = [
  { view: 'home', label: 'Home', icon: HomeIcon, testId: 'nav-home' },
  { view: 'reminders', label: 'Reminders', icon: BellIcon, testId: 'nav-reminders' },
  { view: 'calendar', label: 'Calendar', icon: CalendarIcon, testId: 'nav-calendar' },
  { view: 'memory', label: 'Memory', icon: MemoryIcon, testId: 'nav-memory' },
]

export const NavBar: FC<NavBarProps> = ({ activeView, onNavigate }) => {
  return (
    <nav
      className="flex items-center gap-1 select-none no-drag"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ view, label, icon: Icon, testId }) => {
        const isActive = activeView === view
        return (
          <button
            key={view}
            type="button"
            data-testid={testId}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(view)}
            className={[
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium',
              'transition-all duration-150 cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500',
              isActive
                ? 'bg-white/[0.08] text-[#F8FAFC]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]',
            ].join(' ')}
          >
            <Icon />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
