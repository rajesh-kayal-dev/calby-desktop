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
