import { useState, useEffect, type FC, type FormEvent } from 'react'
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '../types'
import { createReminder, updateReminder } from '../reminders-api'

interface CreateEditReminderModalProps {
  isOpen: boolean
  editingReminder?: Reminder | null
  onClose: () => void
  onSaved: (reminder: Reminder) => void
}

export const CreateEditReminderModal: FC<CreateEditReminderModalProps> = ({
  isOpen,
  editingReminder,
  onClose,
  onSaved
}) => {
  const [title, setTitle] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('10:00')
  const [alertType, setAlertType] = useState<'notification' | 'alarm'>('notification')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize or reset form state when modal opens or target changes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      return
    }

    if (editingReminder) {
      setTitle(editingReminder.title)
      const savedType =
        editingReminder.alertType || (editingReminder.alarmEnabled ? 'alarm' : 'notification')
      setAlertType(savedType)
      const dateObj = new Date(editingReminder.scheduledAt)
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      setDateStr(`${year}-${month}-${day}`)
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      setTimeStr(`${hours}:${minutes}`)
    } else {
      // Default to 1 hour in the future (safely crossing midnight if near 11 PM)
      const future = new Date(Date.now() + 3600 * 1000)
      const year = future.getFullYear()
      const month = String(future.getMonth() + 1).padStart(2, '0')
      const day = String(future.getDate()).padStart(2, '0')
      setDateStr(`${year}-${month}-${day}`)
      const hours = String(future.getHours()).padStart(2, '0')
      setTimeStr(`${hours}:00`)
      setTitle('')
      setAlertType('notification')
    }
    setError(null)
  }, [isOpen, editingReminder])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Please enter a title for the reminder.')
      return
    }

    if (!dateStr || !timeStr) {
      setError('Please select both a date and a time.')
      return
    }

    // Construct local Date and parse ISO
    const [year, month, day] = dateStr.split('-').map(Number)
    const timeParts = timeStr.split(':').map(Number)
    const hours = timeParts[0]
    const minutes = timeParts[1]
    const seconds = timeParts.length > 2 ? timeParts[2] : 0

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      setError('Invalid date or time format.')
      return
    }

    const scheduledDate = new Date(year, month - 1, day, hours, minutes, seconds, 0)
    if (isNaN(scheduledDate.getTime())) {
      setError('Invalid scheduled date/time.')
      return
    }

    const scheduledAtIso = scheduledDate.toISOString()

    try {
      setIsSubmitting(true)
      setError(null)

      if (editingReminder) {
        const updateInput: UpdateReminderInput = {
          id: editingReminder.id,
          title: trimmedTitle,
          scheduledAt: scheduledAtIso,
          alertType,
          alarmEnabled: alertType === 'alarm'
        }
        const updated = await updateReminder(updateInput)
        onSaved(updated)
      } else {
        const createInput: CreateReminderInput = {
          title: trimmedTitle,
          scheduledAt: scheduledAtIso,
          alertType,
          alarmEnabled: alertType === 'alarm'
        }
        const created = await createReminder(createInput)
        onSaved(created)
      }
      onClose()
    } catch (err) {
      console.error('Failed to save reminder:', err)
      setError(err instanceof Error ? err.message : 'Unable to save reminder. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="absolute inset-0 top-11 bg-[#070A11]/75 backdrop-blur-sm z-30 flex items-center justify-center p-4 select-none"
      data-purpose="modal-backdrop-overlay"
    >
      <section
        aria-describedby="modal-subtitle"
        aria-labelledby="modal-title"
        aria-modal="true"
        className="w-full max-w-[440px] bg-[#101725] rounded-2xl border border-[#1E293B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_-5px_rgba(29,114,254,0.12)] overflow-hidden transform transition-all duration-200 ease-out"
        data-purpose="create-reminder-dialog"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="pt-5 px-6 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight" id="modal-title">
              {editingReminder ? 'Edit Reminder' : 'Create Reminder'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 rounded-md hover:bg-slate-800/50 cursor-pointer"
              title="Close modal"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-[13px] text-slate-400 mt-1 leading-normal" id="modal-subtitle">
            {editingReminder
              ? 'Modify the details of your reminder.'
              : 'Add a new reminder. Calby will take care of the rest.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4" data-purpose="reminder-form">
          {/* Error Banner */}
          {error && (
            <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5" data-purpose="form-field-title">
            <label className="block text-[13px] font-medium text-slate-300" htmlFor="reminder-title">
              Title
            </label>
            <input
              id="reminder-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to be reminded of?"
              className="w-full bg-[#080C14] border border-[#1E293B] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
              autoFocus
            />
          </div>

          {/* Date & Time Dual Column */}
          <div className="grid grid-cols-2 gap-3.5" data-purpose="form-field-datetime-group">
            {/* Date Column */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-slate-300" htmlFor="reminder-date">
                Date
              </label>
              <input
                id="reminder-date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-[#080C14] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* Time Column */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-slate-300" htmlFor="reminder-time">
                Time
              </label>
              <input
                id="reminder-time"
                type="time"
                step="1"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-[#080C14] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* Quick Presets for Development / Fast Verification */}
            <div className="col-span-2 flex items-center justify-between text-xs px-0.5">
              <span className="text-slate-500 text-[11px]">Quick test:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = new Date(Date.now() + 20 * 1000)
                    const y = target.getFullYear()
                    const m = String(target.getMonth() + 1).padStart(2, '0')
                    const d = String(target.getDate()).padStart(2, '0')
                    setDateStr(`${y}-${m}-${d}`)
                    const hh = String(target.getHours()).padStart(2, '0')
                    const mm = String(target.getMinutes()).padStart(2, '0')
                    const ss = String(target.getSeconds()).padStart(2, '0')
                    setTimeStr(`${hh}:${mm}:${ss}`)
                  }}
                  className="px-2 py-0.5 rounded bg-[#161F33] hover:bg-[#1E2B45] text-sky-400 font-mono text-[11px] border border-sky-400/20 transition-colors cursor-pointer"
                >
                  +20s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = new Date(Date.now() + 60 * 1000)
                    const y = target.getFullYear()
                    const m = String(target.getMonth() + 1).padStart(2, '0')
                    const d = String(target.getDate()).padStart(2, '0')
                    setDateStr(`${y}-${m}-${d}`)
                    const hh = String(target.getHours()).padStart(2, '0')
                    const mm = String(target.getMinutes()).padStart(2, '0')
                    const ss = String(target.getSeconds()).padStart(2, '0')
                    setTimeStr(`${hh}:${mm}:${ss}`)
                  }}
                  className="px-2 py-0.5 rounded bg-[#161F33] hover:bg-[#1E2B45] text-sky-400 font-mono text-[11px] border border-sky-400/20 transition-colors cursor-pointer"
                >
                  +1m
                </button>
              </div>
            </div>
          </div>

          {/* Alert Type Radio Selection */}
          <div className="space-y-2 pt-1" data-purpose="form-field-alert-type">
            <span className="block text-[13px] font-medium text-slate-300">
              Alert type
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Notification Option */}
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  alertType === 'notification'
                    ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'bg-[#080C14] border-[#1E293B] text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="alertType"
                  value="notification"
                  checked={alertType === 'notification'}
                  onChange={() => {
                    setAlertType('notification')
                  }}
                  className="text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-[#080C14] border-slate-600 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-medium">Notification</span>
                </div>
              </label>

              {/* Alarm Option */}
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  alertType === 'alarm'
                    ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'bg-[#080C14] border-[#1E293B] text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="alertType"
                  value="alarm"
                  checked={alertType === 'alarm'}
                  onChange={() => {
                    setAlertType('alarm')
                  }}
                  className="text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-[#080C14] border-slate-600 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-medium">Alarm</span>
                </div>
              </label>
            </div>

            {/* Subtle Helper Text */}
            <p className="text-xs text-slate-400 pt-0.5">
              {alertType === 'notification'
                ? "Calby will show a desktop notification when it's time."
                : "Calby will play your selected alarm sound when it's time."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between gap-3" data-purpose="modal-footer-actions">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 bg-[#182030] hover:bg-[#1f2b40] text-slate-300 hover:text-white font-medium text-sm py-2.5 px-6 rounded-lg border border-[#26354d] transition duration-150 active:scale-[0.99] text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 px-8 rounded-lg shadow-[0_0_20px_-3px_rgba(29,114,254,0.45)] transition duration-150 active:scale-[0.99] text-center cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
