import { useState, useEffect, type FC, type CSSProperties } from 'react'
import type { Reminder } from '../types'
import { CalbySoundPlayer } from '../../../services/sound-player.service'
import { findAlarmSound } from '../../settings/sound-catalog'

// Sound-wave waveform icon matching Calby brand identity
const CalbyWordmarkIcon = () => (
  <svg width="22" height="18" viewBox="0 0 24 20" fill="currentColor" aria-hidden="true">
    <rect x="0" y="6" width="3" height="8" rx="1.5" />
    <rect x="5" y="2" width="3" height="16" rx="1.5" />
    <rect x="10" y="0" width="3" height="20" rx="1.5" />
    <rect x="15" y="4" width="3" height="12" rx="1.5" />
    <rect x="20" y="7" width="3" height="6" rx="1.5" />
  </svg>
)

export const AlarmWindowApp: FC = () => {
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [isMissed, setIsMissed] = useState<boolean>(false)
  const [isRinging, setIsRinging] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // 1. Load reminder data from hash query and listen for IPC alarm data
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash
      const queryIdx = hash.indexOf('?')
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.slice(queryIdx))
        const id = params.get('id')
        const missedParam = params.get('missed') === '1'
        setIsMissed(missedParam)

        if (id && window.calby?.reminders?.getById) {
          void window.calby.reminders.getById(id).then((res) => {
            if (res.ok && res.data) {
              setReminder(res.data)
            }
          })
        }
      }
    }

    parseHash()

    // IPC event from main process
    const unsubscribe = window.calby?.reminders?.onAlarmData?.((payload) => {
      if (payload?.reminder) {
        setReminder(payload.reminder)
        setIsMissed(Boolean(payload.isMissed))
      }
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // 2. Play audible alarm loop on mount
  useEffect(() => {
    let isCancelled = false

    const playAlarm = async () => {
      try {
        const configRes = await window.calby.settings.getConfig()
        if (isCancelled) return

        const reminderSettings = configRes.ok ? configRes.data?.reminders : null
        const isAlarmEnabled = reminderSettings?.alarmEnabled ?? true

        // For missed reminders, we do not ring aggressively, only when normal alarm triggers
        if (isAlarmEnabled && !isMissed) {
          const soundObj = findAlarmSound(reminderSettings?.alarmSound)
          void CalbySoundPlayer.getInstance().ringAlarm(soundObj, reminderSettings?.alarmDuration)
        }
      } catch (err) {
        console.error('[AlarmWindow] Failed to start alarm sound:', err)
      }
    }

    void playAlarm()

    return () => {
      isCancelled = true
      CalbySoundPlayer.getInstance().stopAll()
    }
  }, [isMissed])

  const handleStopAlarm = () => {
    CalbySoundPlayer.getInstance().stopAll()
    setIsRinging(false)
  }

  const handleSnooze = async () => {
    if (!reminder || isProcessing) return
    setIsProcessing(true)
    CalbySoundPlayer.getInstance().stopAll()
    try {
      await window.calby.reminders.snooze(reminder.id, 5)
      await window.calby.reminders.closeAlarm()
    } catch (err) {
      console.error('[AlarmWindow] Snooze failed:', err)
      setIsProcessing(false)
    }
  }

  const handleComplete = async () => {
    if (!reminder || isProcessing) return
    setIsProcessing(true)
    CalbySoundPlayer.getInstance().stopAll()
    try {
      await window.calby.reminders.complete(reminder.id)
      await window.calby.reminders.closeAlarm()
    } catch (err) {
      console.error('[AlarmWindow] Complete failed:', err)
      setIsProcessing(false)
    }
  }

  const handleDismiss = async () => {
    if (!reminder || isProcessing) return
    setIsProcessing(true)
    CalbySoundPlayer.getInstance().stopAll()
    try {
      await window.calby.reminders.dismiss(reminder.id)
      await window.calby.reminders.closeAlarm()
    } catch (err) {
      console.error('[AlarmWindow] Dismiss failed:', err)
      setIsProcessing(false)
    }
  }

  const handleClose = async () => {
    CalbySoundPlayer.getInstance().stopAll()
    try {
      await window.calby.reminders.closeAlarm()
    } catch {
      window.close()
    }
  }

  const dateObj = reminder ? new Date(reminder.scheduledAt) : new Date()
  const timeFormatted = dateObj.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <div
      className="w-full h-screen bg-[#101725] text-white flex flex-col justify-between select-none border border-[#1E293B]/80 rounded-none overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
      data-purpose="reminder-alarm-window"
    >
      {/* Draggable Titlebar Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#0A0E17]/90 border-b border-[#1E293B]/60 cursor-move"
        style={{ WebkitAppRegion: 'drag' } as CSSProperties}
      >
        <div className="flex items-center gap-2.5 text-[#38BDF8]">
          <CalbyWordmarkIcon />
          <span className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">
            Calby Alarm
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
          style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}
          title="Close"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Main Alert Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 text-center">
        {/* Animated Bell / Clock Icon */}
        <div className="relative mb-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isMissed
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
            }`}
          >
            {isMissed ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg
                className={`w-8 h-8 ${isRinging ? 'animate-bounce' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {isRinging && !isMissed && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
            </span>
          )}
        </div>

        {/* Badge */}
        <span
          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-2 ${
            isMissed
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
        >
          {isMissed ? 'Missed Reminder' : 'Reminder'}
        </span>

        {/* Reminder Title */}
        <h1 className="text-xl font-bold text-white tracking-tight leading-snug line-clamp-2 max-w-sm mb-1">
          {reminder?.title || 'Reminder'}
        </h1>

        {/* Scheduled time info */}
        <p className="text-sm font-medium text-slate-400 mb-1">
          Scheduled for {timeFormatted}
        </p>

        {isMissed && (
          <p className="text-xs text-rose-400/90 font-medium bg-rose-950/30 px-3 py-1 rounded-md border border-rose-500/20 mt-1">
            Missed while Calby was unavailable.
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-5 bg-[#0C111C] border-t border-[#1E293B]/60 flex flex-col gap-2.5">
        {/* Stop Alarm button (prominent if ringing) */}
        {isRinging && !isMissed && (
          <button
            type="button"
            onClick={handleStopAlarm}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span>Stop alarm</span>
          </button>
        )}

        {/* Action Row: Snooze / Complete / Dismiss */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSnooze}
            disabled={isProcessing}
            className="py-2 px-3 rounded-xl bg-[#162032] hover:bg-[#1E2B45] text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Snooze 5m</span>
          </button>

          <button
            type="button"
            onClick={handleComplete}
            disabled={isProcessing}
            className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Complete</span>
          </button>
        </div>

        {isMissed && (
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isProcessing}
            className="w-full py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium text-center transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
