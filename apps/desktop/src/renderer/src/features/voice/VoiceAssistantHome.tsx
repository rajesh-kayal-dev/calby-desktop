import { useState, useEffect, useMemo, type FC } from 'react'
import { VoiceOrb } from './VoiceOrb'
import { LiveTranscript } from './LiveTranscript'
import { ActionResultCard } from './ActionResultCard'
import { ErrorView } from './ErrorView'
import { BackgroundWaves } from './BackgroundWaves'
import { useVoiceSession } from './useVoiceSession'
import { ReminderAlarmToast } from '../reminders/components/ReminderAlarmToast'
import type { Reminder } from '../reminders/types'
import { snoozeReminder, dismissReminder } from '../reminders/reminders-api'

interface VoiceAssistantHomeProps {
  onResetSetup?: () => void
}

export const VoiceAssistantHome: FC<VoiceAssistantHomeProps> = ({ onResetSetup: _onResetSetup }) => {
  const {
    state,
    stateMetadata,
    userTranscript,
    assistantTranscript,
    error,
    audioLevels,
    toggleListening,
    interrupt,
    retry
  } = useVoiceSession()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const [userName, setUserName] = useState<string>('')

  // Dynamically load user name from config
  useEffect(() => {
    const fetchUserName = async (): Promise<void> => {
      try {
        if (window.calby?.settings?.getConfig) {
          const res = await window.calby.settings.getConfig()
          if (res.ok && res.data?.personalize?.userName) {
            setUserName(res.data.personalize.userName.trim())
          }
        }
      } catch (err) {
        console.error('Failed to load user name for greeting:', err)
      }
    }
    void fetchUserName()
  }, [])

  const [triggeredReminder, setTriggeredReminder] = useState<Reminder | null>(null)

  // Listen for background alarm triggers while on Home
  useEffect(() => {
    const unsub = window.calby?.reminders?.onTriggered((payload) => {
      console.log('[VoiceAssistantHome] Received reminder trigger:', payload)
      setTriggeredReminder(payload.reminder)
    })
    return () => {
      if (unsub) unsub()
    }
  }, [])

  const handleOrbClick = (): void => {
    if (state === 'speaking') {
      void interrupt()
    } else {
      void toggleListening()
    }
  }

  const handleSnooze = async (id: string): Promise<void> => {
    try {
      await snoozeReminder(id, 5)
      setTriggeredReminder(null)
    } catch (err) {
      console.error('Failed to snooze reminder:', err)
    }
  }

  const handleDismiss = async (id: string): Promise<void> => {
    try {
      await dismissReminder(id)
      setTriggeredReminder(null)
    } catch (err) {
      console.error('Failed to dismiss reminder:', err)
    }
  }

  // Keyboard shortcut label (Space)
  const spaceLabel = (() => {
    if (state === 'listening') return 'Press Space to stop'
    if (state === 'speaking') return 'Press Space to interrupt'
    return 'Press Space to talk'
  })()

  return (
    <div
      className="relative w-full flex-1 flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: 'var(--ds-canvas-base)', color: 'var(--ds-text-primary)' }}
    >
      {/* Voice Canvas — centered vertically */}
      <main className="relative flex-1 flex flex-col items-center justify-between pt-10 pb-6 px-6 z-10">

        {/* Top: Greeting (idle) or State label (active states) */}
        <div className="text-center">
          {state === 'idle' && (
            <>
              <h1
                className="font-semibold tracking-tight"
                style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
              >
                {userName ? (
                  <>
                    {greeting}, <span style={{ color: '#38BDF8' }}>{userName}</span>
                  </>
                ) : (
                  greeting
                )}
              </h1>
              <p className="mt-1" style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}>
                How can I help you today?
              </p>
            </>
          )}
          {state === 'listening' && (
            <h1
              className="font-semibold tracking-tight"
              style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
            >
              Listening...
            </h1>
          )}
          {state === 'processing' && (
            <h1
              className="font-semibold tracking-tight"
              style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
            >
              Processing...
            </h1>
          )}
          {state === 'speaking' && (
            <>
              <h1
                className="font-semibold tracking-tight"
                style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
              >
                Speaking...
              </h1>
              <p className="mt-1" style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}>
                Here&apos;s your response.
              </p>
            </>
          )}
          {state === 'action_result' && (
            <h1
              className="font-semibold tracking-tight"
              style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', letterSpacing: '-0.015em', color: 'var(--ds-text-primary)' }}
            >
              Done
            </h1>
          )}
          {/* Error state: no title — ErrorView handles it */}
        </div>

        {/* Center: Voice Orb */}
        <VoiceOrb state={state} audioLevels={audioLevels} onClick={handleOrbClick} />

        {/* Below orb: transcript / action result / error / idle tagline */}
        <div className="w-full flex flex-col items-center justify-center">
          {state === 'idle' && (
            <div className="text-center">
              <p
                className="font-medium"
                style={{ fontSize: 'var(--ds-text-body-lg)', color: 'var(--ds-text-primary)' }}
              >
                Calby is ready
              </p>
              <p
                className="mt-0.5"
                style={{ fontSize: 'var(--ds-text-body-sm)', color: 'var(--ds-text-secondary)' }}
              >
                Ask naturally. Just speak.
              </p>
            </div>
          )}

          {(state === 'listening' || state === 'processing' || state === 'speaking') && (
            <LiveTranscript
              userTranscript={userTranscript}
              assistantTranscript={assistantTranscript}
            />
          )}

          {state === 'action_result' && (
            <ActionResultCard
              title={typeof stateMetadata?.title === 'string' ? stateMetadata.title : 'Action completed'}
              subtitle={typeof stateMetadata?.subtitle === 'string' ? stateMetadata.subtitle : 'Calby has taken care of it.'}
            />
          )}

          {state === 'error' && (
            <ErrorView
              message={error?.message || 'Please check your internet connection and try again.'}
              onRetry={() => void retry()}
            />
          )}
        </div>

        {/* Bottom: "Press Space to talk" keyboard pill — matching Phase 7 design */}
        <div className="flex flex-col items-center gap-3">
          {/* Keyboard pill button */}
          <button
            onClick={() => void toggleListening()}
            type="button"
            aria-label={state === 'listening' ? 'Stop listening' : 'Activate voice listening'}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium',
              'transition-all duration-200 cursor-pointer',
              state === 'listening'
                ? 'border-[#38BDF8]/60 text-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                : 'border-[#1E293B] hover:border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]',
            ].join(' ')}
            style={{
              backgroundColor: state === 'listening' ? 'rgba(56,189,248,0.08)' : 'var(--ds-surface-card)',
            }}
          >
            {/* Keyboard icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="6" y1="8" x2="6.01" y2="8" strokeWidth="3" />
              <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth="3" />
              <line x1="14" y1="8" x2="14.01" y2="8" strokeWidth="3" />
              <line x1="18" y1="8" x2="18.01" y2="8" strokeWidth="3" />
              <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="3" />
              <line x1="18" y1="12" x2="18.01" y2="12" strokeWidth="3" />
              <line x1="8" y1="16" x2="16" y2="16" strokeWidth="2" />
            </svg>
            <span>{spaceLabel}</span>
          </button>
        </div>
      </main>

      {/* Footer tagline — bottom-left, matching Phase 7 */}
      <div
        className="absolute bottom-3 left-5 z-10 pointer-events-none"
        style={{ fontSize: 'var(--ds-text-label-md)', color: 'var(--ds-text-muted)' }}
      >
        Your time, understood.
      </div>

      {/* Background ethereal waves */}
      <BackgroundWaves state={state} />

      {/* Floating alarm toast if triggered while on Home */}
      <ReminderAlarmToast
        reminder={triggeredReminder}
        onSnooze={(id) => void handleSnooze(id)}
        onDismiss={(id) => void handleDismiss(id)}
        onClose={() => setTriggeredReminder(null)}
      />
    </div>
  )
}