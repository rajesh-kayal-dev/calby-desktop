import type { FC } from 'react'
import type { Reminder } from '../types'
import { ReminderCard } from './ReminderCard'

interface ReminderSectionProps {
  label: string
  reminders: Reminder[]
  highlightedReminderId?: string | null
  onComplete: (id: string) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (id: string) => void
}

export const ReminderSection: FC<ReminderSectionProps> = ({
  label,
  reminders,
  highlightedReminderId,
  onComplete,
  onEdit,
  onDelete
}) => {
  if (reminders.length === 0) return null

  return (
    <div className="space-y-1.5" data-purpose="reminder-section">
      <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase pl-1">
        {label}
      </div>
      <div className="space-y-1.5">
        {reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            isHighlighted={reminder.id === highlightedReminderId}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
