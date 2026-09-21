import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { AlarmWindowApp } from './features/reminders/components/AlarmWindowApp'
import './styles/globals.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element')
}

const isAlarmRoute = window.location.hash.startsWith('#/alarm')

createRoot(rootElement).render(
  <StrictMode>
    {isAlarmRoute ? <AlarmWindowApp /> : <App />}
  </StrictMode>
)

