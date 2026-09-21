import { useState, useEffect, type FC } from 'react'
import type { GeneralSettings } from '../types'

interface GeneralSettingsProps {
  generalSettings?: GeneralSettings
  onUpdate: (data: Partial<GeneralSettings>) => Promise<boolean>
  onOpenNotificationSettings: () => void
}

export const GeneralSettingsComponent: FC<GeneralSettingsProps> = ({
  generalSettings,
  onUpdate,
  onOpenNotificationSettings
}) => {
  const [startWithComputer, setStartWithComputer] = useState(generalSettings?.startWithComputer ?? true)
  const [keepRunning, setKeepRunning] = useState(generalSettings?.keepRunningInBackground ?? true)
  const [closeToTray, setCloseToTray] = useState(generalSettings?.closeToTray ?? true)
  const [allowNotifications, setAllowNotifications] = useState(generalSettings?.allowDesktopNotifications ?? true)

  useEffect(() => {
    if (generalSettings) {
      if (typeof generalSettings.startWithComputer === 'boolean') setStartWithComputer(generalSettings.startWithComputer)
      if (typeof generalSettings.keepRunningInBackground === 'boolean') setKeepRunning(generalSettings.keepRunningInBackground)
      if (typeof generalSettings.closeToTray === 'boolean') setCloseToTray(generalSettings.closeToTray)
      if (typeof generalSettings.allowDesktopNotifications === 'boolean') setAllowNotifications(generalSettings.allowDesktopNotifications)
    }
  }, [generalSettings])

  const handleToggle = async (key: keyof GeneralSettings, currentVal: boolean) => {
    const newVal = !currentVal
    if (key === 'startWithComputer') setStartWithComputer(newVal)
    if (key === 'keepRunningInBackground') setKeepRunning(newVal)
    if (key === 'closeToTray') setCloseToTray(newVal)
    if (key === 'allowDesktopNotifications') setAllowNotifications(newVal)

    await onUpdate({ [key]: newVal })
  }

  return (
    <div data-testid="general-settings" className="space-y-6">
      {/* ── App behavior ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          App behavior
        </h3>

        <div className="space-y-2">
          {/* Start Calby with computer */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                Start Calby with your computer
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Automatically open Calby when you log into your system.
              </p>
            </div>
            <button
              type="button"
              data-testid="toggle-start-with-computer"
              onClick={() => void handleToggle('startWithComputer', startWithComputer)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                startWithComputer ? 'bg-[#2563EB]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  startWithComputer ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Keep running in background */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                Keep Calby running in background
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Maintain voice listening readiness and global hotkeys.
              </p>
            </div>
            <button
              type="button"
              data-testid="toggle-keep-running"
              onClick={() => void handleToggle('keepRunningInBackground', keepRunning)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                keepRunning ? 'bg-[#2563EB]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  keepRunning ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Close to tray */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                Close to tray
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Minimize to the system tray instead of exiting when closing the main window.
              </p>
            </div>
            <button
              type="button"
              data-testid="toggle-close-to-tray"
              onClick={() => void handleToggle('closeToTray', closeToTray)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                closeToTray ? 'bg-[#2563EB]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  closeToTray ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Notifications
        </h3>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
                Allow desktop notifications
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
                Receive desktop banners for reminders and upcoming schedule alerts.
              </p>
            </div>
            <button
              type="button"
              data-testid="toggle-allow-notifications"
              onClick={() => void handleToggle('allowDesktopNotifications', allowNotifications)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                allowNotifications ? 'bg-[#2563EB]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  allowNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            data-testid="open-system-notifications-button"
            onClick={onOpenNotificationSettings}
            className="flex items-center gap-2 text-xs text-[#38BDF8] hover:text-[#7dd3fc] font-medium transition-colors cursor-pointer"
          >
            <span>Open system notification settings</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Offline ── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Offline
        </h3>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
            ✓
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              Your memories and reminders are available even when you&apos;re offline.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ds-text-secondary)' }}>
              Calby is local-first. Reminders and saved memories stay accessible on your device without an active internet connection. Gemini AI capabilities re-enable automatically when online.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
