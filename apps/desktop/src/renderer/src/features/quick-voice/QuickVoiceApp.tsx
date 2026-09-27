import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { Settings } from 'lucide-react'
import { useVoiceSession } from '../voice/useVoiceSession'
import logoUrl from '../../assets/logo.png'
import {
  deriveQuickVoiceState,
  nextTurnAnswered,
  shouldAutoClose,
  statusLineFor,
  subStatusFor,
  progressLabelForTool,
  type QuickVoiceState,
  type VoiceActionPhase
} from '../../../../shared/quick-voice'
import type { VoiceActionProgressPayload, VoiceErrorPayload } from '../../../../preload/index.d'

/** Grace period so the spoken answer can finish before the overlay disappears. */
const CLOSE_AFTER_RESPONSE_MS = 1100
/** Fallback close when an action reports success but no speech follows. */
const CLOSE_AFTER_SUCCESS_FALLBACK_MS = 3500

function closeQuickVoiceWindow(): void {
  void window.calby?.quickVoice?.close()
}

function openVoiceSettings(): void {
  void window.calby?.quickVoice?.openVoiceSettings()
}

/** Keeps user-facing errors simple; technical detail stays in the logs/trace. */
function friendlyErrorMessage(err: VoiceErrorPayload | null): string {
  if (!err) return "I couldn't reach Calby's AI service. Please try again."
  switch (err.code) {
    case 'NO_API_KEY':
      return 'Calby is not set up yet. Add your AI key in Settings, then try again.'
    case 'MIC_PERMISSION_DENIED':
      return 'Microphone access is required to talk to Calby.'
    case 'NO_MIC_FRAMES':
      return "I can't hear your microphone. Check your input device in Settings."
    case 'OFFLINE':
      return 'Please check your internet connection and try again.'
    case 'CONNECTION_LOST':
      return 'Please check your internet and try again.'
    case 'CONNECTION_TIMEOUT':
    case 'CONNECTION_FAILED':
      return "Can't reach Calby's AI service. Check your internet connection."
    case 'LIVE_API_ERROR':
    case 'AUDIO_CHUNK_SEND_FAILED':
      return "Calby's AI service is busy right now. Please try again."
    default:
      return err.message || "I couldn't reach Calby's AI service. Please try again."
  }
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const STATUS_TINT: Record<QuickVoiceState, string> = {
  idle: '#64748b',
  listening: '#38bdf8',
  thinking: '#a78bfa',
  acting: '#f59e0b',
  responding: '#38bdf8',
  success: '#10b981',
  error: '#ef4444',
  awaiting_input: '#f59e0b'
}

const WaveBars: FC<{ levels: number[]; tint: string }> = ({ levels, tint }) => {
  const bars = levels.length === 5 ? levels : [0.15, 0.35, 0.6, 0.3, 0.15]
  return (
    <div className="flex h-5 shrink-0 items-center gap-[2px]" data-purpose="quick-voice-wave">
      {bars.map((level, index) => (
        <span
          key={index}
          className="w-[3px] rounded-full transition-all duration-150 ease-out"
          style={{
            height: `${Math.max(4, Math.round(level * 20))}px`,
            background: tint,
            opacity: 0.55 + level * 0.45
          }}
        />
      ))}
    </div>
  )
}

const MicIndicator: FC<{ tint: string }> = ({ tint }) => (
  <div
    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
    style={{
      color: tint,
      borderColor: `${tint}66`,
      background: `${tint}14`,
      boxShadow: `0 0 14px ${tint}22`
    }}
  >
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="9" y="3" width="6" height="11" rx="3" strokeWidth="2" />
      <path strokeLinecap="round" strokeWidth="2" d="M6.5 11a5.5 5.5 0 0011 0M12 16.5V21M8.5 21h7" />
    </svg>
  </div>
)

/**
 * Calby Quick Voice — a thin floating overlay over the existing voice engine.
 *
 * It reuses `useVoiceSession` (mic capture, VAD, Space-to-talk, barge-in and
 * the single Gemini Live session) and only adds presentation plus the
 * deterministic open → listen → act → respond → close lifecycle.
 */
export const QuickVoiceApp: FC = () => {
  const {
    state,
    stateMetadata,
    userTranscript,
    assistantTranscript,
    error,
    audioLevels,
    startListening,
    retry
  } = useVoiceSession()

  const [actionProgress, setActionProgress] = useState<{
    payload: VoiceActionProgressPayload
    /** Transcript heard when the tool started — used to spot a newer turn. */
    heardAt: string
  } | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const hasRespondedRef = useRef(false)
  const closeTimerRef = useRef<number | null>(null)
  const startedRef = useRef(false)
  const previousVoiceStateRef = useRef(state)
  const userTranscriptRef = useRef(userTranscript)

  const phase: VoiceActionPhase | null = actionProgress ? actionProgress.payload.phase : null
  const derived = deriveQuickVoiceState(state, phase)
  const progressLabel = progressLabelForTool(actionProgress?.payload.tool ?? '')
  const status = statusLineFor(derived, derived === 'acting' ? progressLabel : undefined)
  const subStatus = subStatusFor(derived)
  const tint = STATUS_TINT[derived] || STATUS_TINT.idle

  const heard = userTranscript.trim()
  const spoken = assistantTranscript.trim()
  const resultTitle = typeof stateMetadata?.title === 'string' ? stateMetadata.title : undefined
  const resultSubtitle =
    typeof stateMetadata?.subtitle === 'string' ? stateMetadata.subtitle : undefined

  // Frameless + transparent window: the rounded glass card is drawn in CSS.
  useEffect(() => {
    const previousHtml = document.documentElement.style.background
    const previousBody = document.body.style.background
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    return () => {
      document.documentElement.style.background = previousHtml
      document.body.style.background = previousBody
    }
  }, [])

  useEffect(() => {
    const updateOnline = (): void => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  // The window is the voice surface: start listening as soon as it opens.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void startListening()
  }, [startListening])

  // Tool progress (start / clarify / complete / failed) from the ActionExecutor.
  useEffect(() => {
    const voiceApi = window.calby?.voice
    if (!voiceApi || !voiceApi.onActionProgress) return
    return voiceApi.onActionProgress((payload) => {
      setActionProgress({ payload, heardAt: userTranscriptRef.current })
    })
  }, [])

  // A new user turn drops the previous tool phase so a stale `clarify` phase
  // can never keep the window pinned in `awaiting_input` forever.
  useEffect(() => {
    userTranscriptRef.current = userTranscript
    setActionProgress((current) =>
      current && current.heardAt === userTranscript ? current : null
    )
  }, [userTranscript])

  useEffect(() => {
    const previous = previousVoiceStateRef.current
    previousVoiceStateRef.current = state
    // Backstop: returning to `listening` always means a fresh user turn
    // (speech detected, barge-in, or a new push-to-talk press).
    if (state === 'listening' && previous !== 'listening') {
      setActionProgress(null)
    }
  }, [state])

  // Session timer (reset for every heard phrase).
  useEffect(() => {
    setElapsedSeconds(0)
  }, [userTranscript])

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Turn bookkeeping — must run before the auto-close effect below.
  useEffect(() => {
    hasRespondedRef.current = nextTurnAnswered(hasRespondedRef.current, derived)
  }, [derived])

  // Auto-close: only after an answered turn (or a successful action) settles.
  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (shouldAutoClose(derived, hasRespondedRef.current)) {
      closeTimerRef.current = window.setTimeout(closeQuickVoiceWindow, CLOSE_AFTER_RESPONSE_MS)
    } else if (derived === 'success') {
      closeTimerRef.current = window.setTimeout(
        closeQuickVoiceWindow,
        CLOSE_AFTER_SUCCESS_FALLBACK_MS
      )
    }

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [derived])

  const handleRetry = useCallback(() => {
    void retry()
  }, [retry])

  return (
    <div
      data-purpose="quick-voice-root"
      className="h-screen w-screen overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-cyan-100/[0.12] bg-[linear-gradient(100deg,rgba(15,28,47,0.98),rgba(5,10,18,0.99))] shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_24px_rgba(14,165,233,0.08)] backdrop-blur-xl">
        {/* ── Draggable chrome ── */}
        <div
          className="drag-region flex h-8 shrink-0 items-center justify-between border-b border-white/[0.055] px-3"
          data-purpose="quick-voice-header"
        >
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-400/[0.08] shadow-[0_0_12px_rgba(34,211,238,0.12)]">
              <img src={logoUrl} alt="Calby logo" className="h-4 w-4 object-contain" />
            </span>
            <span className="text-[12px] font-semibold tracking-tight text-slate-100">Calby</span>
          </div>
          <div className="no-drag flex items-center gap-1.5">
            <span
              className="font-mono text-[10px] tabular-nums text-slate-500"
              data-purpose="quick-voice-timer"
            >
              {isOnline ? formatClock(elapsedSeconds) : (
                <span className="flex items-center gap-1 text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-slate-200" />Offline</span>
              )}
            </span>
            <button
              type="button"
              aria-label="Open Voice & Microphone settings"
              data-testid="quick-voice-settings"
              onClick={openVoiceSettings}
              className="flex h-4 w-4 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
            >
              <Settings className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Close Quick Voice"
              data-testid="quick-voice-close"
              onClick={closeQuickVoiceWindow}
              className="flex h-4 w-4 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Status / result ── */}
        <div className="flex min-h-0 flex-1 items-center overflow-hidden px-3 py-2">
          {derived === 'success' ? (
            <div
              className="flex w-full min-w-0 items-center gap-2"
              data-purpose="quick-voice-success"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.18)]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-slate-100" data-testid="quick-voice-title">
                  {resultTitle || 'Done'}
                </p>
                {resultSubtitle && (
                  <p className="line-clamp-2 text-[11px] leading-[1.3] text-slate-400" data-testid="quick-voice-subtitle">
                    {resultSubtitle}
                  </p>
                )}
              </div>
            </div>
          ) : derived === 'error' ? (
            <div
              className="flex w-full min-w-0 items-center gap-2"
              data-purpose="quick-voice-error"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-sm font-semibold text-red-300">!</div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-100">{error?.code === 'CONNECTION_LOST' ? 'Connection lost' : error?.code === 'OFFLINE' ? "You're offline" : 'Something went wrong'}</p>
                <p className="line-clamp-1 text-[11px] leading-[1.3] text-slate-300">{friendlyErrorMessage(error)}</p>
              </div>
              <button
                type="button"
                data-testid="quick-voice-retry"
                onClick={handleRetry}
                className="shrink-0 rounded-md bg-[#2563EB] px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="flex w-full min-w-0 items-center gap-2">
              <MicIndicator tint={tint} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <WaveBars levels={audioLevels} tint={tint} />
                  <p
                    className="truncate text-[12px] font-medium text-slate-100"
                    data-testid="quick-voice-status"
                    data-purpose="quick-voice-status"
                  >
                    {status}
                  </p>
                </div>
                {heard ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-[1.25] text-slate-300" data-purpose="what-calby-heard">
                    <span className="font-medium text-slate-400" data-purpose="what-calby-heard-label">What Calby heard: </span>
                    &ldquo;{heard}&rdquo;
                  </p>
                ) : spoken ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-[1.25] text-slate-300" data-testid="quick-voice-response" data-purpose="quick-voice-response">
                    <span className="font-medium text-cyan-200/80">Calby: </span>{spoken}
                  </p>
                ) : subStatus ? (
                  <p className="mt-1 truncate text-[10px] text-slate-500" data-purpose="quick-voice-substatus">{subStatus}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
