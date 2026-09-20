import { useState, useEffect, type FC, type FormEvent } from 'react'
import type { CalendarEvent, CreateCalendarEventInput } from '../types'
import { createCalendarEvent, requestCalendarWriteAccess } from '../calendar-api'

interface CreateCalendarEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (createdEvent: CalendarEvent) => void
  hasWriteAccess?: boolean
  onWriteAccessGranted?: () => void
}

export const CreateCalendarEventModal: FC<CreateCalendarEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  hasWriteAccess = true,
  onWriteAccessGranted
}) => {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('10:30')
  const [timeZone, setTimeZone] = useState('')
  const [guests, setGuests] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [createMeet, setCreateMeet] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [writeAuthRequired, setWriteAuthRequired] = useState(false)

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null)
      setIsLoading(false)
      setIsAuthorizing(false)
      setWriteAuthRequired(!hasWriteAccess)

      const now = new Date()
      // Default to today's date YYYY-MM-DD
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      setDate(`${y}-${m}-${d}`)

      // Default start time: next full hour
      const nextHour = (now.getHours() + 1) % 24
      const nextHourStr = String(nextHour).padStart(2, '0') + ':00'
      const endHourStr = String(nextHour).padStart(2, '0') + ':30'
      setStartTime(nextHourStr)
      setEndTime(endHourStr)

      // Timezone
      const resolvedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
      setTimeZone(resolvedTz)
    }
  }, [isOpen, hasWriteAccess])

  if (!isOpen) return null

  const handleAllowWriteAccess = async (): Promise<void> => {
    setIsAuthorizing(true)
    setErrorMessage(null)
    try {
      const status = await requestCalendarWriteAccess()
      if (status.hasWriteAccess || status.status === 'connected') {
        setWriteAuthRequired(false)
        if (onWriteAccessGranted) onWriteAccessGranted()
      }
    } catch (err) {
      console.error('[CreateCalendarEventModal] OAuth write upgrade failed:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to authorize write access.')
    } finally {
      setIsAuthorizing(false)
    }
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setErrorMessage(null)

    // Form Validations
    if (!title.trim()) {
      setErrorMessage('Title is required.')
      return
    }
    if (!date) {
      setErrorMessage('Date is required.')
      return
    }
    if (!startTime || !endTime) {
      setErrorMessage('Start time and end time are required.')
      return
    }

    const startDateTime = `${date}T${startTime}:00`
    const endDateTime = `${date}T${endTime}:00`

    const startMs = new Date(startDateTime).getTime()
    const endMs = new Date(endDateTime).getTime()

    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      setErrorMessage('End time must be after start time.')
      return
    }

    // Guest emails validation
    const attendeeEmails: string[] = []
    if (guests.trim()) {
      const rawList = guests.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (const email of rawList) {
        if (!emailRegex.test(email)) {
          setErrorMessage(`Invalid guest email address: ${email}`)
          return
        }
        attendeeEmails.push(email)
      }
    }

    setIsLoading(true)

    const payload: CreateCalendarEventInput = {
      title: title.trim(),
      startDateTime,
      endDateTime,
      timeZone: timeZone || undefined,
      attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      createMeet
    }

    try {
      const created = await createCalendarEvent(payload)
      onSuccess(created)
      onClose()
    } catch (err: unknown) {
      console.error('[CreateCalendarEventModal] Create event failed:', err)
      const errStr = err instanceof Error ? err.message : String(err)
      if (errStr.includes('CALENDAR_WRITE_AUTH_REQUIRED') || errStr.includes('PERMISSION_DENIED')) {
        setWriteAuthRequired(true)
        setErrorMessage('Calby needs permission to create Google Calendar events.')
      } else if (errStr.includes('NOT_AUTHENTICATED')) {
        setErrorMessage('Google Calendar is not connected.')
      } else if (errStr.includes('INVALID_INPUT')) {
        setErrorMessage(errStr.replace(/^.*?INVALID_INPUT:\s*/, ''))
      } else {
        setErrorMessage('Google Calendar could not create this event. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      data-testid="create-event-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !isAuthorizing) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#121826]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Create Calendar Event</h2>
              <p className="text-[11px] text-slate-400">Add an event directly to Google Calendar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || isAuthorizing}
            type="button"
            data-testid="create-event-close-button"
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Write Access Required Banner / View */}
          {writeAuthRequired ? (
            <div
              data-testid="create-event-write-auth-prompt"
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="text-xs font-semibold text-amber-300">Permission Required</h4>
                  <p className="text-xs text-amber-200/90 mt-1">
                    Calby needs permission to create Google Calendar events.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="create-event-cancel-button"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAllowWriteAccess}
                  disabled={isAuthorizing}
                  data-testid="create-event-allow-access-button"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
                >
                  {isAuthorizing ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    'Allow Access'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form id="create-calendar-event-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div
                  data-testid="create-event-error"
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Team Meeting"
                  data-testid="create-event-title-input"
                  required
                  className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="create-event-date-input"
                  required
                  className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    data-testid="create-event-start-time-input"
                    required
                    className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    data-testid="create-event-end-time-input"
                    required
                    className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Timezone</label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  data-testid="create-event-timezone-select"
                  className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                  {timeZone &&
                    ![
                      'Asia/Kolkata',
                      'UTC',
                      'America/New_York',
                      'America/Los_Angeles',
                      'America/Chicago',
                      'Europe/London',
                      'Europe/Paris',
                      'Asia/Tokyo',
                      'Australia/Sydney'
                    ].includes(timeZone) && <option value={timeZone}>{timeZone}</option>}
                </select>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Guests</label>
                <input
                  type="text"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="rahul@example.com, sara@example.com"
                  data-testid="create-event-guests-input"
                  className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Office / Meeting Link / Online"
                  data-testid="create-event-location-input"
                  className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description, agenda, or notes"
                  rows={2}
                  data-testid="create-event-description-input"
                  className="w-full px-3 py-2 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              {/* Google Meet Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create-event-meet"
                  checked={createMeet}
                  onChange={(e) => setCreateMeet(e.target.checked)}
                  data-testid="create-event-meet-checkbox"
                  className="w-4 h-4 rounded bg-[#121826] border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="create-event-meet" className="text-xs text-slate-300 cursor-pointer select-none">
                  Add Google Meet
                </label>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        {!writeAuthRequired && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800/80 bg-[#121826]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              data-testid="create-event-cancel-button"
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-calendar-event-form"
              disabled={isLoading}
              data-testid="create-event-submit-button"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-slate-950 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
            >
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Creating event...</span>
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
