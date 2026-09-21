import { useState, useEffect, type FC } from 'react'
import { TitleBar, type ConnectionStatus } from '../components/ui/TitleBar'
import { OnboardingFlow } from '../features/onboarding/OnboardingFlow'
import { OnboardingStep } from '../features/onboarding/types'
import { VoiceAssistantHome } from '../features/voice/VoiceAssistantHome'
import { RemindersPage } from '../features/reminders/RemindersPage'
import { CalendarPage } from '../features/calendar/CalendarPage'
import { MemoryPage } from '../features/memory/MemoryPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import type { AuthStatus } from '../types/calby'
import type { Reminder } from '../features/reminders/types'
import { findAlarmSound } from '../features/settings/sound-catalog'
import { CalbySoundPlayer } from '../services/sound-player.service'
import { ReminderAlarmSurface } from '../features/reminders/components/ReminderAlarmSurface'

export type ActiveView = 'home' | 'reminders' | 'calendar' | 'memory' | 'settings'

export const App: FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('home')
  const [highlightedReminderId, setHighlightedReminderId] = useState<string | null>(null)
  const [activeAlarmReminder, setActiveAlarmReminder] = useState<Reminder | null>(null)

  const checkStatus = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      if (!window.calby?.auth) {
        throw new Error('window.calby.auth API is unavailable.')
      }

      const result = await window.calby.auth.getStatus()
      if (result.ok) {
        setAuthStatus(result.data)
      } else {
        setError(result.error.message || 'Failed to retrieve setup status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during startup')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void checkStatus()
  }, [])

  // Listen for deep link navigation requests (from system tray, notifications, or global hotkey)
  useEffect(() => {
    if (!window.calby?.system?.onNavigate) return

    const unsubscribe = window.calby.system.onNavigate((payload) => {
      console.log('[App] Received onNavigate event:', payload)
      if (payload.view) {
        setActiveView(payload.view as ActiveView)
      }
      if (payload.reminderId) {
        setHighlightedReminderId(payload.reminderId)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Listen for reminder triggers, notification sounds, and alarm dismissals
  useEffect(() => {
    if (!window.calby?.reminders) return

    // 1. Alarm trigger listener
    const unsubscribeTriggered = window.calby.reminders.onTriggered(async (payload) => {
      console.log('[App] Reminder triggered:', payload)
      if (!payload?.reminder) return

      try {
        const configRes = await window.calby.settings.getConfig()
        const cfg = configRes.ok ? configRes.data : null
        const reminderSettings = cfg?.reminders

        const isAlarm = payload.reminder.alertType === 'alarm' || payload.reminder.alarmEnabled
        const isAlarmEnabled = isAlarm && (reminderSettings?.alarmEnabled ?? true)

        if (isAlarmEnabled) {
          setActiveAlarmReminder(payload.reminder)
          const soundObj = findAlarmSound(reminderSettings?.alarmSound)
          void CalbySoundPlayer.getInstance().ringAlarm(soundObj, reminderSettings?.alarmDuration)
        }
      } catch (err) {
        console.error('[App] Failed to trigger alarm sound:', err)
      }
    })

    // 2. Notification sound playback listener (for desktop notifications)
    const unsubscribePlaySound = window.calby.reminders.onPlaySound?.((payload) => {
      console.log('[App] Received onPlaySound event:', payload)
      if (payload?.sound) {
        void CalbySoundPlayer.getInstance().playNotification(payload.sound)
      }
    })

    // 3. Reminders change listener (dismiss active alarm if updated elsewhere)
    const unsubscribeChanged = window.calby.reminders.onChanged((payload) => {
      if (
        activeAlarmReminder &&
        payload.reminder.id === activeAlarmReminder.id &&
        payload.reminder.status !== 'triggered'
      ) {
        CalbySoundPlayer.getInstance().stopAll()
        setActiveAlarmReminder(null)
      }
    })

    return () => {
      unsubscribeTriggered()
      if (unsubscribePlaySound) unsubscribePlaySound()
      if (unsubscribeChanged) unsubscribeChanged()
    }
  }, [activeAlarmReminder])

  const handleStopAlarm = async (id: string): Promise<void> => {
    CalbySoundPlayer.getInstance().stopAll()
    try {
      await window.calby.reminders.dismiss(id)
    } catch (err) {
      console.error('Failed to dismiss reminder on stop:', err)
    }
    setActiveAlarmReminder(null)
  }

  const handleSnoozeAlarm = async (id: string): Promise<void> => {
    CalbySoundPlayer.getInstance().stopAll()
    try {
      await window.calby.reminders.snooze(id, 5)
    } catch (err) {
      console.error('Failed to snooze reminder:', err)
    }
    setActiveAlarmReminder(null)
  }

  const handleCompleteAlarm = async (id: string): Promise<void> => {
    CalbySoundPlayer.getInstance().stopAll()
    try {
      await window.calby.reminders.complete(id)
    } catch (err) {
      console.error('Failed to complete reminder:', err)
    }
    setActiveAlarmReminder(null)
  }

  // Derive connection status from authStatus — NOT from voice session state.
  // Connected = Gemini API key is configured and valid.
  const connectionStatus: ConnectionStatus = (() => {
    if (isLoading) return 'checking'
    if (!authStatus) return 'disconnected'
    if (authStatus.isConfigured) return 'connected'
    return 'disconnected'
  })()

  // 1. Loading State
  if (isLoading) {
    return (
      <main className="w-full h-screen flex flex-col select-none" style={{ backgroundColor: 'var(--ds-canvas-base)' }}>
        <TitleBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-[#38BDF8] border-t-transparent animate-spin" />
          <p className="text-xs font-mono" style={{ color: 'var(--ds-text-muted)' }}>Initializing Calby...</p>
        </div>
      </main>
    )
  }

  // 2. Fatal Initialization Error
  if (error) {
    return (
      <main className="w-full h-screen flex flex-col select-none" style={{ backgroundColor: 'var(--ds-canvas-base)' }}>
        <TitleBar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--ds-text-primary)' }}>Initialization Error</h2>
            <p className="text-sm max-w-sm" style={{ color: 'var(--ds-text-secondary)' }}>{error}</p>
          </div>
          <button
            onClick={() => void checkStatus()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--ds-surface-card)', border: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}
            type="button"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  // Helper: navigate with optional reminderId reset
  const navigate = (view: ActiveView): void => {
    if (view !== 'reminders') setHighlightedReminderId(null)
    setActiveView(view)
  }

  // 3. Fully Configured and Onboarded → main app shell with NavBar
  if (authStatus?.isConfigured && authStatus.isOnboarded) {
    return (
      <main className="w-full h-screen flex flex-col select-none" style={{ backgroundColor: 'var(--ds-canvas-base)' }}>
        {/* Single unified header: brand + nav tabs + connection status dot + settings gear */}
        <TitleBar
          activeView={activeView}
          onNavigate={navigate}
          connectionStatus={connectionStatus}
        />

        {/* Content area — each view preserves its phase-specific layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'home' && (
            <VoiceAssistantHome
              onResetSetup={() => void checkStatus()}
              onNavigate={(view, reminderId) => {
                if (reminderId) setHighlightedReminderId(reminderId)
                setActiveView(view)
              }}
            />
          )}
          {activeView === 'reminders' && (
            <RemindersPage
              highlightedReminderId={highlightedReminderId}
            />
          )}
          {activeView === 'calendar' && (
            <CalendarPage />
          )}
          {activeView === 'memory' && (
            <MemoryPage />
          )}
          {activeView === 'settings' && (
            <SettingsPage
              onResetSetup={() => void checkStatus()}
              onNavigateHome={() => navigate('home')}
              onNavigateMemory={() => navigate('memory')}
              onNavigateCalendar={() => navigate('calendar')}
              onNavigateReminders={() => navigate('reminders')}
            />
          )}
        </div>

        {/* Floating global Alarm Surface */}
        <ReminderAlarmSurface
          reminder={activeAlarmReminder}
          onStop={handleStopAlarm}
          onSnooze={handleSnoozeAlarm}
          onComplete={handleCompleteAlarm}
        />
      </main>
    )
  }

  // 4. Configured but not yet onboarded → Resume at Step 5 (Microphone Setup)
  if (authStatus?.isConfigured && !authStatus.isOnboarded) {
    return (
      <main className="w-full h-screen flex flex-col select-none" style={{ backgroundColor: 'var(--ds-canvas-base)' }}>
        <TitleBar stepInfo={{ step: 5, totalSteps: 5, label: 'Microphone' }} />
        <OnboardingFlow
          initialStep={OnboardingStep.MICROPHONE}
          onFinish={() => void checkStatus()}
        />
      </main>
    )
  }

  // 5. Not Configured → Start from Step 1 (Welcome)
  return (
    <main className="w-full h-screen flex flex-col select-none" style={{ backgroundColor: 'var(--ds-canvas-base)' }}>
      <TitleBar />
      <OnboardingFlow
        initialStep={OnboardingStep.WELCOME}
        onFinish={() => void checkStatus()}
      />
    </main>
  )
}
