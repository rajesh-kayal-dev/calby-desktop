import type { FC } from 'react'
import type { CalendarTabFilter } from '../types'

interface CalendarEmptyStateProps {
  filter: CalendarTabFilter
  selectedDateLabel?: string
}

export const CalendarEmptyState: FC<CalendarEmptyStateProps> = ({ filter, selectedDateLabel }) => {
  const getMessage = (): { title: string; subtitle: string } => {
    switch (filter) {
      case 'today':
        return {
          title: 'No events today',
          subtitle: 'Your schedule is clear for the rest of today. Enjoy the focus time!'
        }
      case 'tomorrow':
        return {
          title: 'No events tomorrow',
          subtitle: 'Your schedule is clear for tomorrow.'
        }
      case 'selected_date':
        return {
          title: selectedDateLabel ? `No events on ${selectedDateLabel}` : 'No events scheduled',
          subtitle: 'Your schedule is completely clear for this date.'
        }
      case 'upcoming':
      default:
        return {
          title: 'No upcoming events',
          subtitle: 'You have no events scheduled for the next 7 days.'
        }
    }
  }

  const { title, subtitle } = getMessage()

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#121826]/40 border border-[#1E293B]/60 rounded-2xl" data-testid="calendar-empty-state">
      <div className="p-4 bg-[#151C2C] border border-[#1E293B] rounded-2xl text-slate-400 mb-3 shadow-inner">
        <svg className="w-8 h-8 text-sky-400/80" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h4 className="text-base font-semibold text-slate-200 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm">{subtitle}</p>
    </div>
  )
}
