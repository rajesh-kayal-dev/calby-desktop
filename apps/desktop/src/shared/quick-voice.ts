/**
 * Calby Quick Voice — pure rules shared by the main process (shortcut/config
 * defaults) and the renderer (floating-window state machine).
 *
 * This module must stay free of Electron/DOM side effects so it can be unit
 * tested in a plain Node environment.
 */

/** Default global accelerator: Ctrl+Shift+C on Windows/Linux, Cmd+Shift+C on macOS. */
export const DEFAULT_QUICK_VOICE_SHORTCUT = 'CommandOrControl+Shift+C'

/** Accelerator owned by the existing "activate Calby" shortcut — never shadow it. */
export const ACTIVATION_SHORTCUT = 'CommandOrControl+Shift+Space'

/**
 * Explicit Quick Voice window states. Transitions are derived (never guessed)
 * from the shared Gemini Live voice state plus the latest tool-progress phase.
 */
export type QuickVoiceState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'acting'
  | 'responding'
  | 'success'
  | 'error'
  | 'awaiting_input'

/** Progress reported by the ActionExecutor while a tool is running. */
export type VoiceActionPhase = 'start' | 'clarify' | 'complete' | 'failed'

/**
 * Deterministic mapping from the existing `VoiceState` + tool phase to the
 * Quick Voice state machine. Stale events can't move the window backwards:
 * the current voice state always wins except for `error` and `clarify`, which
 * are terminal for the current turn.
 */
export function deriveQuickVoiceState(
  voiceState: string,
  phase: VoiceActionPhase | null
): QuickVoiceState {
  if (voiceState === 'error') return 'error'
  // A clarifying question keeps the window open no matter what the model does next.
  if (phase === 'clarify') return 'awaiting_input'

  switch (voiceState) {
    case 'action_result':
      return 'success'
    case 'speaking':
      return 'responding'
    case 'processing':
      return phase === 'start' ? 'acting' : 'thinking'
    case 'listening':
      return 'listening'
    default:
      return 'idle'
  }
}

/** Short, non-technical status line shown in the floating window. */
export function statusLineFor(state: QuickVoiceState, progressLabel?: string): string {
  switch (state) {
    case 'idle':
      return 'Ready'
    case 'listening':
      return 'Listening...'
    case 'thinking':
      return 'Thinking...'
    case 'acting':
      return progressLabel && progressLabel.trim().length > 0 ? progressLabel : 'Working on it...'
    case 'responding':
      return 'Calby is responding'
    case 'success':
      return 'Done'
    case 'awaiting_input':
      return 'I need a little more detail'
    case 'error':
      return 'Something went wrong'
    default:
      return 'Ready'
  }
}

/** Extra explanation shown under the status line while the model is thinking. */
export function subStatusFor(state: QuickVoiceState): string {
  switch (state) {
    case 'listening':
      return 'Speak naturally — I am listening'
    case 'thinking':
      return 'Understanding your request'
    case 'awaiting_input':
      return 'Answer the question and I will continue'
    default:
      return ''
  }
}

const PROGRESS_LABELS: Record<string, string> = {
  create_reminder: 'Creating your reminder...',
  update_reminder: 'Updating your reminder...',
  delete_reminder: 'Deleting your reminder...',
  cancel_reminder: 'Cancelling your reminder...',
  snooze_reminder: 'Snoozing your reminder...',
  list_reminders: 'Checking your reminders...',
  create_calendar_event: 'Creating your event...',
  update_calendar_event: 'Updating your calendar...',
  delete_calendar_event: 'Deleting the event...',
  get_upcoming_events: 'Checking your calendar...',
  create_memory: 'Saving to memory...',
  update_memory: 'Updating your memory...',
  delete_memory: 'Deleting from memory...',
  search_memory: 'Searching your memory...',
  list_memories: 'Checking your memory...'
}

/** User-facing progress copy for a tool name. Never exposes tool internals. */
export function progressLabelForTool(tool: string): string {
  return PROGRESS_LABELS[tool] || 'Working on it...'
}

/**
 * Whether the current turn has been answered yet (response spoken or action
 * reported). Only an answered turn may auto-close the window.
 */
export function nextTurnAnswered(current: boolean, state: QuickVoiceState): boolean {
  if (state === 'responding' || state === 'success') return true
  if (state === 'listening' || state === 'awaiting_input' || state === 'error') return false
  return current
}

/** Window closes only after an answered turn falls back to idle. */
export function shouldAutoClose(state: QuickVoiceState, hasResponded: boolean): boolean {
  return state === 'idle' && hasResponded
}

/** Human-readable accelerator ("Ctrl + Shift + C" / "Cmd + Shift + C"). */
export function formatAccelerator(accelerator: string, platform?: string): string {
  const resolved =
    platform ??
    (typeof navigator !== 'undefined' && navigator.platform ? navigator.platform : '')
  const isMac = resolved.toLowerCase().includes('mac')

  return accelerator
    .replace(/CommandOrControl/gi, isMac ? 'Cmd' : 'Ctrl')
    .replace(/Control/gi, 'Ctrl')
    .replace(/Command/gi, 'Cmd')
    .replace(/Option/gi, 'Alt')
    .replace(/Alt/gi, 'Alt')
    .replace(/Shift/gi, 'Shift')
    .replace(/\s*\+\s*/g, ' + ')
}
