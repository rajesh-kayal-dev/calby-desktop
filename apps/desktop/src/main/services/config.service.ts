import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export interface GeneralSettings {
  startWithComputer: boolean
  keepRunningInBackground: boolean
  closeToTray: boolean
  allowDesktopNotifications: boolean
}

export interface PersonalizeSettings {
  userName?: string
  userTone?: string
  userAbout?: string
  userInstructions?: string
}

export interface VoiceSettings {
  voiceName?: string
  voiceSpeed?: string
  selectedMicDeviceId?: string
}

export interface ReminderSettings {
  desktopNotificationsEnabled: boolean
  notificationSoundEnabled: boolean
  alarmEnabled: boolean
  alarmDuration: string
  notificationSound?: string
  alarmSound?: string
}

export interface AppConfig {
  isOnboarded: boolean
  configuredAt?: string
  general?: GeneralSettings
  personalize?: PersonalizeSettings
  voice?: VoiceSettings
  reminders?: ReminderSettings
}

export const DEFAULT_CALBY_INSTRUCTION =
  'You are Calby, a calm, focused, personal desktop voice assistant. Keep answers concise, clear, and direct. Help the user remember, understand, and act across reminders, personal memory, and Google Calendar.'

const CONFIG_FILE = 'config.json'

const DEFAULT_CONFIG: AppConfig = {
  isOnboarded: false,
  general: {
    startWithComputer: true,
    keepRunningInBackground: true,
    closeToTray: true,
    allowDesktopNotifications: true
  },
  personalize: {
    userName: '',
    userTone: 'friendly',
    userAbout: '',
    userInstructions: DEFAULT_CALBY_INSTRUCTION
  },
  voice: {
    voiceName: 'Aoede',
    voiceSpeed: 'normal',
    selectedMicDeviceId: 'default'
  },
  reminders: {
    desktopNotificationsEnabled: true,
    notificationSoundEnabled: true,
    alarmEnabled: true,
    alarmDuration: 'until_stopped',
    notificationSound: 'Gentle Chime',
    alarmSound: 'Calby Alert'
  }
}

export class ConfigService {
  private static instance: ConfigService | null = null
  private config: AppConfig

  private get configPath(): string {
    return join(app.getPath('userData'), CONFIG_FILE)
  }

  private constructor() {
    this.config = this.loadConfig()
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  private loadConfig(): AppConfig {
    try {
      if (existsSync(this.configPath)) {
        const raw = readFileSync(this.configPath, 'utf-8')
        const parsed = JSON.parse(raw)
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          general: { ...DEFAULT_CONFIG.general, ...parsed.general },
          personalize: { ...DEFAULT_CONFIG.personalize, ...parsed.personalize },
          voice: { ...DEFAULT_CONFIG.voice, ...parsed.voice },
          reminders: { ...DEFAULT_CONFIG.reminders, ...parsed.reminders }
        }
      }
    } catch {
      // If parsing fails, use default config
    }
    return { ...DEFAULT_CONFIG }
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save config.json:', error)
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config }
  }

  public isOnboarded(): boolean {
    return this.config.isOnboarded
  }

  public setOnboarded(value: boolean): void {
    this.config.isOnboarded = value
    if (value) {
      this.config.configuredAt = new Date().toISOString()
    }
    this.saveConfig()
  }

  public getGeneralSettings(): GeneralSettings {
    const defaults = DEFAULT_CONFIG.general!
    return {
      ...defaults,
      ...(this.config.general || {})
    }
  }

  public updateGeneralSettings(input: Partial<GeneralSettings>): GeneralSettings {
    this.config.general = {
      ...this.getGeneralSettings(),
      ...input
    }
    this.saveConfig()
    return this.config.general
  }

  public getPersonalize(): PersonalizeSettings {
    const defaults = DEFAULT_CONFIG.personalize!
    return {
      ...defaults,
      ...(this.config.personalize || {})
    }
  }

  public updatePersonalize(input: Partial<PersonalizeSettings>): PersonalizeSettings {
    this.config.personalize = {
      ...this.getPersonalize(),
      ...input
    }
    this.saveConfig()
    return this.config.personalize
  }

  public getVoiceSettings(): VoiceSettings {
    const defaults = DEFAULT_CONFIG.voice!
    return {
      ...defaults,
      ...(this.config.voice || {})
    }
  }

  public updateVoiceSettings(input: Partial<VoiceSettings>): VoiceSettings {
    this.config.voice = {
      ...this.getVoiceSettings(),
      ...input
    }
    this.saveConfig()
    return this.config.voice
  }

  public getReminderSettings(): ReminderSettings {
    const defaults = DEFAULT_CONFIG.reminders!
    return {
      ...defaults,
      ...(this.config.reminders || {})
    }
  }

  public updateReminderSettings(input: Partial<ReminderSettings>): ReminderSettings {
    this.config.reminders = {
      ...this.getReminderSettings(),
      ...input
    }
    this.saveConfig()
    return this.config.reminders
  }

  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.saveConfig()
  }
}
