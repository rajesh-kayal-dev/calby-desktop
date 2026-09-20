import { BrowserWindow, shell } from 'electron'

/**
 * Configure secure window event handlers to enforce Calby security boundaries.
 * - Restrict window opening to external browser shell for trusted protocols only
 * - Prevent untrusted in-app webviews or navigation
 */
export const setupSecurityHandlers = (window: BrowserWindow): void => {
  // Prevent untrusted window creation from renderer
  window.webContents.setWindowOpenHandler((details) => {
    // Open external HTTPS URLs in the user's default browser
    if (details.url.startsWith('https://')) {
      shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  // Prevent unwanted in-app navigation
  window.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.origin !== window.webContents.getURL()) {
      event.preventDefault()
    }
  })
}
