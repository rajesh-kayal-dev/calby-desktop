import { useState, useEffect, type FC, type FormEvent } from 'react'
import type { CalendarEvent, CreateCalendarEventInput } from '../types'
import { createCalendarEvent, requestCalendarWriteAccess } from '../calendar-api'

interface CreateCalendarEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (createdEvent: CalendarEvent, leadOption: string, customMinutes: string) => void
  hasWriteAccess?: boolean
  onWriteAccessGranted?: () => void
}

type RemindMeOption = 'none' | '5' | '10' | '15' | '30' | '60' | 'custom'
type LocationPreset = 'office' | 'room' | 'online' | 'custom'

const REMIND_ME_OPTIONS: { value: RemindMeOption; label: string; minutes: number }[] = [
  { value: 'none', label: 'None', minutes: 0 },
  { value: '5', label: '5 min before', minutes: 5 },
  { value: '10', label: '10 min before', minutes: 10 },
  { value: '15', label: '15 min before', minutes: 15 },
  { value: '30', label: '30 min before', minutes: 30 },
  { value: '60', label: '1 hour before', minutes: 60 },
  { value: 'custom', label: 'Custom', minutes: -1 }
]

export const CreateCalendarEventModal: FC<CreateCalendarEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  hasWriteAccess = true,
  onWriteAccessGranted
}) => {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('17:00')
  const [remindMe, setRemindMe] = useState<RemindMeOption>('5')
  const [customRemindMinutes, setCustomRemindMinutes] = useState('20')
  const [guests, setGuests] = useState('')
  const [timeZone, setTimeZone] = useState('Asia/Kolkata')

  // Location preset & custom input
  const [locationPreset, setLocationPreset] = useState<LocationPreset>('office')
  const [customLocation, setCustomLocation] = useState('')
  const [roomName, setRoomName] = useState('')

  const [description, setDescription] = useState('')

  // Google Meet
  const [createMeet, setCreateMeet] = useState(false)
  const [meetUrl, setMeetUrl] = useState('')

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
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      setDate(`${y}-${m}-${d}`)

      // Default start time: next full hour
      const nextHour = (now.getHours() + 1) % 24
      const nextHourStr = String(nextHour).padStart(2, '0') + ':00'
      setStartTime(nextHourStr)

      // Timezone default is strictly Asia/Kolkata
      setTimeZone('Asia/Kolkata')

      // Defaults
      setTitle('')
      setRemindMe('5')
      setCustomRemindMinutes('20')
      setGuests('')
      setLocationPreset('office')
      setCustomLocation('')
      setRoomName('')
      setDescription('')
      setCreateMeet(false)
      setMeetUrl('')
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

  // Resolve effective location string
  const resolvedLocation = (): string | undefined => {
    if (locationPreset === 'office') return 'Office'
    if (locationPreset === 'online') return 'Online'
    if (locationPreset === 'room') return roomName.trim() ? `Room ${roomName.trim()}` : 'Conference Room'
    if (locationPreset === 'custom') return customLocation.trim() || undefined
    return undefined
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
    if (!startTime) {
      setErrorMessage('Start time is required.')
      return
    }

    const startDateTime = `${date}T${startTime}:00`
    const startMs = new Date(startDateTime).getTime()
    if (isNaN(startMs)) {
      setErrorMessage('Invalid start date and time.')
      return
    }

    // Custom reminder validation
    let effectiveMinutes = 5
    if (remindMe === 'none') {
      effectiveMinutes = 0
    } else if (remindMe === 'custom') {
      const parsed = parseInt(customRemindMinutes, 10)
      if (isNaN(parsed) || parsed <= 0 || parsed > 10080) {
        setErrorMessage('Custom reminder minutes must be a positive number.')
        return
      }
      effectiveMinutes = parsed
    } else {
      const found = REMIND_ME_OPTIONS.find((o) => o.value === remindMe)
      effectiveMinutes = found ? found.minutes : 5
    }

    // Google Meet validation
    if (createMeet) {
      const trimmedMeet = meetUrl.trim()
      if (!trimmedMeet) {
        setErrorMessage('Google Meet link is required.')
        return
      }
      const isMeetFormat = /^https?:\/\/(www\.)?meet\.google\.com\/.+/i.test(trimmedMeet)
      if (!isMeetFormat) {
        setErrorMessage('Please enter a valid Google Meet link (e.g. https://meet.google.com/abc-defg-hij).')
        return
      }
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

    const finalLocation = resolvedLocation()
    const payload: CreateCalendarEventInput = {
      title: title.trim(),
      startDateTime,
      timeZone: timeZone || 'Asia/Kolkata',
      attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
      location: finalLocation || (createMeet ? meetUrl.trim() : undefined),
      description: description.trim() || undefined,
      createMeet,
      meetUrl: createMeet ? meetUrl.trim() : undefined
    }

    try {
      // 1. Create Google Calendar event
      const created = await createCalendarEvent(payload)

      // 2. If Remind me !== 'none', create initial local notification reminder
      if (remindMe !== 'none') {
        try {
          let triggerMs = startMs - effectiveMinutes * 60 * 1000
          const nowMs = Date.now()
          if (triggerMs < nowMs) {
            triggerMs = nowMs + 5000
          }

          await window.calby.reminders.create({
            title: `Meeting: ${created.title}`,
            scheduledAt: new Date(triggerMs).toISOString(),
            alertType: 'notification',
            alarmEnabled: false
          })
        } catch (reminderErr) {
          console.warn('[CreateCalendarEventModal] Initial reminder creation warning:', reminderErr)
        }
      }

      onSuccess(created, remindMe, customRemindMinutes)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !isAuthorizing) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-left select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-[#121826]">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Create Calendar Event</h2>
            <p className="text-[11px] text-slate-400">Add an event directly to Google Calendar</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || isAuthorizing}
            type="button"
            data-testid="create-event-close-button"
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content - Compact Form */}
        <div className="p-4 overflow-y-auto space-y-3">
          {writeAuthRequired ? (
            <div
              data-testid="create-event-write-auth-prompt"
              className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2.5 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-amber-300">Permission Required</h4>
                  <p className="text-amber-200/90 mt-0.5">
                    Calby needs permission to create Google Calendar events.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAllowWriteAccess}
                  disabled={isAuthorizing}
                  className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                >
                  {isAuthorizing ? 'Authorizing...' : 'Allow Access'}
                </button>
              </div>
            </div>
          ) : (
            <form id="create-calendar-event-form" onSubmit={handleSubmit} className="space-y-3">
              {errorMessage && (
                <div
                  data-testid="create-event-error"
                  className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Test meeting"
                  data-testid="create-event-title-input"
                  required
                  autoFocus
                  className="w-full px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* 2. Date & Start time in a compact 2-column row */}
              <div className="grid grid-cols-2 gap-2.5">
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
                    className="w-full px-2.5 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    data-testid="create-event-start-time-input"
                    required
                    className="w-full px-2.5 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* 3. Remind me Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Remind me
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={remindMe}
                    onChange={(e) => setRemindMe(e.target.value as RemindMeOption)}
                    data-testid="create-event-remind-me-select"
                    className="flex-1 px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
                  >
                    {REMIND_ME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {remindMe === 'custom' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="1"
                        max="10080"
                        value={customRemindMinutes}
                        onChange={(e) => setCustomRemindMinutes(e.target.value)}
                        data-testid="create-event-custom-minutes-input"
                        className="w-16 px-2 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 text-center"
                        placeholder="20"
                        required
                      />
                      <span className="text-[11px] text-slate-400">min before</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Guests */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Guests</label>
                <input
                  type="text"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="email@example.com, ..."
                  data-testid="create-event-guests-input"
                  className="w-full px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* 5. Timezone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Timezone</label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  data-testid="create-event-timezone-select"
                  className="w-full px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="America/Chicago">America/Chicago</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>

              {/* 6. Location: Horizontal Quick Options */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                  {(['office', 'room', 'online', 'custom'] as LocationPreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      data-testid={`location-preset-${preset}`}
                      onClick={() => setLocationPreset(preset)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium capitalize transition-all text-center border cursor-pointer ${
                        locationPreset === preset
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                          : 'bg-[#121826] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {locationPreset === 'room' && (
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Room name or number (e.g. 4B, Boardroom)"
                    data-testid="location-room-input"
                    className="w-full px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                )}

                {locationPreset === 'custom' && (
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Office / Room / Online"
                    data-testid="location-custom-input"
                    className="w-full px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                )}
              </div>

              {/* 7. Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description..."
                  rows={2}
                  data-testid="create-event-description-input"
                  className="w-full px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              {/* 8. Add Google Meet */}
              <div className="pt-0.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-event-meet-checkbox"
                    checked={createMeet}
                    onChange={(e) => {
                      setCreateMeet(e.target.checked)
                      if (!e.target.checked) {
                        setMeetUrl('')
                        setErrorMessage(null)
                      }
                    }}
                    data-testid="create-event-meet-checkbox"
                    className="w-4 h-4 rounded bg-[#121826] border-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="create-event-meet-checkbox" className="text-xs text-slate-300 cursor-pointer select-none">
                    Add Google Meet
                  </label>
                </div>

                {createMeet && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-0.5">
                      Google Meet Link <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={meetUrl}
                      onChange={(e) => {
                        setMeetUrl(e.target.value)
                        if (errorMessage) setErrorMessage(null)
                      }}
                      placeholder="https://meet.google.com/..."
                      data-testid="create-event-meet-url-input"
                      required={createMeet}
                      className="w-full px-3 py-1.5 bg-[#121826] border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        {!writeAuthRequired && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-800/80 bg-[#121826]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              data-testid="create-event-cancel-button"
              className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-calendar-event-form"
              disabled={isLoading}
              data-testid="create-event-submit-button"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Creating...</span>
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
