import { BrowserWindow } from 'electron'
import { getDatabase } from '../storage/database'
import { CredentialService } from './credential.service'
import { GoogleCalendarService } from './google-calendar.service'
import { ConfigService } from './config.service'
import { AiVoiceService } from './ai-voice.service'
import { ReminderService } from './reminder.service'

export interface ClearDataResult {
  memoriesCleared: boolean
  remindersCleared: boolean
  credentialsCleared: boolean
  calendarDisconnected: boolean
  configReset: boolean
  allCleared: boolean
  errors?: string[]
}

export interface ClearMemoriesResult {
  cleared: boolean
  count: number
}

export class SettingsService {
  private static instance: SettingsService | null = null
  private credentialService: CredentialService
  private calendarService: GoogleCalendarService
  private configService: ConfigService
  private voiceService: AiVoiceService
  private reminderService: ReminderService

  private constructor() {
    this.credentialService = CredentialService.getInstance()
    this.calendarService = GoogleCalendarService.getInstance()
    this.configService = ConfigService.getInstance()
    this.voiceService = AiVoiceService.getInstance()
    this.reminderService = ReminderService.getInstance()
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  public async clearMemories(): Promise<ClearMemoriesResult> {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM memories').run()

    // Broadcast change to windows
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('memory:changed', { action: 'deleted' })
      }
    }

    return {
      cleared: true,
      count: result.changes
    }
  }

  public async clearAllData(): Promise<ClearDataResult> {
    const errors: string[] = []
    let memoriesCleared = false
    let remindersCleared = false
    let credentialsCleared = false
    let calendarDisconnected = false
    let configReset = false

    // 1. Stop active voice session
    try {
      await this.voiceService.stopSession()
    } catch (err) {
      console.warn('[SettingsService] Error stopping voice session during clear-all:', err)
    }

    // 2. Database table wipe in one single transaction
    try {
      const db = getDatabase()
      const clearTx = db.transaction(() => {
        db.prepare('DELETE FROM memories').run()
        db.prepare('DELETE FROM reminders').run()
      })
      clearTx()
      memoriesCleared = true
      remindersCleared = true
    } catch (err) {
      const msg = 'Failed to clear database tables: ' + (err instanceof Error ? err.message : String(err))
      console.error('[SettingsService]', msg)
      errors.push(msg)
    }

    // 3. Delete Google Calendar credentials
    try {
      await this.calendarService.disconnect()
      await this.credentialService.deleteGoogleCalendarTokens()
      calendarDisconnected = true
    } catch (err) {
      const msg = 'Failed to disconnect Google Calendar: ' + (err instanceof Error ? err.message : String(err))
      console.error('[SettingsService]', msg)
      errors.push(msg)
    }

    // 4. Delete Gemini API Key credentials
    try {
      await this.credentialService.deleteApiKey()
      credentialsCleared = true
    } catch (err) {
      const msg = 'Failed to delete Gemini credentials: ' + (err instanceof Error ? err.message : String(err))
      console.error('[SettingsService]', msg)
      errors.push(msg)
    }

    // 5. Reset Onboarding / Config state
    try {
      this.configService.resetConfig()
      configReset = true
    } catch (err) {
      const msg = 'Failed to reset onboarding config: ' + (err instanceof Error ? err.message : String(err))
      console.error('[SettingsService]', msg)
      errors.push(msg)
    }

    // 6. Broadcast all change events to any open windows
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('memory:changed', { action: 'deleted' })
        win.webContents.send('reminders:changed', { action: 'deleted' })
        win.webContents.send('calendar:status-changed', { status: 'disconnected' })
      }
    }

    const allCleared =
      memoriesCleared &&
      remindersCleared &&
      credentialsCleared &&
      calendarDisconnected &&
      configReset

    return {
      memoriesCleared,
      remindersCleared,
      credentialsCleared,
      calendarDisconnected,
      configReset,
      allCleared,
      errors: errors.length > 0 ? errors : undefined
    }
  }
}
