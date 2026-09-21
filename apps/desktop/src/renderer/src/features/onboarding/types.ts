export enum OnboardingStep {
  WELCOME = 1,
  CONNECT_GEMINI = 2,
  VALIDATING = 3,
  SUCCESS = 4,
  USER_NAME = 5,
  MICROPHONE = 6
}

export interface OnboardingState {
  currentStep: OnboardingStep
  apiKey: string
  error: string | null
  isValidating: boolean
}
