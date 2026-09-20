import { ipcMain } from 'electron'
import type { AuthStatus, ValidateKeyResult, IpcResult } from '../../preload/index.d'
import { AUTH_CHANNELS } from '../../preload/api/auth.api'
import { CredentialService } from '../services/credential.service'
import { ConfigService } from '../services/config.service'
import { AiValidationService } from '../services/ai-validation.service'

export const registerAuthIpcHandlers = (): void => {
  const credentialService = CredentialService.getInstance()
  const configService = ConfigService.getInstance()
  const validationService = AiValidationService.getInstance()

  ipcMain.handle(AUTH_CHANNELS.GET_STATUS, async (): Promise<IpcResult<AuthStatus>> => {
    try {
      const isConfigured = await credentialService.hasApiKey()
      const isOnboarded = configService.isOnboarded()

      return {
        ok: true,
        data: {
          isConfigured,
          isOnboarded
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'AUTH_STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve auth status'
        }
      }
    }
  })

  ipcMain.handle(
    AUTH_CHANNELS.VALIDATE_AND_SAVE_KEY,
    async (_, apiKey: unknown): Promise<IpcResult<ValidateKeyResult>> => {
      try {
        if (typeof apiKey !== 'string' || !apiKey.trim()) {
          return {
            ok: false,
            error: {
              code: 'INVALID_API_KEY',
              message: 'Please provide a valid Gemini API key.'
            }
          }
        }

        // Validate key with Gemini API
        const validation = await validationService.validateKey(apiKey)
        if (!validation.isValid) {
          return {
            ok: false,
            error: {
              code: validation.errorCode || 'INVALID_API_KEY',
              message: validation.errorMessage || 'Invalid Gemini API key.'
            }
          }
        }

        // Check if encryption is available
        if (!credentialService.isEncryptionAvailable()) {
          return {
            ok: false,
            error: {
              code: 'ENCRYPTION_UNAVAILABLE',
              message: 'OS-level credential encryption is not available on this system.'
            }
          }
        }

        // Save credential securely
        await credentialService.saveApiKey(apiKey)

        return {
          ok: true,
          data: {
            isValid: true
          }
        }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: 'AUTH_VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to validate and save credential'
          }
        }
      }
    }
  )

  ipcMain.handle(AUTH_CHANNELS.CLEAR_KEY, async (): Promise<IpcResult<void>> => {
    try {
      await credentialService.deleteApiKey()
      return {
        ok: true,
        data: undefined
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'AUTH_CLEAR_ERROR',
          message: error instanceof Error ? error.message : 'Failed to clear credential'
        }
      }
    }
  })
}
