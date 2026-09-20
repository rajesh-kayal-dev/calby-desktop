import type { FC } from 'react'

interface CalendarEmptyStateProps {
  filter: 'today' | 'upcoming'
}

export const CalendarEmptyState: FC<CalendarEmptyStateProps> = ({ filter }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#121826]/40 border border-[#1E293B]/60 rounded-2xl">
      <div className="p-4 bg-[#151C2C] border border-[#1E293B] rounded-2xl text-slate-400 mb-3 shadow-inner">
        <svg className="w-8 h-8 text-sky-400/80" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h4 className="text-base font-semibold text-slate-200 mb-1">
        {filter === 'today' ? 'No events today' : 'No upcoming events'}
      </h4>
      <p className="text-xs text-slate-400 max-w-sm">
        {filter === 'today'
          ? 'Your schedule is clear for the rest of today. Enjoy the focus time!'
          : 'You have no events scheduled for the next 7 days.'}
      </p>
    </div>
  )
}