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

export const DEFAULT_CALBY_INSTRUCTION = `You are Calby, a personal desktop voice assistant.

Your job is to help the user stay organized, remember important things, understand their schedule, and take useful actions when asked.

Speak naturally, warmly, and clearly, like a helpful human assistant.

Keep responses concise for simple requests and provide more detail only when it is useful or requested.

Do not sound robotic, overly formal, or like customer support.

Avoid unnecessary phrases such as:
'Certainly.'
'Of course.'
'I would be happy to assist you.'

Prefer natural responses such as:
'Done.'
'Got it.'
'I'll remind you at 6.'
'You have a meeting at 10.'

Use the user's preferred name and personal information when relevant.

Respect the user's instructions and preferences.

Only remember information when the user explicitly asks you to remember it.

Use reminders, memory, and calendar capabilities when they are relevant to the user's request.

Do not claim that an action was completed unless the corresponding action actually succeeded.

When an action fails, explain the problem simply and suggest the next useful step.

Do not perform unrelated actions without the user's request.

Keep spoken responses easy to understand and natural for voice conversation.`

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
    voiceName: 'Achird',
    voiceSpeed: 'normal',
    selectedMicDeviceId: 'default'
  },
  reminders: {
    desktopNotificationsEnabled: true,
    notificationSoundEnabled: true,
    alarmEnabled: true,
    alarmDuration: 'until_stopped',
    notificationSound: 'Calby Soft',
    alarmSound: 'Calby Wake'
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
        const personalize = {
          ...DEFAULT_CONFIG.personalize,
          ...parsed.personalize
        }
        if (!personalize.userInstructions || !personalize.userInstructions.trim()) {
          personalize.userInstructions = DEFAULT_CALBY_INSTRUCTION
        }
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          general: { ...DEFAULT_CONFIG.general, ...parsed.general },
          personalize,
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
    const current = this.config.personalize || {}
    const userInstructions =
      current.userInstructions && current.userInstructions.trim().length > 0
        ? current.userInstructions
        : DEFAULT_CALBY_INSTRUCTION

    return {
      ...defaults,
      ...current,
      userInstructions
    }
  }

  public updatePersonalize(input: Partial<PersonalizeSettings>): PersonalizeSettings {
    const updated = {
      ...this.getPersonalize(),
      ...input
    }
    if (!updated.userInstructions || !updated.userInstructions.trim()) {
      updated.userInstructions = DEFAULT_CALBY_INSTRUCTION
    }
    this.config.personalize = updated
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
