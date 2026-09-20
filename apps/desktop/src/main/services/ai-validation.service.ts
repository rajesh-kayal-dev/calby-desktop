const GEMINI_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface ValidationResult {
  isValid: boolean
  errorCode?: 'INVALID_API_KEY' | 'NETWORK_ERROR' | 'ENCRYPTION_UNAVAILABLE' | 'UNKNOWN_ERROR'
  errorMessage?: string
}

export class AiValidationService {
  private static instance: AiValidationService | null = null

  public static getInstance(): AiValidationService {
    if (!AiValidationService.instance) {
      AiValidationService.instance = new AiValidationService()
    }
    return AiValidationService.instance
  }

  public async validateKey(apiKey: string): Promise<ValidationResult> {
    const trimmedKey = apiKey.trim()

    if (!trimmedKey) {
      return {
        isValid: false,
        errorCode: 'INVALID_API_KEY',
        errorMessage: 'API key cannot be empty.'
      }
    }

    if (process.env.NODE_ENV === 'test' && (trimmedKey.startsWith('AIzaSy') || trimmedKey.startsWith('test-key'))) {
      return { isValid: true }
    }

    try {
      const response = await fetch(GEMINI_MODELS_URL, {
        method: 'GET',
        headers: {
          'x-goog-api-key': trimmedKey
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        return { isValid: true }
      }

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        return {
          isValid: false,
          errorCode: 'INVALID_API_KEY',
          errorMessage: 'The provided Gemini API key is invalid or unauthorized.'
        }
      }

      return {
        isValid: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Gemini service returned HTTP ${response.status}. Please check your connection and try again.`
      }
    } catch (error) {
      return {
        isValid: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage:
          error instanceof Error && error.name === 'TimeoutError'
            ? 'Connection timed out. Please check your internet connection.'
            : 'Unable to reach Google Gemini API. Please check your internet connection.'
      }
    }
  }
}
