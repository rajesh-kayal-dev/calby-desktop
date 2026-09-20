import { useState, type FC } from 'react'
import { useSettings } from './hooks/useSettings'
import { SettingsSection } from './components/SettingsSection'
import { GeminiSettings } from './components/GeminiSettings'
import { CalendarSettings } from './components/CalendarSettings'
import { MemorySettings } from './components/MemorySettings'
import { MicrophoneSettings } from './components/MicrophoneSettings'
import { PrivacySettings } from './components/PrivacySettings'
import { AboutSettings } from './components/AboutSettings'
import { ConfirmDangerModal } from './components/ConfirmDangerModal'

interface SettingsPageProps {
  onNavigateHome: () => void
  onNavigateReminders?: () => void
  onNavigateCalendar?: () => void
  onNavigateMemory?: () => void
  onResetSetup?: () => void
}

export const SettingsPage: FC<SettingsPageProps> = ({
  onNavigateHome,
  onNavigateReminders,
  onNavigateCalendar,
  onNavigateMemory,
  onResetSetup
}) => {
  const {

    authStatus,
    calendarStatus,
    micState,
    memoryCount,
    systemInfo,
    isLoading,
    actionError,
    actionSuccess,
    setActionSuccess,
    connectCalendar,
    disconnectCalendar,
    clearMemories,
    clearAllData,
    openMicSettings,
    refresh
  } = useSettings(onResetSetup)

  const [isClearMemoriesModalOpen, setIsClearMemoriesModalOpen] = useState(false)
  const [isClearAllDataModalOpen, setIsClearAllDataModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirmClearMemories = async (): Promise<void> => {
    try {
      setIsProcessing(true)
      await clearMemories()
      setIsClearMemoriesModalOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmClearAllData = async (): Promise<void> => {
    try {
      setIsProcessing(true)
      await clearAllData()
      setIsClearAllDataModalOpen(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      data-testid="settings-page"
      className="flex-1 flex flex-col h-full overflow-hidden bg-[#070A11] text-slate-100 p-6 space-y-6 select-none"
    >
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          type="button"
          data-testid="back-to-home-button"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-sky-400 transition-colors font-medium cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to Voice Assistant</span>
        </button>

        <div className="flex items-center gap-3">
          {onNavigateCalendar && (
            <button
              onClick={onNavigateCalendar}
              type="button"
              data-testid="settings-nav-calendar-button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#38BDF8] transition-colors font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Calendar</span>
            </button>
          )}
          {onNavigateReminders && (
            <button
              onClick={onNavigateReminders}
              type="button"
              data-testid="settings-nav-reminders-button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#38BDF8] transition-colors font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Reminders</span>
            </button>
          )}
          {onNavigateMemory && (
            <button
              onClick={onNavigateMemory}
              type="button"
              data-testid="settings-nav-memory-button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#38BDF8] transition-colors font-medium cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Memory</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Row: Title & Subtitle */}
      <div className="pb-2 border-b border-slate-800/80">
        <h1 className="text-xl font-bold text-white tracking-tight">Settings & Privacy</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage AI credentials, external integrations, hardware permissions, and local data
        </p>
      </div>

      {/* Notification banner */}
      {actionError && (
        <div data-testid="settings-error-alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div data-testid="settings-success-alert" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          {actionSuccess}
        </div>
      )}

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto pr-1 pb-6 space-y-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-mono">Loading settings...</p>
          </div>
        ) : (
          <>
            {/* 1. AI Connection */}
            <SettingsSection
              title="AI Connection"
              description="Gemini Live voice pipeline authorization"
            >
              <GeminiSettings
                authStatus={authStatus}
                onKeyUpdated={() => {
                  void refresh()
                  setActionSuccess('Gemini API key updated successfully.')
                }}
              />
            </SettingsSection>

            {/* 2. External Connections */}
            <SettingsSection
              title="External Connections"
              description="Third-party service integrations"
            >
              <CalendarSettings
                status={calendarStatus}
                onConnect={connectCalendar}
                onDisconnect={disconnectCalendar}
              />
            </SettingsSection>

            {/* 3. Personal Memory */}
            <SettingsSection
              title="Personal Memory"
              description="Locally stored facts and voice notes"
            >
              <MemorySettings
                memoryCount={memoryCount}
                onNavigateMemory={onNavigateMemory}
                onRequestClearMemories={() => setIsClearMemoriesModalOpen(true)}
              />
            </SettingsSection>

            {/* 4. Hardware & Permissions */}
            <SettingsSection
              title="Hardware & Permissions"
              description="Audio input devices for speech recognition"
            >
              <MicrophoneSettings
                state={micState}
                onOpenSettings={openMicSettings}
              />
            </SettingsSection>

            {/* 5. Privacy & Data Controls */}
            <SettingsSection
              title="Privacy & Data Transparency"
              description="Understand how your data is handled on this device"
            >
              <PrivacySettings
                onRequestClearAllData={() => setIsClearAllDataModalOpen(true)}
              />
            </SettingsSection>

            {/* 6. About */}
            <SettingsSection
              title="About Calby"
              description="Application and build information"
            >
              <AboutSettings systemInfo={systemInfo} />
            </SettingsSection>
          </>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmDangerModal
        isOpen={isClearMemoriesModalOpen}
        title="Clear All Saved Memories?"
        description="This will permanently delete all personal facts, notes, and preferences stored in Calby's local memory on this device. This action cannot be undone."
        confirmButtonText="Clear Memories"
        isSubmitting={isProcessing}
        onClose={() => setIsClearMemoriesModalOpen(false)}
        onConfirm={handleConfirmClearMemories}
      />

      <ConfirmDangerModal
        isOpen={isClearAllDataModalOpen}
        title="Clear All Local Data & Connections?"
        description="This will permanently delete all saved personal memories, scheduled reminders, encrypted Gemini credentials, and Google Calendar tokens from this device. Calby will be reset to its initial state."
        confirmButtonText="Delete Everything"
        isSubmitting={isProcessing}
        onClose={() => setIsClearAllDataModalOpen(false)}
        onConfirm={handleConfirmClearAllData}
      />
    </div>
  )
}
