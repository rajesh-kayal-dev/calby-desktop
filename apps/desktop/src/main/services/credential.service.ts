import { app, safeStorage } from 'electron'
import { join } from 'node:path'
import { existsSync, promises as fs } from 'node:fs'

const CREDENTIALS_FILE = 'credentials.enc'

export class CredentialService {
  private static instance: CredentialService | null = null

  private get credentialsPath(): string {
    return join(app.getPath('userData'), CREDENTIALS_FILE)
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
}
