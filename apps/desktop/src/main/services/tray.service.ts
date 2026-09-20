import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { setQuitting } from '../windows/main.window'

// 16x16 RGBA PNG data URL representing the Calby cyan orb icon
const TRAY_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAkSURBVDhPY/wPBAwUACYoTfQxDJBAM5gGmgcMDAwGjEYDYgAADrICqX/G/1cAAAAASUVORK5CYII='

export class TrayService {
  private static instance: TrayService | null = null
  private tray: Tray | null = null
  private mainWindow: BrowserWindow | null = null

  private constructor() {}

  public static getInstance(): TrayService {
    if (!TrayService.instance) {
      TrayService.instance = new TrayService()
    }
    return TrayService.instance
  }

  public init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow

    try {
      const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL)
      this.tray = new Tray(icon)
      this.tray.setToolTip('Calby')

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Open Calby',
          click: (): void => {
            this.showAndFocus()
            this.broadcastNavigation({ view: 'home' })
          }
        },
        {
          label: 'Settings & Privacy',
          click: (): void => {
            this.showAndFocus()
            this.broadcastNavigation({ view: 'settings' })
          }
        },
        { type: 'separator' },
        {
          label: 'Quit Calby',
          click: (): void => {
            setQuitting(true)
            app.quit()
          }
        }
      ])

      this.tray.setContextMenu(contextMenu)

      this.tray.on('click', () => {
        this.showAndFocus()
      })
      this.tray.on('double-click', () => {
        this.showAndFocus()
      })
    } catch (err) {
      console.warn('[TrayService] Could not create system tray icon:', err)
    }
  }

  public showAndFocus(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show()
      }
      this.mainWindow.focus()
    }
  }

  public broadcastNavigation(payload: { view: string; reminderId?: string }): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('system:navigate', payload)
    }
  }

  public destroy(): void {
    if (this.tray) {
      try {
        this.tray.destroy()
      } catch (err) {
        console.warn('[TrayService] Error destroying tray:', err)
      }
      this.tray = null
    }
  }
}
