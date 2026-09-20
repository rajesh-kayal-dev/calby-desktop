import { useState, useEffect, useMemo, type FC } from 'react'
import { VoiceOrb } from './VoiceOrb'
import { LiveTranscript } from './LiveTranscript'
import { ActionResultCard } from './ActionResultCard'
import { ErrorView } from './ErrorView'
import { BackgroundWaves } from './BackgroundWaves'
import { MicDiagnosticPanel } from './MicDiagnosticPanel'
import { useVoiceSession } from './useVoiceSession'
import { ReminderAlarmToast } from '../reminders/components/ReminderAlarmToast'
import type { Reminder } from '../reminders/types'
import { snoozeReminder, dismissReminder } from '../reminders/reminders-api'

interface VoiceAssistantHomeProps {
  onResetSetup?: () => void
  onNavigateToReminders?: () => void
  onNavigateToCalendar?: () => void
  onNavigateToMemory?: () => void
  onNavigateToSettings?: () => void
}

export const VoiceAssistantHome: FC<VoiceAssistantHomeProps> = ({
  onResetSetup,
  onNavigateToReminders,
  onNavigateToCalendar,
  onNavigateToMemory,
  onNavigateToSettings
}) => {
  const {
    state,
    stateMetadata,
    userTranscript,
    assistantTranscript,
    error,
    audioLevels,
    diagnostics,
    toggleListening,
    sendTextInput,
    finishTurn,
    interrupt,
    retry,
    testMicrophoneOnly,
    stopMicrophoneOnly,
    selectMicrophoneDevice
  } = useVoiceSession()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
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

  const statusPill = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          label: 'Listening',
          dotClass: 'bg-sky-400 animate-pulse',
          containerClass: 'bg-sky-500/10 border-sky-500/20 text-sky-400'
        }
      case 'processing':
        return {
          label: 'Processing',
          dotClass: 'bg-blue-400 animate-pulse',
          containerClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }
      case 'speaking':
        return {
          label: 'Speaking',
          dotClass: 'bg-cyan-400 animate-pulse',
          containerClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
        }
      case 'action_result':
        return {
          label: 'Done',
          dotClass: 'bg-emerald-400',
          containerClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }
      case 'error':
        return {
          label: 'Offline',
          dotClass: 'bg-red-400',
          containerClass: 'bg-red-500/10 border-red-500/20 text-red-400'
        }
      case 'idle':
      default:
        return {
          label: 'Connected',
          dotClass: 'bg-emerald-400 animate-pulse',
          containerClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }
    }
  }, [state])

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

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#070A11] text-white select-none">
      {/* 1. Header Bar */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-white/[0.04] z-20 bg-[#070A11]/80 backdrop-blur-md">
        {/* Brand Identity / Window Title */}
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="flex items-center gap-[3px] text-cyan-400">
            <span className="w-[3px] h-3 bg-cyan-400 rounded-full inline-block" />
            <span className="w-[3px] h-5 bg-cyan-400 rounded-full inline-block" />
            <span className="w-[3px] h-3.5 bg-cyan-400 rounded-full inline-block" />
          </div>
          <span className="font-semibold text-[15px] tracking-wide text-white">Calby</span>
        </div>

        {/* Window Utility Actions & System Controls */}
        <div className="flex items-center gap-3">
                              {/* Settings Navigation Link */}
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              type="button"
              data-testid="nav-settings-button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111622] hover:bg-[#162238] border border-cyan-500/20 hover:border-cyan-400/40 text-xs font-medium text-slate-300 hover:text-[#38BDF8] transition-all cursor-pointer"
              title="View Settings & Privacy"
              aria-label="Settings"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          )}

          {/* Memory Navigation Link */}
          {onNavigateToMemory && (
            <button
              onClick={onNavigateToMemory}
              type="button"
              data-testid="nav-memory-button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111622] hover:bg-[#162238] border border-cyan-500/20 hover:border-cyan-400/40 text-xs font-medium text-slate-300 hover:text-[#38BDF8] transition-all cursor-pointer"
              title="View Personal Memory"
              aria-label="Memory"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Memory</span>
            </button>
          )}

          {/* Calendar Navigation Link */}
          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111622] hover:bg-[#162238] border border-cyan-500/20 hover:border-cyan-400/40 text-xs font-medium text-slate-300 hover:text-[#38BDF8] transition-all cursor-pointer"
              title="View Calendar"
              aria-label="Calendar"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Calendar</span>
            </button>
          )}

          {/* Reminders Navigation Link */}
          {onNavigateToReminders && (
            <button
              onClick={onNavigateToReminders}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111622] hover:bg-[#162238] border border-cyan-500/20 hover:border-cyan-400/40 text-xs font-medium text-slate-300 hover:text-[#38BDF8] transition-all cursor-pointer"
              title="View Reminders"
              aria-label="Reminders"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Reminders</span>
            </button>
          )}

          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${statusPill.containerClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusPill.dotClass}`} />
            <span>{statusPill.label}</span>
          </div>

          {/* Reset Setup / Settings Action */}
          {onResetSetup && (
            <button
              onClick={onResetSetup}
              type="button"
              className="text-slate-400 hover:text-white transition-colors duration-150 p-1 cursor-pointer"
              title="Setup & Credentials"
              aria-label="Reset Setup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <path
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Voice Canvas */}
      <main className="relative flex-1 flex flex-col items-center justify-between pt-8 pb-6 px-6 z-10">
        {/* Top Context & Greeting */}
        <div className="text-center space-y-1.5 mt-1">
          {state === 'idle' && (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {greeting}, <span className="text-[#38bdf8]">Rajesh</span>
              </h1>
              <p className="text-sm font-normal text-slate-400">
                How can I help you today?
              </p>
            </>
          )}
          {state === 'listening' && (
            <h1 className="text-2xl font-medium tracking-tight text-white drop-shadow-sm">
              Listening...
            </h1>
          )}
          {state === 'processing' && (
            <h1 className="text-2xl font-medium tracking-tight text-white drop-shadow-sm">
              Processing...
            </h1>
          )}
          {state === 'speaking' && (
            <>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Speaking...</h1>
              <p className="text-sm text-slate-400 font-normal">Here’s your response.</p>
            </>
          )}
          {state === 'action_result' && (
            <h1 className="text-2xl font-semibold text-white tracking-tight">Done</h1>
          )}
          {state === 'error' && null}
        </div>

        {/* Center Orb Visualizer */}
        <VoiceOrb state={state} audioLevels={audioLevels} onClick={handleOrbClick} />

        {/* Middle State Context (Status text, Transcript, Action card, or Error card) */}
        <div className="w-full flex flex-col items-center justify-center my-2">
          {state === 'idle' && (
            <div className="text-center space-y-1">
              <div className="text-[15px] font-medium text-white tracking-wide">
                Calby is ready
              </div>
              <p className="text-xs text-slate-400 font-normal">
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

        {/* Bottom Voice Trigger / Keyboard Shortcut */}
        <div className="flex flex-col items-center gap-2 mb-1">
          <button
            onClick={() => void toggleListening()}
            type="button"
            aria-label={state === 'listening' ? 'Stop listening' : 'Activate voice listening'}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${
              state === 'listening'
                ? 'bg-sky-500/20 border-sky-400 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)] scale-105'
                : 'bg-[#101726]/80 hover:bg-[#162238] border-cyan-500/20 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-400 shadow-[0_0_20px_-3px_rgba(56,189,248,0.25)]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          <span className="text-[11px] font-medium tracking-wide text-slate-400">
            {state === 'listening' ? (
              <>Press <span className="text-slate-300">Space</span> to stop</>
            ) : state === 'speaking' ? (
              <>Press <span className="text-slate-300">Space</span> to interrupt</>
            ) : (
              <>Press <span className="text-slate-300">Space</span> to talk</>
            )}
          </span>
        </div>
      </main>

      {/* 3. Background Ethereal Waves */}
      <BackgroundWaves state={state} />

      {/* 4. Floating Alarm Toast if triggered while on Home */}
      <ReminderAlarmToast
        reminder={triggeredReminder}
        onSnooze={(id) => void handleSnooze(id)}
        onDismiss={(id) => void handleDismiss(id)}
        onClose={() => setTriggeredReminder(null)}
      />

      {/* 5. Development-Only Microphone Diagnostic Panel */}
      {import.meta.env.DEV && (
        <MicDiagnosticPanel
          diagnostics={diagnostics}
          onSelectDevice={selectMicrophoneDevice}
          onTestMicOnly={testMicrophoneOnly}
          onStopMicOnly={stopMicrophoneOnly}
          onSendTextTest={sendTextInput}
          onFinishTurn={finishTurn}
          userTranscript={userTranscript}
          assistantTranscript={assistantTranscript}
        />
      )}
    </div>
  )
}