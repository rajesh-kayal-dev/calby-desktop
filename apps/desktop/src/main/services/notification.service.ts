import { Notification, BrowserWindow } from 'electron'
import { electronApp } from '@electron-toolkit/utils'
import type { Reminder } from '../storage/reminder.repository'
import { ConfigService } from './config.service'
import { findNotificationSound } from '../../shared/sound-catalog'
import { resolveAssetPath } from './sound-resolver'

export interface NotificationActionCallbacks {
  onComplete: (id: string) => void
  onSnooze: (id: string) => void
  onDismiss: (id: string) => void
}

export class NotificationService {
  private static instance: NotificationService | null = null
  private callbacks: NotificationActionCallbacks | null = null

  private constructor() {
    // Set App User Model ID for Windows Toast Action Center support
    if (process.platform === 'win32') {
      try {
        electronApp.setAppUserModelId('com.calby.desktop')
      } catch (err) {
        console.warn('[NotificationService] Could not set AppUserModelId:', err)
      }
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

  public showReminderNotification(reminder: Reminder, isMissed = false): void {
    const configService = ConfigService.getInstance()
    const reminderSettings = configService.getReminderSettings()

    if (!reminderSettings.desktopNotificationsEnabled) {
      console.log('[NotificationService] Desktop notifications disabled in settings. Skipping notification.')
      this.broadcastNotificationStatus({
        status: 'disabled',
        message: 'Desktop notifications are disabled.'
      })
      return
    }

    if (!Notification.isSupported()) {
      console.warn('[NotificationService] OS notifications are not supported on this platform.')
      return
    }

    try {
      const dateObj = new Date(reminder.scheduledAt)
      const timeFormatted = isNaN(dateObj.getTime())
        ? ''
        : dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

      const iconPath = resolveAssetPath('icon.png')

      const bodyText = [
        reminder.title,
        timeFormatted ? `Scheduled for ${timeFormatted}` : '',
        isMissed ? 'Missed while Calby was unavailable.' : ''
      ]
        .filter(Boolean)
        .join('\n')

      const notification = new Notification({
        title: isMissed ? 'Missed reminder' : 'Reminder',
        body: bodyText,
        icon: iconPath || undefined,
        silent: true, // We trigger configured sound playback through audio engine for exact sound selection
        urgency: 'critical',
        timeoutType: 'never', // Keep visible until user explicitly dismisses it
        actions: [
          { type: 'button', text: 'Complete' },
          { type: 'button', text: 'Snooze 5m' }
        ]
      })

      notification.on('action', (_event, actionIndex) => {
        console.log(`[NotificationService] Notification action clicked: ${actionIndex} for reminder ${reminder.id}`)
        if (!this.callbacks) return

        if (actionIndex === 0) {
          this.callbacks.onComplete(reminder.id)
        } else if (actionIndex === 1) {
          this.callbacks.onSnooze(reminder.id)
        }
      })

      notification.on('click', () => {
        console.log(`[NotificationService] Notification clicked for reminder: ${reminder.id}`)
        this.focusMainWindow()
        this.broadcastNavigation({
          view: 'reminders',
          reminderId: reminder.id
        })
      })

      notification.on('failed', (_event, error) => {
        console.error(`[NotificationService] OS notification delivery failed for reminder ${reminder.id}:`, error)
      })

      notification.show()
      console.log(`[NotificationService] OS notification displayed for reminder "${reminder.title}" (${reminder.id})`)

      // Play configured notification sound if enabled in settings
      if (reminderSettings.notificationSoundEnabled) {
        const sound = findNotificationSound(reminderSettings.notificationSound)
        this.broadcastSound('reminders:play-sound', { sound, category: 'notification' })
      }
    } catch (err) {
      console.error(`[NotificationService] Failed to create or show notification for reminder ${reminder.id}:`, err)
    }
  }

  private focusMainWindow(): void {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      const win = windows[0]
      if (win.isMinimized()) {
        win.restore()
      }
      if (!win.isVisible()) {
        win.show()
      }
      win.focus()
    }
  }

  private broadcastNavigation(payload: { view: string; reminderId?: string }): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('system:navigate', payload)
      }
    }
  }

  private broadcastSound(channel: string, payload: unknown): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload)
      }
    }
  }

  private broadcastNotificationStatus(payload: { status: string; message: string }): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('reminders:notification-status', payload)
      }
    }
  }
}
