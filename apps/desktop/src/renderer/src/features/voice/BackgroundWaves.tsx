import type { FC } from 'react'
import type { VoiceState } from '../../types/calby'

interface BackgroundWavesProps {
  state: VoiceState
}

export const BackgroundWaves: FC<BackgroundWavesProps> = ({ state }) => {
  if (state === 'error') {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-44 overflow-hidden pointer-events-none select-none z-0 opacity-40"
      >
        <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1280 200">
          <path
            d="M-40 180C260 140 450 190 680 160C920 128 1100 170 1320 150"
            stroke="url(#error-wave-gradient-1)"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <path
            d="M0 160C210 175 420 130 650 145C890 162 1080 120 1300 135"
            stroke="url(#error-wave-gradient-2)"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
          <defs>
            <linearGradient id="error-wave-gradient-1" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0" />
              <stop offset="40%" stopColor="#EF4444" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#F87171" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="error-wave-gradient-2" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
              <stop offset="30%" stopColor="#DC2626" stopOpacity="0.15" />
              <stop offset="65%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

  if (state === 'action_result') {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-44 overflow-hidden pointer-events-none select-none z-0 opacity-40"
      >
        <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1280 180">
          <path
            d="M0 130C180 130 260 80 440 90C620 100 700 150 880 140C1060 130 1160 85 1280 95"
            stroke="url(#emerald-wave-gradient-1)"
            strokeWidth="1.5"
          />
          <path
            d="M0 115C160 115 280 160 480 145C680 130 760 70 960 80C1120 88 1200 130 1280 125"
            stroke="url(#emerald-wave-gradient-2)"
            strokeWidth="1.2"
          />
          <defs>
            <linearGradient id="emerald-wave-gradient-1" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0" />
              <stop offset="25%" stopColor="#0EA5E9" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.6" />
              <stop offset="75%" stopColor="#06B6D4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="emerald-wave-gradient-2" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0" />
              <stop offset="35%" stopColor="#10B981" stopOpacity="0.5" />
              <stop offset="65%" stopColor="#06B6D4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

  // Default Cyan Ethereal Waves for idle, listening, processing, speaking
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-44 overflow-hidden pointer-events-none select-none z-0 opacity-40 mix-blend-screen"
    >
      <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1280 240">
        <defs>
          <linearGradient id="cyanLineGlow1" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="25%" stopColor="#0284c7" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="75%" stopColor="#0369a1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cyanLineGlow2" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="40%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -50 180 C 250 120, 450 220, 750 150 C 950 100, 1150 180, 1330 140"
          fill="none"
          stroke="url(#cyanLineGlow1)"
          strokeWidth="1.8"
        />
        <path
          d="M -30 140 C 220 200, 520 130, 800 190 C 1020 230, 1180 130, 1320 160"
          fill="none"
          opacity="0.6"
          stroke="url(#cyanLineGlow2)"
          strokeDasharray="3 3"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  )
}
