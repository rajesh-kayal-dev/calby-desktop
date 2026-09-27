/**
 * Single source of truth for the Gemini Live (bidiGenerateContent) model.
 *
 * `gemini-2.0-flash-exp` / `gemini-2.0-flash-live-001` were shut down on
 * 2025-12-09, so requests for them now fail with
 * "is not found for API version v1beta, or is not supported for
 * bidiGenerateContent". `gemini-3.8-live` is the current stable Live model
 * (Google's documented replacement for the retired Live models).
 *
 * See: https://ai.google.dev/gemini-api/docs/deprecations
 */
export const GEMINI_LIVE_MODEL = 'gemini-3.8-live'

export const DEFAULT_GEMINI_VOICE = 'Achird'

export const SUPPORTED_GEMINI_VOICES = [
  'Achird',
  'Zubenelgenubi',
  'Sulafat',
  'Vindemiatrix',
  'Callirrhoe',
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Aoede'
] as const

export type SupportedGeminiVoice = (typeof SUPPORTED_GEMINI_VOICES)[number]

export function isSupportedGeminiVoice(voiceName: string): voiceName is SupportedGeminiVoice {
  return (SUPPORTED_GEMINI_VOICES as readonly string[]).includes(voiceName)
}

export function createGeminiSpeechConfig(voiceName?: string) {
  const chosenVoice = voiceName && isSupportedGeminiVoice(voiceName) ? voiceName : DEFAULT_GEMINI_VOICE
  return {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: chosenVoice
      }
    }
  }
}
