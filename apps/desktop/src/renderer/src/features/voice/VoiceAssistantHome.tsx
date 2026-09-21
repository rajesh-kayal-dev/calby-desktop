import { useState, useEffect, useMemo, type FC } from 'react'
import { VoiceOrb } from './VoiceOrb'
import { LiveTranscript } from './LiveTranscript'
import { ActionResultCard } from './ActionResultCard'
import { ErrorView } from './ErrorView'
import { BackgroundWaves } from './BackgroundWaves'
import { HomeContextCard } from './HomeContextCard'
import { useVoiceSession } from './useVoiceSession'
import {
  getTimePeriod,
  getGreetingForPeriod,
  CALBY_DYNAMIC_PROMPTS,
  type TimePeriod
} from './home-context'

interface VoiceAssistantHomeProps {
  onResetSetup?: () => void
  onNavigate?: (view: 'reminders' | 'calendar', reminderId?: string) => void
}

export const VoiceAssistantHome: FC<VoiceAssistantHomeProps> = ({ onNavigate }) => {
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

  const [userName, setUserName] = useState<string>('')
  const [greetingIndex] = useState<number>(() => Math.floor(Math.random() * 5))
  const [promptIndex] = useState<number>(() => Math.floor(Math.random() * CALBY_DYNAMIC_PROMPTS.length))
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>(() => getTimePeriod())

  // Period watcher (in case day period crosses boundary while open)
  useEffect(() => {
    const timer = setInterval(() => {
      const p = getTimePeriod()
      if (p !== currentPeriod) {
        setCurrentPeriod(p)
      }
    }, 60000)

    return () => clearInterval(timer)
  }, [currentPeriod])

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

  // Calculate session greeting
  const greetingText = useMemo(() => {
    return getGreetingForPeriod(currentPeriod, greetingIndex, userName)
  }, [currentPeriod, greetingIndex, userName])

  const dynamicPromptText = useMemo(() => {
    return CALBY_DYNAMIC_PROMPTS[promptIndex % CALBY_DYNAMIC_PROMPTS.length]
  }, [promptIndex])

  const handleOrbClick = (): void => {
    if (state === 'speaking') {
      void interrupt()
    } else {
      void toggleListening()
    }
  }

  // Keyboard shortcut label (Space)
  const spaceLabel = (() => {
    if (state === 'listening') return 'Press Space to stop'
    if (state === 'speaking') return 'Press Space to interrupt'
    return 'Press Space to talk'
  })()

  // State text below orb
  const stateLabel = (() => {
    if (state === 'listening') return 'Listening…'
    if (state === 'processing') return 'Thinking…'
    if (state === 'speaking') return 'Speaking…'
    return null
  })()

  return (
    <div
      className="relative w-full flex-1 flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: 'var(--ds-canvas-base)', color: 'var(--ds-text-primary)' }}
    >
      {/* Top-Right Contextual Information Card */}
      <div className="absolute top-6 right-6 z-20 pointer-events-auto">
        <HomeContextCard onNavigate={onNavigate} />
      </div>

      {/* Main Voice Canvas — Centered Layout */}
      <main className="relative flex-1 flex flex-col items-center justify-between pt-12 pb-8 px-6 z-10">
        {/* Top: Dynamic Greeting & Dynamic Capability Prompt */}
        <header className="text-center max-w-lg mx-auto">
          <h1
            className="font-semibold tracking-tight transition-all duration-300"
            style={{
              fontSize: 'var(--ds-text-headline-lg)',
              lineHeight: '36px',
              letterSpacing: '-0.015em',
              color: 'var(--ds-text-primary)'
            }}
          >
            {greetingText}
          </h1>

          {state === 'idle' && (
            <p
              className="mt-1.5 transition-all duration-300 font-normal"
              style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}
            >
              {dynamicPromptText}
            </p>
          )}
        </header>

        {/* Center: Dynamic Voice Orb */}
        <div className="my-auto flex flex-col items-center justify-center">
          <VoiceOrb state={state} audioLevels={audioLevels} onClick={handleOrbClick} />

          {/* Voice State Feedback Text */}
          {stateLabel && (
            <p
              aria-live="polite"
              className="mt-5 text-sm font-medium tracking-wide animate-pulse"
              style={{
                color: state === 'listening' ? '#38BDF8' : 'var(--ds-text-secondary)'
              }}
            >
              {stateLabel}
            </p>
          )}
        </div>

        {/* Transcripts / Action Results / Error View */}
        <div className="w-full flex flex-col items-center justify-center min-h-[64px] mb-2">
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

        {/* Bottom: Subtle manual push-to-talk pill */}
        <footer className="flex flex-col items-center">
          <button
            onClick={() => void toggleListening()}
            type="button"
            aria-label={state === 'listening' ? 'Stop listening' : 'Activate voice listening'}
            className={[
              'flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium',
              'transition-all duration-200 cursor-pointer backdrop-blur-sm',
              state === 'listening'
                ? 'border-[#38BDF8]/60 text-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                : 'border-[#1E293B] hover:border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
            ].join(' ')}
            style={{
              backgroundColor: state === 'listening' ? 'rgba(56,189,248,0.08)' : 'rgba(15, 23, 42, 0.6)'
            }}
          >
            {/* Keyboard icon */}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
        </footer>
      </main>

      {/* Background ethereal waves */}
      <BackgroundWaves state={state} />
    </div>
  )
}