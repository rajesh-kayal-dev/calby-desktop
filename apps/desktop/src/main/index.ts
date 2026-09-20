import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows/main.window'
import { registerSystemIpcHandlers } from './ipc/system.ipc'
import { registerAuthIpcHandlers } from './ipc/auth.ipc'
import { registerOnboardingIpcHandlers } from './ipc/onboarding.ipc'

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows notifications
  electronApp.setAppUserModelId('com.calby.desktop')

  // Default open or close DevTools by F12 in development and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all main process IPC handlers
  registerSystemIpcHandlers()
  registerAuthIpcHandlers()
  registerOnboardingIpcHandlers()

  // Create main application window
  createMainWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
