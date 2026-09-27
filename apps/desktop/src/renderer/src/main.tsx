import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { AlarmWindowApp } from './features/reminders/components/AlarmWindowApp'
import { QuickVoiceApp } from './features/quick-voice/QuickVoiceApp'
import './styles/globals.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element')
}

const hashRoute = window.location.hash
const isAlarmRoute = hashRoute.startsWith('#/alarm')
const isQuickVoiceRoute = hashRoute.startsWith('#/quick-voice')

createRoot(rootElement).render(
  <StrictMode>
    {isQuickVoiceRoute ? (
      <QuickVoiceApp />
    ) : isAlarmRoute ? (
      <AlarmWindowApp />
    ) : (
      <App />
    )}
  </StrictMode>
)
