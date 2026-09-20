import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

interface AppConfig {
  isOnboarded: boolean
  configuredAt?: string
}

const CONFIG_FILE = 'config.json'

const DEFAULT_CONFIG: AppConfig = {
  isOnboarded: false
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
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
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
}
