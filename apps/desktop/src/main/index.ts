import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows/main.window'
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
import { ReminderService } from './services/reminder.service'
import { GoogleCalendarService } from './services/google-calendar.service'
import { MemoryService } from './services/memory.service'
import { SettingsService } from './services/settings.service'
import { closeDatabase } from './storage/database'

export {
  CredentialService,
  AiVoiceService,
  ReminderService,
  GoogleCalendarService,
  MemoryService,
  SettingsService
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows notifications
  electronApp.setAppUserModelId('com.calby.desktop')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all system IPC handlers
  registerSystemIpcHandlers()
  registerAuthIpcHandlers()
  registerOnboardingIpcHandlers()
  registerVoiceIpcHandlers()
  registerRemindersIpc()
  registerCalendarIpc()
  registerMemoryIpc()
  registerSettingsIpc()

  // Create main application window
  createMainWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
