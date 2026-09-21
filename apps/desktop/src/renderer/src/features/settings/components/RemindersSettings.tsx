import { useState, useEffect, type FC } from 'react'
import type { ReminderSettings } from '../types'
import {
  NOTIFICATION_SOUNDS,
  ALARM_SOUNDS
} from '../sound-catalog'
import { CalbySoundSelect } from './CalbySoundSelect'

interface RemindersSettingsProps {
  remindersSettings?: ReminderSettings
  onUpdate: (data: Partial<ReminderSettings>) => Promise<boolean>
}

const DURATION_OPTIONS = [
  { value: 'until_stopped', label: 'Until stopped' },
  { value: '1_min', label: '1 minute' },
  { value: '5_min', label: '5 minutes' },
  { value: '10_min', label: '10 minutes' }
]

const Toggle = ({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId?: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    data-testid={testId}
    onClick={() => onChange(!checked)}
    className={[
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 cursor-pointer',
      checked ? 'bg-[#2563EB]' : 'bg-[#334155]',
    ].join(' ')}
  >
    <span
      className={[
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
        checked ? 'translate-x-6' : 'translate-x-1',
      ].join(' ')}
    />
  </button>
)

export const RemindersSettingsComponent: FC<RemindersSettingsProps> = ({ remindersSettings, onUpdate }) => {
  const [notifications, setNotifications] = useState(remindersSettings?.desktopNotificationsEnabled ?? true)
  const [alarm, setAlarm] = useState(remindersSettings?.alarmEnabled ?? true)
  const [duration, setDuration] = useState(remindersSettings?.alarmDuration || 'until_stopped')

  const [notificationSound, setNotificationSound] = useState(remindersSettings?.notificationSound || 'Calby Soft')
  const [alarmSound, setAlarmSound] = useState(remindersSettings?.alarmSound || 'Calby Wake')

  useEffect(() => {
    if (remindersSettings) {
      setNotifications(remindersSettings.desktopNotificationsEnabled)
      setAlarm(remindersSettings.alarmEnabled)
      setDuration(remindersSettings.alarmDuration)
      if (remindersSettings.notificationSound) setNotificationSound(remindersSettings.notificationSound)
      if (remindersSettings.alarmSound) setAlarmSound(remindersSettings.alarmSound)
    }
  }, [remindersSettings])

  const handleToggleNotifications = async (val: boolean) => {
    setNotifications(val)
    await onUpdate({ desktopNotificationsEnabled: val })
  }

  const handleToggleAlarm = async (val: boolean) => {
    setAlarm(val)
    await onUpdate({ alarmEnabled: val })
  }

  const handleDurationChange = async (val: string) => {
    setDuration(val)
    await onUpdate({ alarmDuration: val })
  }

  const handleNotificationSoundChange = async (val: string) => {
    setNotificationSound(val)
    await onUpdate({ notificationSound: val })
  }

  const handleAlarmSoundChange = async (val: string) => {
    setAlarmSound(val)
    await onUpdate({ alarmSound: val })
  }

  return (
    <div data-testid="reminders-settings" className="space-y-6 select-none">
      {/* ── NOTIFICATIONS SUBSECTION ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Notifications
        </h3>

        <div className="rounded-xl bg-white/5 border border-white/10 divide-y divide-white/10">
          <div className="flex items-center justify-between px-4 py-3.5 gap-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                Desktop notifications
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Show banner notifications when reminders trigger.
              </p>
            </div>
            <Toggle testId="toggle-notifications" checked={notifications} onChange={(v) => void handleToggleNotifications(v)} />
          </div>

          <div className="flex items-center justify-between px-4 py-3.5 gap-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                Notification sound
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Choose sound tone when notifications appear.
              </p>
            </div>
            <CalbySoundSelect
              label="Notification sound"
              sounds={NOTIFICATION_SOUNDS}
              selectedSoundName={notificationSound}
              onSelectSound={(snd) => void handleNotificationSoundChange(snd)}
              testIdPrefix="notification-sound"
            />
          </div>
        </div>
      </div>

      {/* ── ALARM SUBSECTION ── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Alarm
        </h3>

        <div className="rounded-xl bg-white/5 border border-white/10 divide-y divide-white/10">
          <div className="flex items-center justify-between px-4 py-3.5 gap-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                Enable alarm
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Ring an audible alert for scheduled reminders.
              </p>
            </div>
            <Toggle testId="toggle-alarm" checked={alarm} onChange={(v) => void handleToggleAlarm(v)} />
          </div>

          <div className="flex items-center justify-between px-4 py-3.5 gap-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                Alarm sound
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Choose alarm melody when ringing.
              </p>
            </div>
            <CalbySoundSelect
              label="Alarm sound"
              sounds={ALARM_SOUNDS}
              selectedSoundName={alarmSound}
              onSelectSound={(snd) => void handleAlarmSoundChange(snd)}
              testIdPrefix="alarm-sound"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3.5 gap-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--ds-text-primary)' }}>
                Alarm duration
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Choose maximum ringing cutoff period if left unattended.
              </p>
            </div>
            <select
              data-testid="alarm-duration-select"
              value={duration}
              onChange={(e) => void handleDurationChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-[#1E293B] border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors cursor-pointer text-white font-medium"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
