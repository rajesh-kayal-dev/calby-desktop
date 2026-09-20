import { Notification, app, BrowserWindow } from 'electron'
import type { Reminder } from '../storage/reminder.repository'

export interface NotificationActionCallbacks {
  onSnooze: (id: string) => void
  onDismiss: (id: string) => void
}

export class NotificationService {
  private static instance: NotificationService | null = null
  private callbacks: NotificationActionCallbacks | null = null

  private constructor() {
    // Set App User Model ID for Windows Toast Action Center support
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.calby.desktop')
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public registerCallbacks(callbacks: NotificationActionCallbacks): void {
    this.callbacks = callbacks
  }

  public showReminderNotification(reminder: Reminder): void {
    if (!Notification.isSupported()) {
      console.warn('[NotificationService] OS notifications are not supported on this platform.')
      return
    }

    const scheduledDate = new Date(reminder.scheduledAt)
    const timeStr = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const notification = new Notification({
      title: `⏰ ${reminder.title}`,
      body: `Due at ${timeStr} • Calby Reminder`,
      silent: !reminder.alarmEnabled,
      urgency: 'critical',
      actions: [
        { type: 'button', text: 'Snooze 5m' },
        { type: 'button', text: 'Dismiss' }
      ]
    })

    notification.on('action', (_event, actionIndex) => {
      console.log(`[NotificationService] Notification action clicked: ${actionIndex} for reminder ${reminder.id}`)
      if (!this.callbacks) return

      if (actionIndex === 0) {
        this.callbacks.onSnooze(reminder.id)
      } else if (actionIndex === 1) {
        this.callbacks.onDismiss(reminder.id)
      }
    })

    notification.on('click', () => {
      console.log(`[NotificationService] Notification clicked for reminder: ${reminder.id}`)
      this.focusMainWindow()
    })

    notification.show()
  }

  private focusMainWindow(): void {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      const win = windows[0]
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  }
}