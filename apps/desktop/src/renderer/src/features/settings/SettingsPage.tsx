import { useState, type FC, type ReactNode } from 'react'
import { useSettings } from './hooks/useSettings'
import { GeneralSettingsComponent } from './components/GeneralSettings'
import { PersonalizeSettingsComponent } from './components/PersonalizeSettings'
import { GeminiSettings } from './components/GeminiSettings'
import { VoiceMicrophoneSettings } from './components/VoiceMicrophoneSettings'
import { RemindersSettingsComponent } from './components/RemindersSettings'
import { ConnectSettingsComponent } from './components/ConnectSettings'
import { PrivacySettings } from './components/PrivacySettings'
import { AboutSettings } from './components/AboutSettings'
import { SignOutResetSection } from './components/SignOutResetSection'
import { ConfirmDangerModal } from './components/ConfirmDangerModal'

type SettingsSectionId = 'general' | 'ai' | 'personalize' | 'voice' | 'reminders' | 'connect' | 'privacy' | 'about'

interface SettingsPageProps {
  onResetSetup?: () => void
  onNavigateHome?: () => void
  onNavigateMemory?: () => void
  onNavigateCalendar?: () => void
  onNavigateReminders?: () => void
}

// ── Stroke icons ───────────────────────────────────────────────────────────

const SlidersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
)

const AiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    <path d="M19 2L20.25 5.75L24 7L20.25 8.25L19 12L17.75 8.25L14 7L17.75 5.75L19 2Z" />
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const VoiceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

const ConnectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const AlertCircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

// ── Sidebar items ──────────────────────────────────────────────────────────

interface SidebarItem {
  id: SettingsSectionId
  label: string
  icon: () => ReactNode
  legacyTestId?: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'general', label: 'General', icon: SlidersIcon },
  { id: 'ai', label: 'AI', icon: AiIcon },
  { id: 'personalize', label: 'Personalize', icon: UserIcon },
  { id: 'voice', label: 'Voice & Microphone', icon: VoiceIcon },
  { id: 'reminders', label: 'Reminders', icon: BellIcon, legacyTestId: 'settings-nav-reminders-button' },
  { id: 'connect', label: 'Connect', icon: ConnectIcon, legacyTestId: 'settings-nav-calendar-button' },
  { id: 'privacy', label: 'Privacy', icon: ShieldIcon, legacyTestId: 'settings-nav-memory-button' },
  { id: 'about', label: 'About', icon: InfoIcon }
]

// ── Section card wrapper ───────────────────────────────────────────────────

const SectionCard = ({ children }: { children: ReactNode }) => (
  <div
    className="rounded-xl overflow-hidden p-6"
    style={{ backgroundColor: 'var(--ds-surface-card)', border: '1px solid var(--ds-border-subtle)' }}
  >
    {children}
  </div>
)

export const SettingsPage: FC<SettingsPageProps> = ({
  onResetSetup,
  onNavigateHome,
  onNavigateMemory,
  onNavigateCalendar,
  onNavigateReminders
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general')
  const [isClearMemoriesModalOpen, setIsClearMemoriesModalOpen] = useState(false)
  const [isClearAllDataModalOpen, setIsClearAllDataModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    authStatus,
    calendarStatus,
    micState,
    memoryCount,
    systemInfo,
    config,
    isLoading,
    actionError,
    actionSuccess,
    setActionSuccess,
    setActionError,
    updateGeneralSettings,
    openNotificationSettings,
    updatePersonalize,
    updateVoiceSettings,
    updateReminderSettings,
    connectCalendar,
    disconnectCalendar,
    clearMemories,
    clearAllData,
    openMicSettings,
    refresh
  } = useSettings(onResetSetup)

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

  const sectionMeta: Record<SettingsSectionId, { title: string; subtitle: string }> = {
    general: { title: 'General', subtitle: 'Simple app-level preferences and notification controls.' },
    ai: { title: 'AI', subtitle: 'Gemini powers Calby\'s understanding and voice assistant.' },
    personalize: { title: 'Personalize', subtitle: 'Make Calby feel more like your assistant.' },
    voice: { title: 'Voice & Microphone', subtitle: 'Choose how Calby sounds and which microphone it listens to.' },
    reminders: { title: 'Reminders', subtitle: 'Choose how Calby reminds you.' },
    connect: { title: 'Connect', subtitle: 'Connect your Google Calendar and external integrations.' },
    privacy: { title: 'Privacy', subtitle: 'Understand what Calby stores and what stays on your device.' },
    about: { title: 'About', subtitle: 'Your personal desktop voice assistant.' }
  }

  const { title, subtitle } = sectionMeta[activeSection]

  const renderActiveSection = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-5 h-5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono" style={{ color: 'var(--ds-text-muted)' }}>Loading settings...</p>
        </div>
      )
    }

    switch (activeSection) {
      case 'general':
        return (
          <SectionCard>
            <GeneralSettingsComponent
              generalSettings={config?.general}
              onUpdate={updateGeneralSettings}
              onOpenNotificationSettings={openNotificationSettings}
            />
          </SectionCard>
        )

      case 'personalize':
        return (
          <SectionCard>
            <PersonalizeSettingsComponent
              personalize={config?.personalize}
              onSave={updatePersonalize}
            />
          </SectionCard>
        )

      case 'ai':
        return (
          <SectionCard>
            <GeminiSettings
              authStatus={authStatus}
              onKeyUpdated={() => {
                void refresh()
                setActionSuccess('Gemini API key updated successfully.')
              }}
            />
          </SectionCard>
        )

      case 'voice':
        return (
          <SectionCard>
            <VoiceMicrophoneSettings
              voiceSettings={config?.voice}
              micState={micState}
              onUpdateVoice={updateVoiceSettings}
              onOpenMicSettings={openMicSettings}
            />
          </SectionCard>
        )

      case 'reminders':
        return (
          <SectionCard>
            <RemindersSettingsComponent
              remindersSettings={config?.reminders}
              onUpdate={updateReminderSettings}
            />
          </SectionCard>
        )

      case 'connect':
        return (
          <SectionCard>
            <ConnectSettingsComponent
              status={calendarStatus}
              onConnect={connectCalendar}
              onDisconnect={disconnectCalendar}
            />
          </SectionCard>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <SectionCard>
              <PrivacySettings
                memoryCount={memoryCount}
                onNavigateMemory={onNavigateMemory}
                onRequestClearMemories={() => setIsClearMemoriesModalOpen(true)}
                onRequestClearAllData={() => setIsClearAllDataModalOpen(true)}
              />
            </SectionCard>

            <SignOutResetSection onTriggerReset={() => setIsClearAllDataModalOpen(true)} />
          </div>
        )

      case 'about':
        return (
          <SectionCard>
            <AboutSettings systemInfo={systemInfo} />
          </SectionCard>
        )

      default:
        return null
    }
  }

  return (
    <div
      data-testid="settings-page"
      className="flex-1 flex overflow-hidden select-none"
      style={{ backgroundColor: 'var(--ds-canvas-base)', color: 'var(--ds-text-primary)' }}
    >

      {/* ── Left Sidebar ── */}
      <aside
        className="w-60 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ backgroundColor: 'var(--ds-canvas-base)', borderRightColor: 'var(--ds-border-subtle)' }}
      >
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
              Settings
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
              Preferences
            </p>
          </div>
          {onNavigateHome && (
            <button
              type="button"
              data-testid="back-to-home-button"
              onClick={onNavigateHome}
              aria-label="Back to Home"
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1" aria-label="Settings sections">
          {SIDEBAR_ITEMS.map(({ id, label, icon: Icon, legacyTestId }) => {
            const isActive = activeSection === id

            return (
              <button
                key={id}
                type="button"
                data-testid={`settings-nav-${id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (id === 'privacy' && onNavigateMemory) {
                    setActiveSection('privacy')
                  } else if (id === 'connect' && onNavigateCalendar && legacyTestId === 'settings-nav-calendar-button') {
                    setActiveSection('connect')
                  } else if (id === 'reminders' && onNavigateReminders && legacyTestId === 'settings-nav-reminders-button') {
                    setActiveSection('reminders')
                  } else {
                    setActiveSection(id)
                  }
                }}
                className={[
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-[#2563EB] text-white font-medium shadow-sm'
                    : 'hover:bg-white/5 text-[#94A3B8] hover:text-[#F8FAFC]',
                ].join(' ')}
              >
                <span className={isActive ? 'text-white' : 'text-[#64748B]'}>
                  <Icon />
                </span>
                <span className="text-sm leading-tight truncate">{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-3 pb-4 mt-4">
          <button
            type="button"
            data-testid="sign-out-reset-button"
            onClick={() => setIsClearAllDataModalOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer hover:bg-red-500/10 text-[#94A3B8] hover:text-red-400 group"
          >
            <span className="text-[#64748B] group-hover:text-red-400 transition-colors">
              <LogOutIcon />
            </span>
            <span className="text-sm leading-tight truncate">Sign out & reset</span>
          </button>
        </div>
      </aside>

      {/* ── Right Main Content Panel ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content header */}
        <div className="px-8 pt-6 pb-4 shrink-0 border-b border-white/5">
          <h2
            className="font-semibold tracking-tight"
            style={{ fontSize: 'var(--ds-text-headline-lg)', lineHeight: '32px', color: 'var(--ds-text-primary)' }}
          >
            {title}
          </h2>
          <p className="mt-0.5" style={{ fontSize: 'var(--ds-text-body-md)', color: 'var(--ds-text-secondary)' }}>
            {subtitle}
          </p>
        </div>

        {/* Action feedback toast alerts */}
        {(actionError || actionSuccess) && (
          <div className="px-8 pt-4 space-y-2 shrink-0">
            {actionError && (
              <div
                data-testid="settings-error-alert"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#EF4444'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircleIcon />
                  <span>{actionError}</span>
                </div>
                <button
                  type="button"
                  data-testid="close-error-alert-button"
                  onClick={() => setActionError?.(null)}
                  className="p-1 rounded-md text-red-400 hover:text-white hover:bg-red-500/20 transition-colors cursor-pointer"
                  title="Dismiss alert"
                >
                  <XIcon />
                </button>
              </div>
            )}
            {actionSuccess && (
              <div
                data-testid="settings-success-alert"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: '#10B981'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircleIcon />
                  <span>{actionSuccess}</span>
                </div>
                <button
                  type="button"
                  data-testid="close-success-alert-button"
                  onClick={() => setActionSuccess(null)}
                  className="p-1 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  title="Dismiss alert"
                >
                  <XIcon />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active section content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl">
            {renderActiveSection()}
          </div>
        </div>
      </main>

      {/* Confirmation modals */}
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
