import { useState, useEffect, type FC } from 'react'
import { TitleBar } from '../components/ui/TitleBar'
import { OnboardingFlow } from '../features/onboarding/OnboardingFlow'
import { OnboardingStep } from '../features/onboarding/types'
import { VoiceAssistantHome } from '../features/voice/VoiceAssistantHome'
import { RemindersPage } from '../features/reminders/RemindersPage'
import { CalendarPage } from '../features/calendar/CalendarPage'
import type { AuthStatus } from '../types/calby'

export type ActiveView = 'home' | 'reminders' | 'calendar'

export const App: FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('home')

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

  // 1. Loading State
  if (isLoading) {
    return (
      <main className="w-full h-screen bg-[#070A11] flex flex-col justify-between select-none">
        <TitleBar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-4" />
          <p className="text-xs text-slate-400 font-mono">Initializing Calby...</p>
        </div>
      </main>
    )
  }

  // 2. Fatal Initialization Error
  if (error) {
    return (
      <main className="w-full h-screen bg-[#070A11] flex flex-col justify-between select-none">
        <TitleBar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Initialization Error</h2>
          <p className="text-xs text-slate-400 max-w-sm mb-4">{error}</p>
          <button
            onClick={() => void checkStatus()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
            type="button"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  // 3. Fully Configured and Onboarded -> Home View, Reminders View, or Calendar View
  if (authStatus?.isConfigured && authStatus.isOnboarded) {
    return (
      <main className="w-full h-screen bg-[#070A11] flex flex-col select-none">
        <TitleBar />
        {activeView === 'home' && (
          <VoiceAssistantHome
            onResetSetup={() => void checkStatus()}
            onNavigateToReminders={() => setActiveView('reminders')}
            onNavigateToCalendar={() => setActiveView('calendar')}
          />
        )}
        {activeView === 'reminders' && (
          <RemindersPage
            onNavigateHome={() => setActiveView('home')}
            onNavigateCalendar={() => setActiveView('calendar')}
          />
        )}
        {activeView === 'calendar' && (
          <CalendarPage
            onNavigateHome={() => setActiveView('home')}
            onNavigateReminders={() => setActiveView('reminders')}
          />
        )}
      </main>
    )
  }

  // 4. Configured but not yet onboarded -> Resume at Step 5 (Microphone Setup)
  if (authStatus?.isConfigured && !authStatus.isOnboarded) {
    return (
      <main className="w-full h-screen bg-[#070A11] flex flex-col select-none">
        <TitleBar />
        <OnboardingFlow
          initialStep={OnboardingStep.MICROPHONE}
          onFinish={() => void checkStatus()}
        />
      </main>
    )
  }

  // 5. Not Configured -> Start from Step 1 (Welcome)
  return (
    <main className="w-full h-screen bg-[#070A11] flex flex-col select-none">
      <TitleBar />
      <OnboardingFlow
        initialStep={OnboardingStep.WELCOME}
        onFinish={() => void checkStatus()}
      />
    </main>
  )
}