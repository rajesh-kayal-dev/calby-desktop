import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { is } from '@electron-toolkit/utils'
import type { Reminder } from '../storage/reminder.repository'
import { setupSecurityHandlers } from '../security'

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

export class ReminderAlarmWindowManager {
  private static instance: ReminderAlarmWindowManager | null = null
  private alarmWindow: BrowserWindow | null = null
  private activeReminder: Reminder | null = null
  private isMissed: boolean = false

  private constructor() {}

  public static getInstance(): ReminderAlarmWindowManager {
    if (!ReminderAlarmWindowManager.instance) {
      ReminderAlarmWindowManager.instance = new ReminderAlarmWindowManager()
    }
    return ReminderAlarmWindowManager.instance
  }

  public getActiveReminder(): { reminder: Reminder | null; isMissed: boolean } {
    return { reminder: this.activeReminder, isMissed: this.isMissed }
  }

  /**
   * Creates or shows the dedicated separate Alarm window.
   * Completely independent of the main Calby window lifecycle.
   */
  public showAlarmWindow(reminder: Reminder, isMissed = false): BrowserWindow {
    this.activeReminder = reminder
    this.isMissed = isMissed

    if (this.alarmWindow && !this.alarmWindow.isDestroyed()) {
      if (this.alarmWindow.isMinimized()) {
        this.alarmWindow.restore()
      }
      this.alarmWindow.show()
      this.alarmWindow.setAlwaysOnTop(true, 'screen-saver')
      this.alarmWindow.focus()
      this.alarmWindow.webContents.send('reminders:alarm-data', { reminder, isMissed })
      return this.alarmWindow
    }

    const window = new BrowserWindow({
      width: 440,
      height: 520,
      resizable: false,
      frame: false,
      center: true,
      alwaysOnTop: true,
      show: false,
      skipTaskbar: false,
      backgroundColor: '#101725',
      title: `${isMissed ? 'Missed Reminder' : 'Reminder'} - ${reminder.title}`,
      webPreferences: {
        preload: getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        backgroundThrottling: false
      }
    })

    this.alarmWindow = window
    setupSecurityHandlers(window)

    window.setAlwaysOnTop(true, 'screen-saver')

    window.on('ready-to-show', () => {
      window.show()
      window.focus()
      window.webContents.send('reminders:alarm-data', { reminder, isMissed })
    })

    window.webContents.on('did-finish-load', () => {
      window.webContents.send('reminders:alarm-data', { reminder, isMissed })
    })

    window.on('closed', () => {
      if (this.alarmWindow === window) {
        this.alarmWindow = null
        this.activeReminder = null
      }
    })

    const hashRoute = `#/alarm?id=${encodeURIComponent(reminder.id)}${isMissed ? '&missed=1' : ''}`

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${hashRoute}`)
    } else {
      const htmlPath = join(__dirname, '../renderer/index.html')
      window.loadFile(htmlPath, { hash: `/alarm?id=${encodeURIComponent(reminder.id)}${isMissed ? '&missed=1' : ''}` })
    }

    return window
  }

  public closeAlarmWindow(): void {
    if (this.alarmWindow && !this.alarmWindow.isDestroyed()) {
      this.alarmWindow.close()
    }
    this.alarmWindow = null
    this.activeReminder = null
  }

  public isOpen(): boolean {
    return !!this.alarmWindow && !this.alarmWindow.isDestroyed()
  }
}
