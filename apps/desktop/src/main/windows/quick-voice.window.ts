import { BrowserWindow, screen } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { setupSecurityHandlers } from '../security'
import { resolveAssetPath } from '../services/sound-resolver'
import { notifyVoiceOwnerChanged, setVoiceOwner } from '../services/voice-owner'

const WINDOW_CONFIG = {
  WIDTH: 420,
  HEIGHT: 105
} as const

/** Distance from the top/right edge of the work area. */
const SCREEN_MARGIN = 24
const ROUTE = '/quick-voice'
/**
 * Ignore main-window focus/show events fired right after opening so the
 * freshly shown Quick Voice window can't close itself.
 */
const FOCUS_YIELD_GUARD_MS = 600

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

/**
 * Single-instance manager for the floating Quick Voice overlay.
 *
 * While it is open it also owns the voice session (mic + Gemini Live events),
 * so the main window can never capture audio or play back responses twice.
 */
export class QuickVoiceWindowManager {
  private static instance: QuickVoiceWindowManager | null = null
  private quickVoiceWindow: BrowserWindow | null = null
  private mainWindow: BrowserWindow | null = null
  private openedAt = 0
  private yieldListener: (() => void) | null = null

  private constructor() {}

  public static getInstance(): QuickVoiceWindowManager {
    if (!QuickVoiceWindowManager.instance) {
      QuickVoiceWindowManager.instance = new QuickVoiceWindowManager()
    }
    return QuickVoiceWindowManager.instance
  }

  /** Called whenever the main window is (re)created so ownership can be reset. */
  public attachMainWindow(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    if (!this.isOpen()) {
      setVoiceOwner(mainWindow.webContents.id)
      notifyVoiceOwnerChanged()
    }
  }

  public isOpen(): boolean {
    return Boolean(this.quickVoiceWindow) && !this.quickVoiceWindow!.isDestroyed()
  }

  public getWebContentsId(): number | null {
    return this.isOpen() ? this.quickVoiceWindow!.webContents.id : null
  }

  /**
   * Opens the Quick Voice window, or focuses the existing one. Safe to call as
   * often as the global shortcut fires — it never creates a second window.
   */
  public open(): BrowserWindow {
    if (this.isOpen()) {
      const existing = this.quickVoiceWindow!
      if (existing.isMinimized()) existing.restore()
      existing.showInactive()
      existing.focus()
      return existing
    }

    const bounds = this.computeBounds()
    const window = new BrowserWindow({
      width: WINDOW_CONFIG.WIDTH,
      height: WINDOW_CONFIG.HEIGHT,
      x: bounds.x,
      y: bounds.y,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      hasShadow: true,
      autoHideMenuBar: true,
      title: 'Calby Quick Voice',
      icon: resolveAssetPath('icon.png') || undefined,
      webPreferences: {
        preload: getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        backgroundThrottling: false
      }
    })

    this.quickVoiceWindow = window
    this.openedAt = Date.now()

    // Quick Voice becomes the single owner of the mic + Gemini Live session.
    setVoiceOwner(window.webContents.id)
    notifyVoiceOwnerChanged()

    setupSecurityHandlers(window)

    window.on('ready-to-show', () => {
      if (window.isDestroyed()) return
      window.show()
      window.focus()
    })

    // Safety net: transparent windows can paint late; never leave the overlay
    // invisible and undismissable.
    window.webContents.on('did-finish-load', () => {
      if (window.isDestroyed() || window.isVisible()) return
      window.show()
      window.focus()
    })

    window.on('closed', () => {
      // Only the current overlay may hand ownership back; a stale close event
      // from an already-replaced window must not steal the active session.
      if (this.quickVoiceWindow !== window) return

      this.quickVoiceWindow = null
      this.detachYieldListener()

      const main = this.mainWindow
      if (main && !main.isDestroyed()) {
        setVoiceOwner(main.webContents.id)
      } else {
        setVoiceOwner(null)
      }
      notifyVoiceOwnerChanged()
    })

    this.attachYieldListener()

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      void window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${ROUTE}`)
    } else {
      void window.loadFile(join(__dirname, '../renderer/index.html'), { hash: ROUTE })
    }

    return window
  }

  public close(): void {
    if (this.isOpen() && !this.quickVoiceWindow!.isDestroyed()) {
      this.quickVoiceWindow!.close()
    }
  }

  /**
   * Returns to the existing Calby settings screen; the overlay never hosts a
   * second settings UI of its own.
   */
  public openVoiceSettings(): void {
    const main = this.mainWindow
    this.close()

    if (!main || main.isDestroyed()) return
    if (main.isMinimized()) main.restore()
    if (!main.isVisible()) main.show()
    main.focus()
    main.webContents.send('system:navigate', { view: 'settings', settingsSection: 'voice' })
  }

  /** Positions the overlay near the top-right of the display with the cursor. */
  private computeBounds(): { x: number; y: number } {
    try {
      const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
      const area = display.workArea
      return {
        x: Math.round(area.x + area.width - WINDOW_CONFIG.WIDTH - SCREEN_MARGIN),
        y: Math.round(area.y + SCREEN_MARGIN)
      }
    } catch {
      return { x: SCREEN_MARGIN, y: SCREEN_MARGIN }
    }
  }

  /**
   * Returning to the full Calby window leaves Quick Voice mode, so the overlay
   * yields instead of holding the microphone in the background.
   */
  private attachYieldListener(): void {
    const main = this.mainWindow
    if (!main || main.isDestroyed()) return

    const handler = (): void => {
      if (!this.isOpen()) return
      if (Date.now() - this.openedAt < FOCUS_YIELD_GUARD_MS) return
      this.close()
    }

    main.on('focus', handler)
    main.on('show', handler)
    this.yieldListener = () => {
      if (!main.isDestroyed()) {
        main.removeListener('focus', handler)
        main.removeListener('show', handler)
      }
    }
  }

  private detachYieldListener(): void {
    if (this.yieldListener) {
      this.yieldListener()
      this.yieldListener = null
    }
  }
}
