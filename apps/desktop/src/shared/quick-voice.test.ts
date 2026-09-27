import { describe, it, expect } from 'vitest'
import {
  ACTIVATION_SHORTCUT,
  DEFAULT_QUICK_VOICE_SHORTCUT,
  deriveQuickVoiceState,
  formatAccelerator,
  nextTurnAnswered,
  progressLabelForTool,
  shouldAutoClose,
  statusLineFor,
  subStatusFor,
  type QuickVoiceState,
  type VoiceActionPhase
} from './quick-voice'

const ALL_STATES: QuickVoiceState[] = [
  'idle',
  'listening',
  'thinking',
  'acting',
  'responding',
  'success',
  'error',
  'awaiting_input'
]

const ALL_PHASES: Array<VoiceActionPhase | null> = [
  null,
  'start',
  'clarify',
  'complete',
  'failed'
]

/** Copy the user can never be shown. */
const FORBIDDEN = [
  'gemini',
  'websocket',
  'toolcall',
  'tool_call',
  ' api',
  'apikey',
  'stack',
  'undefined',
  'null'
]

describe('deriveQuickVoiceState', () => {
  it('maps every existing voice state without a tool phase', () => {
    expect(deriveQuickVoiceState('idle', null)).toBe('idle')
    expect(deriveQuickVoiceState('listening', null)).toBe('listening')
    expect(deriveQuickVoiceState('processing', null)).toBe('thinking')
    expect(deriveQuickVoiceState('speaking', null)).toBe('responding')
    expect(deriveQuickVoiceState('action_result', null)).toBe('success')
    expect(deriveQuickVoiceState('error', null)).toBe('error')
  })

  it('shows `acting` while a tool is running', () => {
    expect(deriveQuickVoiceState('processing', 'start')).toBe('acting')
  })

  it('stays open for user input when the tool needs clarification', () => {
    for (const voiceState of ['processing', 'speaking', 'idle', 'action_result'] as const) {
      expect(deriveQuickVoiceState(voiceState, 'clarify')).toBe('awaiting_input')
    }
  })

  it('never regresses below `awaiting_input` while clarifying', () => {
    // A stale/late `processing` event must not kick the window out of
    // awaiting_input, because Calby is still waiting for the user's answer.
    expect(deriveQuickVoiceState('idle', 'clarify')).toBe('awaiting_input')
  })

  it('lets `error` win over every phase', () => {
    for (const phase of ALL_PHASES) {
      expect(deriveQuickVoiceState('error', phase)).toBe('error')
    }
  })

  it('ignores unknown/stale voice states instead of throwing', () => {
    expect(deriveQuickVoiceState('disposed', null)).toBe('idle')
    expect(deriveQuickVoiceState('', 'complete')).toBe('idle')
  })

  it('only reports `acting` for an in-flight tool', () => {
    expect(deriveQuickVoiceState('processing', 'complete')).toBe('thinking')
    expect(deriveQuickVoiceState('processing', 'failed')).toBe('thinking')
    expect(deriveQuickVoiceState('processing', 'start')).toBe('acting')
  })

  it('produces a state for every (voiceState, phase) combination', () => {
    const voiceStates = ['idle', 'listening', 'processing', 'speaking', 'action_result', 'error']
    for (const voiceState of voiceStates) {
      for (const phase of ALL_PHASES) {
        expect(ALL_STATES).toContain(deriveQuickVoiceState(voiceState, phase))
      }
    }
  })
})

describe('turn tracking / auto-close', () => {
  it('closes only after an answered turn returns to idle', () => {
    let answered = false
    answered = nextTurnAnswered(answered, 'listening')
    expect(shouldAutoClose('idle', answered)).toBe(false)

    answered = nextTurnAnswered(answered, 'responding')
    expect(answered).toBe(true)
    expect(shouldAutoClose('idle', answered)).toBe(true)
  })

  it('closes after a successful action settles', () => {
    expect(nextTurnAnswered(false, 'success')).toBe(true)
    expect(shouldAutoClose('success', true)).toBe(false)
  })

  it('never closes while waiting for the user', () => {
    const answered = nextTurnAnswered(true, 'awaiting_input')
    expect(answered).toBe(false)
    expect(shouldAutoClose('idle', answered)).toBe(false)
  })

  it('never closes on error so the user can retry', () => {
    const answered = nextTurnAnswered(true, 'error')
    expect(answered).toBe(false)
    expect(shouldAutoClose('idle', answered)).toBe(false)
  })

  it('resets the answered flag when a new turn starts', () => {
    let answered = nextTurnAnswered(false, 'responding')
    expect(answered).toBe(true)
    answered = nextTurnAnswered(answered, 'listening')
    expect(answered).toBe(false)
    expect(shouldAutoClose('idle', answered)).toBe(false)
  })

  it('keeps the answered flag across thinking/acting', () => {
    let answered = nextTurnAnswered(false, 'responding')
    answered = nextTurnAnswered(answered, 'thinking')
    expect(answered).toBe(true)
    answered = nextTurnAnswered(answered, 'acting')
    expect(answered).toBe(true)
  })
})

describe('user-facing copy', () => {
  it('renders the required status lines', () => {
    expect(statusLineFor('listening')).toBe('Listening...')
    expect(statusLineFor('thinking')).toBe('Thinking...')
    expect(statusLineFor('acting', 'Creating your reminder...')).toBe('Creating your reminder...')
    expect(statusLineFor('awaiting_input')).toBe('I need a little more detail')
  })

  it('falls back to a generic progress label when the tool is unknown', () => {
    expect(statusLineFor('acting')).toBe('Working on it...')
    expect(statusLineFor('acting', '   ')).toBe('Working on it...')
  })

  it('maps calendar/reminder tools to friendly progress copy', () => {
    expect(progressLabelForTool('create_reminder')).toBe('Creating your reminder...')
    expect(progressLabelForTool('update_calendar_event')).toBe('Updating your calendar...')
    expect(progressLabelForTool('delete_calendar_event')).toBe('Deleting the event...')
    expect(progressLabelForTool('delete_reminder')).toBe('Deleting your reminder...')
    expect(progressLabelForTool('get_upcoming_events')).toBe('Checking your calendar...')
  })

  it('never leaks internals in any status line', () => {
    for (const state of ALL_STATES) {
      const lines = [statusLineFor(state), statusLineFor(state, 'Creating your reminder...'), subStatusFor(state)]
      for (const line of lines) {
        const lower = line.toLowerCase()
        for (const forbidden of FORBIDDEN) {
          expect(lower).not.toContain(forbidden)
        }
      }
    }
  })

  it('never leaks internals in any progress label', () => {
    const tools = [
      'create_reminder',
      'update_reminder',
      'delete_reminder',
      'cancel_reminder',
      'snooze_reminder',
      'list_reminders',
      'create_memory',
      'update_memory',
      'delete_memory',
      'search_memory',
      'list_memories',
      'create_calendar_event',
      'update_calendar_event',
      'delete_calendar_event',
      'get_upcoming_events',
      'some_future_tool'
    ]
    for (const tool of tools) {
      const label = progressLabelForTool(tool).toLowerCase()
      for (const forbidden of FORBIDDEN) {
        expect(label).not.toContain(forbidden)
      }
    }
  })
})

describe('shortcut helpers', () => {
  it('has a platform-neutral default accelerator', () => {
    expect(DEFAULT_QUICK_VOICE_SHORTCUT).toBe('CommandOrControl+Shift+C')
    expect(ACTIVATION_SHORTCUT).toBe('CommandOrControl+Shift+Space')
    expect(DEFAULT_QUICK_VOICE_SHORTCUT).not.toBe(ACTIVATION_SHORTCUT)
  })

  it('formats the accelerator for Windows/Linux', () => {
    expect(formatAccelerator(DEFAULT_QUICK_VOICE_SHORTCUT, 'win32')).toBe('Ctrl + Shift + C')
    expect(formatAccelerator(DEFAULT_QUICK_VOICE_SHORTCUT, 'linux')).toBe('Ctrl + Shift + C')
  })

  it('formats the accelerator for macOS', () => {
    expect(formatAccelerator(DEFAULT_QUICK_VOICE_SHORTCUT, 'MacIntel')).toBe('Cmd + Shift + C')
  })

  it('keeps explicit modifiers readable', () => {
    expect(formatAccelerator('Alt+K', 'win32')).toBe('Alt + K')
    expect(formatAccelerator('CommandOrControl+Shift+P', 'linux')).toBe('Ctrl + Shift + P')
  })
})
