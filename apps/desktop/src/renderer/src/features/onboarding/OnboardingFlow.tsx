import { useState, type FC } from 'react'
import { OnboardingStep } from './types'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { ConnectGeminiScreen } from './screens/ConnectGeminiScreen'
import { ValidationScreen } from './screens/ValidationScreen'
import { SuccessScreen } from './screens/SuccessScreen'
import { MicrophoneScreen } from './screens/MicrophoneScreen'

interface OnboardingFlowProps {
  initialStep?: OnboardingStep
  onFinish: () => void
}

export const OnboardingFlow: FC<OnboardingFlowProps> = ({
  initialStep = OnboardingStep.WELCOME,
  onFinish
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep)
  const [apiKey, setApiKey] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleValidateAndConnect = async (key: string): Promise<void> => {
    setApiKey(key)
    setError(null)
    setCurrentStep(OnboardingStep.VALIDATING)

    try {
      if (!window.calby?.auth) {
        throw new Error('window.calby.auth API is unavailable.')
      }

      const result = await window.calby.auth.validateAndSaveKey(key)

      if (result.ok && result.data.isValid) {
        setCurrentStep(OnboardingStep.SUCCESS)
      } else if (!result.ok) {
        setError(result.error.message || 'Validation failed. Please verify your API key.')
        setCurrentStep(OnboardingStep.CONNECT_GEMINI)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown validation error occurred.')
      setCurrentStep(OnboardingStep.CONNECT_GEMINI)
    }
  }

  const handleCompleteOnboarding = async (): Promise<void> => {
    try {
      if (window.calby?.onboarding) {
        await window.calby.onboarding.complete()
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
    } finally {
      onFinish()
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {currentStep === OnboardingStep.WELCOME && (
        <WelcomeScreen onNext={() => setCurrentStep(OnboardingStep.CONNECT_GEMINI)} />
      )}

      {currentStep === OnboardingStep.CONNECT_GEMINI && (
        <ConnectGeminiScreen
          initialKey={apiKey}
          error={error}
          onBack={() => setCurrentStep(OnboardingStep.WELCOME)}
          onConnect={handleValidateAndConnect}
        />
      )}

      {currentStep === OnboardingStep.VALIDATING && <ValidationScreen />}

      {currentStep === OnboardingStep.SUCCESS && (
        <SuccessScreen
          onBack={() => setCurrentStep(OnboardingStep.CONNECT_GEMINI)}
          onNext={() => setCurrentStep(OnboardingStep.MICROPHONE)}
        />
      )}

      {currentStep === OnboardingStep.MICROPHONE && (
        <MicrophoneScreen onComplete={handleCompleteOnboarding} />
      )}
    </div>
  )
}
