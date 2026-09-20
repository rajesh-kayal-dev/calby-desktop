import { useState, useMemo, type FC } from 'react'
import type { CalendarEvent } from '../types'
import { getDateKey, getEventDateKey } from '../utils/dateTime'

interface CalendarWeekStripProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  events: CalendarEvent[]
}

interface DayItem {
  date: Date
  dayName: string
  dayNumber: number
  isToday: boolean
  isSelected: boolean
  eventCount: number
}

export const CalendarWeekStrip: FC<CalendarWeekStripProps> = ({
  selectedDate,
  onSelectDate,
  events
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0)

  // Compute Monday of the displayed week
  const weekDays = useMemo<DayItem[]>(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)

    // Find Monday (0 is Sun, 1 is Mon ... 6 is Sat)
    const dayOfWeek = base.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(base)
    monday.setDate(base.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)

    const todayStr = new Date().toDateString()
    const selectedStr = selectedDate.toDateString()

    const days: DayItem[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      d.setHours(0, 0, 0, 0)

      const dayKey = getDateKey(d)
      const count = events.filter((e) => getEventDateKey(e) === dayKey).length

      days.push({
        date: d,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: d.toDateString() === todayStr,
        isSelected: d.toDateString() === selectedStr,
        eventCount: count
      })
    }

    return days
  }, [weekOffset, selectedDate, events])

  // Formatted Month Header (e.g. "September 2026" or "Sep – Oct 2026")
  const headerTitle = useMemo(() => {
    if (weekDays.length === 0) return ''
    const first = weekDays[0].date
    const last = weekDays[6].date

    if (first.getMonth() === last.getMonth()) {
      return first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }
    const m1 = first.toLocaleDateString(undefined, { month: 'short' })
    const m2 = last.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    return `${m1} – ${m2}`
  }, [weekDays])

  const handleResetToToday = (): void => {
    setWeekOffset(0)
    onSelectDate(new Date())
  }

  return (
    <div
      data-testid="calendar-week-strip"
      className="w-full bg-[#0D131F] border border-[#1E293B] rounded-2xl p-4 shadow-lg shadow-black/20"
    >
      {/* Month Header & Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100 tracking-tight">
            {headerTitle}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={handleResetToToday}
              type="button"
              className="px-2 py-0.5 rounded-md bg-[#162032] hover:bg-[#1E293B] text-[11px] font-medium text-sky-400 hover:text-sky-300 border border-sky-500/20 transition-colors cursor-pointer"
            >
              Current Week
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            type="button"
            data-testid="calendar-prev-week"
            aria-label="Previous week"
            className="p-1.5 rounded-lg bg-[#121826] hover:bg-[#1A2338] border border-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            type="button"
            data-testid="calendar-next-week"
            aria-label="Next week"
            className="p-1.5 rounded-lg bg-[#121826] hover:bg-[#1A2338] border border-[#1E293B] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* 7-Day Strip Grid */}
      <div className="grid grid-cols-7 gap-2 pt-3">
        {weekDays.map((item) => (
          <button
            key={item.date.toISOString()}
            onClick={() => onSelectDate(item.date)}
            type="button"
            data-testid={`calendar-strip-day-${item.dayNumber}`}
            className={`group flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all cursor-pointer border ${
              item.isSelected
                ? 'bg-[#2563EB] border-[#3B82F6] text-white shadow-[0_0_14px_rgba(37,99,235,0.4)] scale-[1.02]'
                : item.isToday
                  ? 'bg-[#152033]/80 border-sky-400/40 text-sky-300 hover:bg-[#1B2A44]'
                  : 'bg-[#121826]/60 border-transparent hover:bg-[#162032] hover:border-[#1E293B] text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className={`text-[11px] font-medium uppercase tracking-wider mb-1 ${
                item.isSelected
                  ? 'text-white/90'
                  : item.isToday
                    ? 'text-sky-400'
                    : 'text-slate-400 group-hover:text-slate-300'
              }`}
            >
              {item.dayName}
            </span>
            <span
              className={`text-base font-bold font-mono ${
                item.isSelected
                  ? 'text-white'
                  : item.isToday
                    ? 'text-sky-200'
                    : 'text-slate-200 group-hover:text-white'
              }`}
            >
              {item.dayNumber}
            </span>

            {/* Event Dot Indicator */}
            <div className="h-2 flex items-center justify-center mt-1">
              {item.eventCount > 0 ? (
                <span
                  title={`${item.eventCount} event(s)`}
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isSelected
                      ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]'
                      : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  }`}
                />
              ) : (
                <span className="w-1.5 h-1.5 opacity-0" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
