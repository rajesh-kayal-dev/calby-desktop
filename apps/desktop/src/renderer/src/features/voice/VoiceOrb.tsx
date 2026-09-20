import type { FC } from 'react'
import type { VoiceState } from '../../types/calby'

interface VoiceOrbProps {
  state: VoiceState
  audioLevels: number[]
  onClick?: () => void
}

export const VoiceOrb: FC<VoiceOrbProps> = ({ state, audioLevels, onClick }) => {
  // Convert 0..1 audio levels to px bar heights (min 6px, max 44px)
  const barHeights = audioLevels.map((lvl) => Math.round(6 + lvl * 38))

  return (
    <div
      className="relative flex items-center justify-center my-auto select-none"
      data-purpose="voice-visualizer-container"
    >
      {/* 1. IDLE STATE ORB */}
      {state === 'idle' && (
        <div className="relative flex items-center justify-center">
          {/* Ambient cyan glow */}
          <div className="absolute w-48 h-48 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none animate-pulse" />

          {/* Orb container */}
          <button
            onClick={onClick}
            type="button"
            className="w-32 h-32 rounded-full bg-[#08101C] border-2 border-cyan-400/80 flex items-center justify-center shadow-[0_0_45px_-8px_rgba(56,189,248,0.4),inset_0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_60px_-4px_rgba(56,189,248,0.6)] relative cursor-pointer group transition-all duration-300"
            aria-label="Activate voice assistant"
          >
            <div className="flex items-center gap-[5px] h-10 px-4">
              <span
                className="w-[3px] bg-white/90 rounded-full transition-all duration-200"
                style={{ height: `${barHeights[0]}px` }}
              />
              <span
                className="w-[3px] bg-white/90 rounded-full transition-all duration-200"
                style={{ height: `${barHeights[1]}px` }}
              />
              <span
                className="w-[3.5px] bg-white rounded-full transition-all duration-200 shadow-[0_0_6px_#fff]"
                style={{ height: `${barHeights[2]}px` }}
              />
              <span
                className="w-[3px] bg-white/90 rounded-full transition-all duration-200"
                style={{ height: `${barHeights[3]}px` }}
              />
              <span
                className="w-[3px] bg-white/90 rounded-full transition-all duration-200"
                style={{ height: `${barHeights[4]}px` }}
              />
            </div>
          </button>
        </div>
      )}

      {/* 2. LISTENING STATE ORB */}
      {state === 'listening' && (
        <div className="relative flex items-center justify-center">
          {/* Ambient Outer Glow */}
          <div className="absolute w-[440px] h-[440px] rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

          {/* Outer Acoustic Radial Ripple Waves */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-sky-400/10 animate-ping opacity-25" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-sky-400/20" />
          <div className="absolute w-[240px] h-[240px] rounded-full border border-cyan-400/35" />

          {/* Lateral parenthetical resonance arcs */}
          <div className="absolute w-[200px] h-[200px] rounded-full border-l-2 border-r-2 border-t-transparent border-b-transparent border-cyan-400/50 pointer-events-none" />
          <div className="absolute w-[270px] h-[270px] rounded-full border-l-2 border-r-2 border-t-transparent border-b-transparent border-sky-400/30 pointer-events-none" />

          {/* Primary Glowing Cyan Ring */}
          <button
            onClick={onClick}
            type="button"
            className="relative w-36 h-36 rounded-full border-2 border-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.55),inset_0_0_20px_rgba(56,189,248,0.35)] flex items-center justify-center bg-[#060D18]/90 cursor-pointer"
            aria-label="Stop listening"
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-b from-cyan-500/10 to-transparent" />
            <div className="flex items-center gap-1.5 z-10">
              <span
                className="w-1 bg-sky-300 rounded-full transition-all duration-75"
                style={{ height: `${barHeights[0]}px` }}
              />
              <span
                className="w-1 bg-sky-200 rounded-full transition-all duration-75"
                style={{ height: `${barHeights[1]}px` }}
              />
              <span
                className="w-1.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] transition-all duration-75"
                style={{ height: `${barHeights[2]}px` }}
              />
              <span
                className="w-1 bg-sky-200 rounded-full transition-all duration-75"
                style={{ height: `${barHeights[3]}px` }}
              />
              <span
                className="w-1 bg-sky-300 rounded-full transition-all duration-75"
                style={{ height: `${barHeights[4]}px` }}
              />
            </div>
          </button>
        </div>
      )}

      {/* 3. PROCESSING STATE ORB */}
      {state === 'processing' && (
        <div className="relative flex items-center justify-center">
          {/* Ambient rotating gradient glow */}
          <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-sky-400/20 blur-2xl animate-spin" />

          {/* Processing Orb with rotating gradient ring */}
          <div className="relative w-32 h-32 rounded-full p-[2px] bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-300 animate-spin">
            <div className="w-full h-full rounded-full bg-[#08101C] flex items-center justify-center">
              <div className="flex items-center gap-1.5 animate-pulse">
                <span className="w-1 h-3 bg-cyan-400 rounded-full" />
                <span className="w-1 h-6 bg-cyan-300 rounded-full" />
                <span className="w-1.5 h-8 bg-white rounded-full shadow-[0_0_8px_#fff]" />
                <span className="w-1 h-6 bg-cyan-300 rounded-full" />
                <span className="w-1 h-3 bg-cyan-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SPEAKING STATE ORB */}
      {state === 'speaking' && (
        <div className="relative w-[340px] h-[190px] flex items-center justify-center">
          {/* Outermost radiating arcs */}
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-4 opacity-50">
            {/* Left radiating arcs */}
            <svg className="w-20 h-28 text-cyan-400/40 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 80 112">
              <path d="M70 12C36 34 20 62 70 100" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M40 28C16 46 8 68 40 84" opacity="0.6" strokeLinecap="round" strokeWidth="2" />
              <path d="M16 42C2 50 -1 60 16 70" opacity="0.3" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
            {/* Right radiating arcs */}
            <svg className="w-20 h-28 text-cyan-400/40 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 80 112">
              <path d="M10 12C44 34 60 62 10 100" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M40 28C64 46 72 68 40 84" opacity="0.6" strokeLinecap="round" strokeWidth="2" />
              <path d="M64 42C78 50 81 60 64 70" opacity="0.3" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Mid-frequency Acoustic Wave Rings */}
          <div className="absolute w-[200px] h-[200px] rounded-full border border-cyan-400/30 animate-ping opacity-20 pointer-events-none" />
          <div className="absolute w-[240px] h-[240px] rounded-full border border-blue-500/20 pointer-events-none" />

          {/* Central Responding Calby Orb */}
          <button
            onClick={onClick}
            type="button"
            className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#09101d] to-[#040810] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.4)] cursor-pointer"
            aria-label="Interrupt assistant speaking"
          >
            <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-blue-600/30 to-cyan-400/20 blur-[2px]" />
            <div className="relative z-10 flex items-center justify-center space-x-1.5 h-10 px-2">
              <span
                className="w-[3.5px] bg-cyan-300 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-75"
                style={{ height: `${barHeights[0]}px` }}
              />
              <span
                className="w-[3.5px] bg-cyan-300 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-75"
                style={{ height: `${barHeights[1]}px` }}
              />
              <span
                className="w-[3.5px] bg-white rounded-full shadow-[0_0_10px_#38bdf8] transition-all duration-75"
                style={{ height: `${barHeights[2]}px` }}
              />
              <span
                className="w-[3.5px] bg-cyan-300 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-75"
                style={{ height: `${barHeights[3]}px` }}
              />
              <span
                className="w-[3.5px] bg-cyan-300 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-75"
                style={{ height: `${barHeights[4]}px` }}
              />
            </div>
          </button>
        </div>
      )}

      {/* 5. ACTION RESULT ORB */}
      {state === 'action_result' && (
        <div className="relative flex items-center justify-center">
          {/* Emerald glow */}
          <div className="absolute w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
          <div className="relative w-28 h-28 rounded-full bg-[#08101C] border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.35)]">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      )}

      {/* 6. ERROR STATE ORB */}
      {state === 'error' && (
        <div className="relative flex items-center justify-center">
          {/* Red glow */}
          <div className="absolute w-44 h-44 rounded-full bg-red-500/15 blur-2xl pointer-events-none" />
          <div className="relative w-20 h-20 rounded-full border-2 border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.35)]">
            <span className="text-red-500 text-3xl font-semibold leading-none select-none">!</span>
          </div>
        </div>
      )}
    </div>
  )
}
