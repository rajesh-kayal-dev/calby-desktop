import { useState, useEffect, useMemo, type FC, type FormEvent } from 'react'
import type { CalendarEvent } from '../types'
import { formatEventTimes } from '../utils/dateTime'

export interface SetCalendarReminderModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  initialLeadOption?: string
  initialCustomMinutes?: string
  onClose: () => void
  onSuccess: (message: string) => void
}

type LeadTimeOption = 'none' | '5' | '10' | '15' | '30' | '60' | 'custom'

const LEAD_TIME_OPTIONS: { value: LeadTimeOption; label: string; minutes: number }[] = [
  { value: 'none', label: 'None', minutes: 0 },
  { value: '5', label: '5 min before', minutes: 5 },
  { value: '10', label: '10 min before', minutes: 10 },
  { value: '15', label: '15 min before', minutes: 15 },
  { value: '30', label: '30 min before', minutes: 30 },
  { value: '60', label: '1 hour before', minutes: 60 },
  { value: 'custom', label: 'Custom', minutes: -1 }
]

export const SetCalendarReminderModal: FC<SetCalendarReminderModalProps> = ({
  event,
  isOpen,
  initialLeadOption = '5',
  initialCustomMinutes = '20',
  onClose,
  onSuccess
}) => {
  const [leadOption, setLeadOption] = useState<LeadTimeOption>((initialLeadOption as LeadTimeOption) || '5')
  const [customMinutes, setCustomMinutes] = useState<string>(initialCustomMinutes || '20')
  const [alertType, setAlertType] = useState<'notification' | 'alarm'>('notification')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when opened or event changes
  useEffect(() => {
    if (isOpen) {
      setLeadOption((initialLeadOption as LeadTimeOption) || '5')
      setCustomMinutes(initialCustomMinutes || '20')
      setAlertType('notification')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, event, initialLeadOption, initialCustomMinutes])

  // Close on Escape (without deleting existing reminder)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const effectiveMinutes = useMemo(() => {
    if (leadOption === 'none') return 0
    if (leadOption === 'custom') {
      const parsed = parseInt(customMinutes, 10)
      return isNaN(parsed) || parsed < 1 ? 5 : parsed
    }
    const opt = LEAD_TIME_OPTIONS.find((o) => o.value === leadOption)
    return opt ? opt.minutes : 5
  }, [leadOption, customMinutes])

  if (!isOpen || !event) return null

  const { timeMain } = formatEventTimes(event)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (leadOption === 'custom') {
      const parsed = parseInt(customMinutes, 10)
      if (isNaN(parsed) || parsed <= 0 || parsed > 10080) {
        setError('Please enter a valid positive number of minutes.')
        return
      }
    }

    try {
      setIsSubmitting(true)

      let eventStartMs: number
      if (event.startDateTime) {
        eventStartMs = new Date(event.startDateTime).getTime()
      } else if (event.startDate) {
        eventStartMs = new Date(`${event.startDate}T09:00:00`).getTime()
      } else {
        eventStartMs = Date.now() + 60 * 60 * 1000
      }

      if (leadOption !== 'none') {
        let triggerMs = eventStartMs - effectiveMinutes * 60 * 1000
        const nowMs = Date.now()

        if (triggerMs < nowMs) {
          triggerMs = nowMs + 5000
        }

        const scheduledIso = new Date(triggerMs).toISOString()
        const isAlarm = alertType === 'alarm'

        await window.calby.reminders.create({
          title: `Meeting: ${event.title}`,
          scheduledAt: scheduledIso,
          alertType,
          alarmEnabled: isAlarm
        })

        const leadDesc =
          effectiveMinutes >= 60
            ? `${Math.round(effectiveMinutes / 60)}h before`
            : `${effectiveMinutes} min before`

        onSuccess(`Reminder set for "${event.title}" (${leadDesc}, ${isAlarm ? 'Alarm' : 'Notification'})`)
      } else {
        onSuccess(`Reminder updated for "${event.title}"`)
      }

      onClose()
    } catch (err) {
      console.error('[SetCalendarReminderModal] Error saving reminder:', err)
      setError(err instanceof Error ? err.message : 'Failed to save reminder')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      data-testid="set-calendar-reminder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reminder"
        className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-5 text-left relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <h3 className="text-sm font-semibold text-slate-100">Reminder</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Event Preview Summary */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-white truncate">{event.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{timeMain}</div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Remind me Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Remind me
            </label>
            <select
              value={leadOption}
              onChange={(e) => setLeadOption(e.target.value as LeadTimeOption)}
              data-testid="reminder-lead-select"
              className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
            >
              {LEAD_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Custom Minutes Field */}
            {leadOption === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10080"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  data-testid="custom-lead-minutes-input"
                  className="w-20 px-2.5 py-1.5 bg-[#121826] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  placeholder="Minutes"
                  required
                />
                <span className="text-xs text-slate-400">minutes before</span>
              </div>
            )}
          </div>

          {/* Alert Type (Notification vs Alarm) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alert
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                data-testid="alert-option-notification"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                  alertType === 'notification'
                    ? 'bg-sky-500/15 border-sky-500/50 text-white font-medium'
                    : 'bg-[#121826] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="modalAlertType"
                  value="notification"
                  checked={alertType === 'notification'}
                  onChange={() => setAlertType('notification')}
                  className="w-3.5 h-3.5 text-sky-500 focus:ring-0 focus:ring-offset-0 bg-transparent border-slate-600 cursor-pointer"
                />
                <span className="text-xs">Notification</span>
              </label>

              <label
                data-testid="alert-option-alarm"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                  alertType === 'alarm'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white font-medium'
                    : 'bg-[#121826] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="modalAlertType"
                  value="alarm"
                  checked={alertType === 'alarm'}
                  onChange={() => setAlertType('alarm')}
                  className="w-3.5 h-3.5 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-transparent border-slate-600 cursor-pointer"
                />
                <span className="text-xs">Alarm</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-reminder-settings-button"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-md"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
