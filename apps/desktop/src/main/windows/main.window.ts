import { BrowserWindow, app } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { setupSecurityHandlers } from '../security'

const WINDOW_CONFIG = {
  WIDTH: 1024,
  HEIGHT: 720,
  MIN_WIDTH: 800,
  MIN_HEIGHT: 600,
  BG_COLOR: '#10131a'
} as const

const getPreloadPath = (): string => {
  const cjsPath = join(__dirname, '../preload/index.cjs')
  if (existsSync(cjsPath)) {
    return cjsPath
  }
  const jsPath = join(__dirname, '../preload/index.js')
  if (existsSync(jsPath)) {
    return jsPath
  }
  return join(__dirname, '../preload/index.mjs')
}

export const createMainWindow = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.WIDTH,
    height: WINDOW_CONFIG.HEIGHT,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: WINDOW_CONFIG.BG_COLOR,
    title: app.getName() || 'Calby',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  setupSecurityHandlers(mainWindow)

  // Load the remote URL for development or local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
