export enum OnboardingStep {
  WELCOME = 1,
  CONNECT_GEMINI = 2,
  VALIDATING = 3,
  SUCCESS = 4,
  MICROPHONE = 5
}

export interface OnboardingState {
  currentStep: OnboardingStep
  apiKey: string
  error: string | null
  isValidating: boolean
}
