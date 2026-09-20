import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows/main.window'
import { registerSystemIpcHandlers } from './ipc/system.ipc'
import { registerAuthIpcHandlers } from './ipc/auth.ipc'
import { registerOnboardingIpcHandlers } from './ipc/onboarding.ipc'
import { registerVoiceIpcHandlers } from './ipc/voice.ipc'
import { registerRemindersIpc } from './ipc/reminders.ipc'
import { registerCalendarIpc } from './ipc/calendar.ipc'
import { CredentialService } from './services/credential.service'
import { AiVoiceService } from './services/ai-voice.service'
import { ReminderService } from './services/reminder.service'
import { GoogleCalendarService } from './services/google-calendar.service'
import { closeDatabase } from './storage/database'

export { CredentialService, AiVoiceService, ReminderService, GoogleCalendarService }

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows notifications
  electronApp.setAppUserModelId('com.calby.desktop')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Reminder Service and local SQLite database
  ReminderService.getInstance().init()

  // Register all main process IPC handlers
  registerSystemIpcHandlers()
  registerAuthIpcHandlers()
  registerOnboardingIpcHandlers()
  registerVoiceIpcHandlers()
  registerRemindersIpc()
  registerCalendarIpc()

  // Create main application window
  createMainWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('before-quit', () => {
  closeDatabase()
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})