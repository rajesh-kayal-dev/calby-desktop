import { app, safeStorage } from 'electron'
import { join } from 'node:path'
import { existsSync, promises as fs } from 'node:fs'

const CREDENTIALS_FILE = 'credentials.enc'
const GOOGLE_TOKENS_FILE = 'google_calendar_tokens.enc'

export interface GoogleOAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number // epoch ms
  tokenType?: string
  scope?: string
  userEmail?: string
}

export class CredentialService {
  private static instance: CredentialService | null = null

  private get credentialsPath(): string {
    return join(app.getPath('userData'), CREDENTIALS_FILE)
  }

  private get googleTokensPath(): string {
    return join(app.getPath('userData'), GOOGLE_TOKENS_FILE)
  }

  public static getInstance(): CredentialService {
    if (!CredentialService.instance) {
      CredentialService.instance = new CredentialService()
    }
    return CredentialService.instance
  }

  public isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  // Gemini API Key Management
  public async hasApiKey(): Promise<boolean> {
    return existsSync(this.credentialsPath)
  }

  public async saveApiKey(apiKey: string): Promise<void> {
    if (!this.isEncryptionAvailable()) {
      throw new Error('ENCRYPTION_UNAVAILABLE: OS-level credential encryption is not available.')
    }

    const encryptedBuffer = safeStorage.encryptString(apiKey.trim())
    await fs.writeFile(this.credentialsPath, encryptedBuffer)
  }

  public async getApiKey(): Promise<string | null> {
    if (!this.isEncryptionAvailable() || !existsSync(this.credentialsPath)) {
      return null
    }

    try {
      const encryptedBuffer = await fs.readFile(this.credentialsPath)
      return safeStorage.decryptString(encryptedBuffer)
    } catch {
      return null
    }
  }

  public async deleteApiKey(): Promise<void> {
    if (existsSync(this.credentialsPath)) {
      await fs.unlink(this.credentialsPath)
    }
  }

  // Google Calendar OAuth Tokens Management
  public async hasGoogleCalendarTokens(): Promise<boolean> {
    return existsSync(this.googleTokensPath)
  }

  public async saveGoogleCalendarTokens(tokens: GoogleOAuthTokens): Promise<void> {
    if (!this.isEncryptionAvailable()) {
      throw new Error('ENCRYPTION_UNAVAILABLE: OS-level credential encryption is not available.')
    }

    const json = JSON.stringify(tokens)
    const encryptedBuffer = safeStorage.encryptString(json)
    await fs.writeFile(this.googleTokensPath, encryptedBuffer)
  }

  public async getGoogleCalendarTokens(): Promise<GoogleOAuthTokens | null> {
    if (!this.isEncryptionAvailable() || !existsSync(this.googleTokensPath)) {
      return null
    }

    try {
      const encryptedBuffer = await fs.readFile(this.googleTokensPath)
      const decrypted = safeStorage.decryptString(encryptedBuffer)
      return JSON.parse(decrypted) as GoogleOAuthTokens
    } catch {
      return null
    }
  }

  public async deleteGoogleCalendarTokens(): Promise<void> {
    if (existsSync(this.googleTokensPath)) {
      await fs.unlink(this.googleTokensPath)
    }
  }
}