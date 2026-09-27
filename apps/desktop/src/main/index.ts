import { app, BrowserWindow, globalShortcut } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

function tryLoadEnv(): void {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/desktop/.env'),
    path.resolve(app.getAppPath(), '.env')
  ]
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8')
        for (const line of content.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx !== -1) {
            const k = trimmed.slice(0, eqIdx).trim()
            const v = trimmed.slice(eqIdx + 1).trim()
            if (!process.env[k]) {
              process.env[k] = v
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }
}
tryLoadEnv()
// Ensure Gemini API key is always read from CredentialService and not env vars
delete process.env.GEMINI_API_KEY

import { electronApp, optimizer } from '@electron-toolkit/utils'
import { ACTIVATION_SHORTCUT } from '../shared/quick-voice'
import { createMainWindow, setQuitting } from './windows/main.window'
import { registerSystemIpcHandlers } from './ipc/system.ipc'
import { registerAuthIpcHandlers } from './ipc/auth.ipc'
import { registerOnboardingIpcHandlers } from './ipc/onboarding.ipc'
import { registerVoiceIpcHandlers } from './ipc/voice.ipc'
import { registerRemindersIpc } from './ipc/reminders.ipc'
import { registerCalendarIpc } from './ipc/calendar.ipc'
import { registerMemoryIpc } from './ipc/memory.ipc'
import { registerSettingsIpc } from './ipc/settings.ipc'
import { registerQuickVoiceIpcHandlers } from './ipc/quickvoice.ipc'
import { CredentialService } from './services/credential.service'
import { AiVoiceService } from './services/ai-voice.service'
import { ActionExecutor } from './services/action-executor'
import { ReminderService } from './services/reminder.service'
import { GoogleCalendarService } from './services/google-calendar.service'
import { MemoryService } from './services/memory.service'
import { SettingsService } from './services/settings.service'
import { TrayService } from './services/tray.service'
import { ConfigService } from './services/config.service'
import { getVoiceOwnerId, isVoiceOwner } from './services/voice-owner'
import {
  applyQuickVoiceShortcut,
  unregisterQuickVoiceShortcut
} from './services/quick-voice-shortcut'
import { ReminderAlarmWindowManager } from './windows/alarm.window'
import { QuickVoiceWindowManager } from './windows/quick-voice.window'
import { closeDatabase } from './storage/database'

export {
  CredentialService,
  AiVoiceService,
  ActionExecutor,
  ReminderService,
  ReminderAlarmWindowManager,
  QuickVoiceWindowManager,
  GoogleCalendarService,
  MemoryService,
  SettingsService,
  TrayService
}

let mainWindow: BrowserWindow | null = null

export function handleGlobalActivationShortcut(): void {
  console.log('[Main] Global shortcut CommandOrControl+Shift+Space triggered')

  // Quick Voice already owns the shared Gemini Live session. Do not reveal the
  // full window and race it for the microphone when the legacy shortcut is
  // pressed during a Quick Voice turn.
  if (QuickVoiceWindowManager.getInstance().isOpen()) {
    QuickVoiceWindowManager.getInstance().open()
    return
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
    mainWindow.focus()

    // Trigger listening flow if safely in idle state
    const voiceService = AiVoiceService.getInstance()
    const stateInfo = voiceService.getState()
    if (stateInfo.state === 'idle') {
      void voiceService.startSession()
    }
  }
}

// Global registry for deterministic main-process testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).__calby = {
  ActionExecutor,
  GoogleCalendarService,
  TrayService,
  AiVoiceService,
  ReminderService,
  ReminderAlarmWindowManager,
  MemoryService,
  SettingsService,
  CredentialService,
  QuickVoiceWindowManager,
  voiceOwner: { getOwnerId: getVoiceOwnerId, isOwner: isVoiceOwner },
  handleGlobalActivationShortcut
}

// 1. Enforce Single-Instance Application Lock
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  console.log('[Main] Another Calby instance is already running. Exiting.')
  app.quit()
} else {

  app.on('second-instance', (_event, commandLine) => {
    console.log('[Main] Second instance detected with command line:', commandLine)
    const args = Array.isArray(commandLine) ? commandLine : []
    const triggerIndex = args.findIndex((arg) => arg === '--trigger-reminder')
    if (triggerIndex !== -1 && args[triggerIndex + 1]) {
      const reminderId = args[triggerIndex + 1]
      console.log('[Main] Second instance forwarded reminder trigger for ID:', reminderId)
      void ReminderService.getInstance().onReminderDue(reminderId)
      return
    }

    // When a second instance attempts to launch normally, focus and restore the primary window
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
    }
  })

  // Electron has finished initialization
  app.whenReady().then(() => {
    // Set app user model id for windows notifications
    electronApp.setAppUserModelId('com.calby.desktop')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Register all IPC handlers
    registerSystemIpcHandlers()
    registerAuthIpcHandlers()
    registerOnboardingIpcHandlers()
    registerVoiceIpcHandlers()
    registerRemindersIpc()
    registerCalendarIpc()
    registerMemoryIpc()
    registerSettingsIpc()
    registerQuickVoiceIpcHandlers()

    // Check if launched by Windows Task Scheduler for a specific reminder
    const triggerIndex = process.argv.findIndex((arg) => arg === '--trigger-reminder')
    const isTriggerLaunch = triggerIndex !== -1 && Boolean(process.argv[triggerIndex + 1])
    const triggerReminderId = isTriggerLaunch ? process.argv[triggerIndex + 1] : null

    // Create main application window
    mainWindow = createMainWindow()

    // Initialize System Tray
    TrayService.getInstance().init(mainWindow)

    // Quick Voice overlay: register the main window so ownership can be handed
    // back and forth between it and the floating window.
    QuickVoiceWindowManager.getInstance().attachMainWindow(mainWindow)

    // Initialize Reminder Service and Scheduler (reconciles missed reminders & wake tasks)
    ReminderService.getInstance().init()

    if (isTriggerLaunch && triggerReminderId) {
      console.log('[Main] App started via Task Scheduler with trigger for ID:', triggerReminderId)
      // When woke up strictly for a reminder, keep main window in tray
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide()
      }
      setTimeout(() => {
        void ReminderService.getInstance().onReminderDue(triggerReminderId)
      }, 400)
    }

    // Register Fixed Global Activation Shortcut
    try {
      const registered = globalShortcut.register(ACTIVATION_SHORTCUT, handleGlobalActivationShortcut)

      if (!registered) {
        console.warn('[Main] Global activation shortcut registration failed')
      }
    } catch (err) {
      console.warn('[Main] Error registering global shortcut:', err)
    }

    // Register the Quick Voice shortcut (exactly one binding, from config).
    const quickVoiceShortcut = applyQuickVoiceShortcut(
      ConfigService.getInstance().getGeneralSettings().quickVoiceShortcut
    )
    if (!quickVoiceShortcut.ok) {
      console.warn('[Main] Quick Voice shortcut unavailable:', quickVoiceShortcut.reason)
    }

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
        TrayService.getInstance().init(mainWindow)
        QuickVoiceWindowManager.getInstance().attachMainWindow(mainWindow)
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        if (!mainWindow.isVisible()) mainWindow.show()
        mainWindow.focus()
      }
    })
  })

  app.on('will-quit', () => {
    try {
      unregisterQuickVoiceShortcut()
      globalShortcut.unregisterAll()
    } catch (err) {
      console.warn('[Main] Error unregistering global shortcuts:', err)
    }
    TrayService.getInstance().destroy()
  })

  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      // macOS standard behavior
    }
  })

  app.on('before-quit', () => {
    setQuitting(true)
    closeDatabase()
  })
}
