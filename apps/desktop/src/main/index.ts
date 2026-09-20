import { app, BrowserWindow, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow, setQuitting } from './windows/main.window'
import { registerSystemIpcHandlers } from './ipc/system.ipc'
import { registerAuthIpcHandlers } from './ipc/auth.ipc'
import { registerOnboardingIpcHandlers } from './ipc/onboarding.ipc'
import { registerVoiceIpcHandlers } from './ipc/voice.ipc'
import { registerRemindersIpc } from './ipc/reminders.ipc'
import { registerCalendarIpc } from './ipc/calendar.ipc'
import { registerMemoryIpc } from './ipc/memory.ipc'
import { registerSettingsIpc } from './ipc/settings.ipc'
import { CredentialService } from './services/credential.service'
import { AiVoiceService } from './services/ai-voice.service'
import { ActionExecutor } from './services/action-executor'
import { ReminderService } from './services/reminder.service'
import { GoogleCalendarService } from './services/google-calendar.service'
import { MemoryService } from './services/memory.service'
import { SettingsService } from './services/settings.service'
import { TrayService } from './services/tray.service'
import { closeDatabase } from './storage/database'

export {
  CredentialService,
  AiVoiceService,
  ActionExecutor,
  ReminderService,
  GoogleCalendarService,
  MemoryService,
  SettingsService,
  TrayService
}

let mainWindow: BrowserWindow | null = null

export function handleGlobalActivationShortcut(): void {
  console.log('[Main] Global shortcut CommandOrControl+Shift+Space triggered')
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
  MemoryService,
  SettingsService,
  CredentialService,
  handleGlobalActivationShortcut
}

// 1. Enforce Single-Instance Application Lock
const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  console.log('[Main] Another Calby instance is already running. Exiting.')
  app.quit()
} else {

  app.on('second-instance', () => {
    // When a second instance attempts to launch, focus and restore the primary window
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

    // Create main application window
    mainWindow = createMainWindow()

    // Initialize System Tray
    TrayService.getInstance().init(mainWindow)

    // Register Fixed Global Activation Shortcut
    try {
      const registered = globalShortcut.register(
        'CommandOrControl+Shift+Space',
        handleGlobalActivationShortcut
      )

      if (!registered) {
        console.warn('[Main] Global shortcut CommandOrControl+Shift+Space registration failed')
      }
    } catch (err) {
      console.warn('[Main] Error registering global shortcut:', err)
    }

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
        TrayService.getInstance().init(mainWindow)
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        if (!mainWindow.isVisible()) mainWindow.show()
        mainWindow.focus()
      }
    })
  })

  app.on('will-quit', () => {
    try {
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
