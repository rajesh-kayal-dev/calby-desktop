import { GoogleGenAI, type LiveServerMessage } from '@google/genai'
import { CredentialService } from './credential.service'
import { ActionExecutor } from './action-executor'
import { getVoiceTrace } from './voice-trace'
import { sendVoiceEvent } from './voice-owner'
import { ConfigService, DEFAULT_CALBY_INSTRUCTION } from './config.service'
import {
  GEMINI_LIVE_MODEL,
  createGeminiSpeechConfig,
  isSupportedGeminiVoice,
  DEFAULT_GEMINI_VOICE
} from './gemini.config'

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'action_result'
  | 'error'

export interface VoiceStateInfo {
  state: VoiceState
  metadata?: Record<string, unknown>
}

export interface VoiceTranscriptPayload {
  role: 'user' | 'assistant'
  text: string
  isFinal?: boolean
}

export interface VoiceErrorPayload {
  code: string
  message: string
}

const IDLE_TIMEOUT_MS = 60 * 1000 // 60 seconds of inactivity before tearing down live session
const CONNECT_TIMEOUT_MS = 10 * 1000 // 10s timeout for WebSocket connection setup

const DEFAULT_LIVE_ERROR_MESSAGE =
  "Calby's AI service has reached its current usage limit. Please try again later."
const CONNECT_TIMEOUT_MESSAGE =
  "Can't reach Gemini right now. Check your internet connection."

/** Redacts anything that could leak credentials (API key / WebSocket ?key=...). */
function sanitizeForLog(value: unknown): unknown {
  const redact = (input: string): string =>
    input
      .replace(/([?&](?:key|api_key|apikey|access_token)=)[^&\s"']+/gi, '$1[REDACTED]')
      .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED]')

  if (value instanceof Error) {
    const copy = new Error(redact(value.message))
    copy.name = value.name
    copy.stack = value.stack ? redact(value.stack) : value.stack
    return copy
  }
  if (typeof value === 'string') return redact(value)
  return value
}

const PREVIEW_PHRASES = [
  "What's on your mind?",
  'How can I help you today?',
  'What would you like to get done?',
  'Need a hand with something?',
  'What can I help you with?',
  'What are you thinking about?',
  'Ready when you are.',
  'Tell me what you need.'
] as const

export class AiVoiceService {
  private static instance: AiVoiceService | null = null
  private credentialService: CredentialService
  private actionExecutor: ActionExecutor
  private configService: ConfigService
  private state: VoiceState = 'idle'
  private stateMetadata?: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private activeSession: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private previewSession: any = null
  /** Single-flight guard: at most one connection attempt / Live session at a time. */
  private connectPromise: Promise<void> | null = null
  /** Settles an in-flight connection attempt as soon as it is torn down. */
  private pendingConnectReject: ((reason: Error) => void) | null = null
  /** Invalidates callbacks belonging to sessions that were already cleaned up. */
  private sessionEpoch: number = 0
  private resumptionHandle: string | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private connectTimer: ReturnType<typeof setTimeout> | null = null
  private lastPreviewPhraseIndex: number = -1
  /** Aggregate-only diagnostics for the active microphone turn; never stores audio samples. */
  private inputAudioDiagnostics = {
    chunks: 0,
    samples: 0,
    bytes: 0,
    sumSquares: 0,
    min: 32767,
    max: -32768
  }

  private constructor() {
    this.credentialService = CredentialService.getInstance()
    this.actionExecutor = ActionExecutor.getInstance()
    this.configService = ConfigService.getInstance()
  }

  private getNextPreviewPhrase(): string {
    let nextIndex: number
    if (PREVIEW_PHRASES.length <= 1) {
      nextIndex = 0
    } else {
      do {
        nextIndex = Math.floor(Math.random() * PREVIEW_PHRASES.length)
      } while (nextIndex === this.lastPreviewPhraseIndex)
    }
    this.lastPreviewPhraseIndex = nextIndex
    return PREVIEW_PHRASES[nextIndex]
  }

  public static getInstance(): AiVoiceService {
    if (!AiVoiceService.instance) {
      AiVoiceService.instance = new AiVoiceService()
    }
    return AiVoiceService.instance
  }

  public getState(): VoiceStateInfo {
    return {
      state: this.state,
      metadata: this.stateMetadata
    }
  }

  private setState(newState: VoiceState, metadata?: Record<string, unknown>): void {
    this.state = newState
    this.stateMetadata = metadata
    this.broadcast('voice:state-changed', {
      state: this.state,
      metadata: this.stateMetadata
    })
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }

    this.idleTimer = setTimeout(() => {
      console.log('[AiVoiceService] Idle timeout reached. Disconnecting session.')
      void this.stopSession()
    }, IDLE_TIMEOUT_MS)
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
  }

  private broadcast(channel: string, ...args: unknown[]): void {
    // Voice events only reach the window that owns the session, so two
    // renderers can never both drive (or play back) the same Live session.
    sendVoiceEvent(channel, ...args)
  }

  /** Reports tool execution progress (start / clarify / done) to the owner window. */
  private broadcastActionProgress(phase: 'start' | 'clarify' | 'complete' | 'failed', tool: string): void {
    sendVoiceEvent('voice:action-progress', { phase, tool })
    getVoiceTrace().record('execution', { tool, phase })
  }

  /**
   * Starts the Gemini Live session.
   *
   * Only one connection attempt (and therefore one Live session) may exist at a
   * time: concurrent callers join the in-flight attempt instead of opening a
   * second WebSocket, which lets the high frequency audio path call this safely.
   */
  public async startSession(): Promise<void> {
    if (this.connectPromise) {
      await this.connectPromise
      return
    }

    if (this.activeSession) {
      console.log('[AiVoiceService] Live session already active.')
      return
    }

    const attempt = this.openSession()
    this.connectPromise = attempt
    try {
      await attempt
    } finally {
      if (this.connectPromise === attempt) {
        this.connectPromise = null
      }
    }
  }

  private async openSession(): Promise<void> {
    const apiKey = await this.credentialService.getApiKey()
    if (!apiKey) {
      const msg = 'Gemini API key is not configured.'
      this.setState('error', { code: 'NO_API_KEY', message: msg })
      this.broadcast('voice:error', { code: 'NO_API_KEY', message: msg })
      throw new Error(msg)
    }

    console.log('[AiVoiceService] Gemini API key loaded.')

    // New connection generation: callbacks belonging to older sessions no-op.
    const epoch = ++this.sessionEpoch
    this.setState('idle', { statusText: 'Connecting to Gemini...' })

    // Keep exactly one Live socket open: drop a running voice preview first.
    this.closePreviewSession()

    // The SDK only settles `connect()` once setupComplete arrives, so a rejected
    // setup (bad model, auth failure, dropped socket) would otherwise hang the
    // attempt forever. This deferred lets the connect timeout and
    // cleanupSession() settle the attempt so callers are never left waiting.
    let rejectSetup: (reason: Error) => void = () => {}
    const setupFailed = new Promise<never>((_resolve, reject) => {
      rejectSetup = reject
    })
    // Keep a handler attached even if the race below is never reached.
    setupFailed.catch(() => undefined)
    this.pendingConnectReject = rejectSetup

    try {
      const ai = new GoogleGenAI({ apiKey })

      // Setup connection timeout
      if (this.connectTimer) clearTimeout(this.connectTimer)
      this.connectTimer = setTimeout(() => {
        console.error('[AiVoiceService] Connection setup timed out')
        rejectSetup(new Error('CONNECTION_TIMEOUT'))
      }, CONNECT_TIMEOUT_MS)

      const tools = [
        {
          functionDeclarations: this.actionExecutor.getToolDeclarations()
        }
      ]

      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const nowIso = new Date().toISOString()
      const voiceSettings = this.configService.getVoiceSettings()
      const personalize = this.configService.getPersonalize()

      const baseBehavior =
        personalize.userInstructions && personalize.userInstructions.trim().length > 0
          ? personalize.userInstructions.trim()
          : DEFAULT_CALBY_INSTRUCTION

      const personalizationItems: string[] = []
      if (personalize.userName && personalize.userName.trim()) {
        personalizationItems.push(`- Preferred user name: ${personalize.userName.trim()}`)
      }
      if (personalize.userTone && personalize.userTone.trim()) {
        personalizationItems.push(`- Preferred conversation tone/style: ${personalize.userTone.trim()}`)
      }
      if (personalize.userAbout && personalize.userAbout.trim()) {
        personalizationItems.push(`- About the user: ${personalize.userAbout.trim()}`)
      }

      const userContextSection =
        personalizationItems.length > 0
          ? `\n\nUser Personalization:\n${personalizationItems.join('\n')}`
          : ''

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveConfig: any = {
        responseModalities: ['AUDIO'],
        speechConfig: createGeminiSpeechConfig(voiceSettings.voiceName),
        tools,
        systemInstruction: {
          parts: [
            {
              text: `${baseBehavior}${userContextSection}

Never output markdown asterisks or bullet formatting in spoken speech.

Current reference time: ${nowIso} (User timezone: ${userTimeZone}).

Time reporting rules:
- Every calendar event returned by tools already includes startHumanReadable / endHumanReadable and an explicit timeZone. Read those strings back to the user VERBATIM — never convert them, never compute a timezone offset yourself, and never report a UTC value as local time.
- Never treat reminder information (reminders, lead times, minutes before) as the event's start time. The event start is only ever startHumanReadable / startDateTime.
- If a tool response includes needsClarification or ambiguous with a list of candidates, ask the user which one they mean. Never guess between multiple matches.

Capabilities and available tools:
1. Google Calendar:
- Use "get_upcoming_events" with the "range" argument ("today", "tomorrow", "this_week", or "next_7_days") when the user asks about their schedule, meetings, agenda, or events (e.g., "What meetings do I have tomorrow?" -> range: "tomorrow", "What is on my calendar today?" -> range: "today", "What do I have this week?" -> range: "this_week").
- If Google Calendar is not connected, the tool returns a notice; inform the user to connect Google Calendar in Settings.
- If the tool reports it cannot reach Google Calendar, tell the user to check their internet connection — do NOT say the calendar is disconnected.
- Use "create_calendar_event" to add an event, "update_calendar_event" to change one, and "delete_calendar_event" to remove one. Prefer passing eventId (from get_upcoming_events); a title works too, but if several events match you must ask which one.
- Never claim an event was created, changed, or deleted unless the tool result has success: true. Relay any failure honestly.
2. Reminders:
- When the user asks to set, create, or schedule a reminder (e.g. "Remind me tomorrow at 10 AM", "Remind me one hour before my 10 AM meeting"), resolve relative times against the reference time into a precise ISO 8601 UTC date string and call "create_reminder".
- When the reminder is about a calendar event, pass eventId and leadMinutes (e.g. 5 for "5 minutes before") — the idempotency system uses them to avoid duplicates. Creating the same reminder twice simply returns the existing one; tell the user it was already set.
- You can also list, cancel, snooze, or edit reminders using "list_reminders", "delete_reminder" (alias: "cancel_reminder"), "snooze_reminder", and "update_reminder".
- Never claim a reminder was created, changed, or deleted unless the tool result has success: true. Relay any failure honestly.
3. Personal Memory:
- When the user explicitly asks you to remember or store a note, fact, person, or preference (e.g. "Remember that Rahul is handling the payment module", "Save note: my favorite coffee is flat white"), call "create_memory". Do NOT automatically create memories from casual conversation unless explicitly instructed.
- When the user asks what you remember or asks about their saved context/people/preferences (e.g. "What should I remember about Rahul?"), call "search_memory" or "list_memories".
4. Cross-domain queries:
- If the user asks a combined question (e.g. "What do I have tomorrow and what should I remember about Rahul?"), invoke the relevant tools (e.g. "get_upcoming_events" with range and "search_memory") to provide a cohesive, concise spoken answer.

Never invent data or perform background actions without tool execution. If required information is missing, ask a concise clarifying question.`
            }
          ]
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        sessionResumption: this.resumptionHandle ? { handle: this.resumptionHandle } : {}
      }

      const pendingConnect = ai.live.connect({
        model: GEMINI_LIVE_MODEL,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            if (epoch !== this.sessionEpoch) return
            console.log('[DIAG] Live session socket opened')
            getVoiceTrace().record('session', { event: 'opened', model: GEMINI_LIVE_MODEL })
          },
          onmessage: (msg: LiveServerMessage) => {
            if (epoch !== this.sessionEpoch) return
            void this.handleServerMessage(msg)
          },
          onerror: (err: unknown) => {
            if (epoch !== this.sessionEpoch) return
            console.error('[AiVoiceService] Gemini Live session error:', sanitizeForLog(err))
            this.failSession('LIVE_API_ERROR')
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onclose: (e: any) => {
            if (epoch !== this.sessionEpoch) return
            console.log(`[AiVoiceService] Gemini Live session closed (code=${e?.code})`)

            const closeCode = typeof e?.code === 'number' ? e.code : null
            const closeReason = typeof e?.reason === 'string' ? e.reason.trim() : ''
            const isErrorClose = Boolean(
              (closeCode && closeCode !== 1000 && closeCode !== 1005) ||
              closeReason.length > 0
            )

            if (isErrorClose) {
              console.error(
                `[AiVoiceService] Gemini Live closed with error: code=${closeCode}, reason="${sanitizeForLog(closeReason)}"`
              )
              this.failSession('LIVE_API_ERROR')
              return
            }

            if (!this.activeSession) {
              // Closed before setup completed -> the attempt itself failed.
              console.error('[AiVoiceService] Live connection closed before setup completed')
              this.failSession('CONNECTION_FAILED')
              return
            }

            // Clean close of an established session: tear everything down but
            // keep the resumption handle so context survives the next start.
            this.cleanupSession()
            if (this.state !== 'error') {
              this.setState('idle')
            }
          }
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let session: any
      try {
        session = await Promise.race([pendingConnect, setupFailed])
      } catch (err) {
        // Setup failed/timed out: if it completes later, drop that socket so a
        // stale connection can never outlive this attempt.
        void pendingConnect
          .then((lateSession) => {
            try {
              lateSession.close()
            } catch {
              // socket already closed
            }
          })
          .catch(() => undefined)
        throw err
      }

      if (epoch !== this.sessionEpoch) {
        // Session was stopped or failed while it was still connecting.
        console.log('[AiVoiceService] Discarding stale Gemini Live connection.')
        try {
          session.close()
        } catch {
          // socket already closed
        }
        return
      }

      this.activeSession = session
      this.resetInputAudioDiagnostics()
      if (this.connectTimer) clearTimeout(this.connectTimer)
      this.setState('listening')
      this.resetIdleTimer()
    } catch (err) {
      // onclose/onerror/stopSession may already have cleaned up and reported.
      if (epoch !== this.sessionEpoch) return

      console.error('[AiVoiceService] Failed to establish Live session:', sanitizeForLog(err))
      const isTimeout = err instanceof Error && err.message === 'CONNECTION_TIMEOUT'
      this.failSession(
        isTimeout ? 'CONNECTION_TIMEOUT' : 'CONNECTION_FAILED',
        isTimeout ? CONNECT_TIMEOUT_MESSAGE : DEFAULT_LIVE_ERROR_MESSAGE
      )
    } finally {
      if (this.connectTimer) {
        clearTimeout(this.connectTimer)
        this.connectTimer = null
      }
      if (this.pendingConnectReject === rejectSetup) {
        this.pendingConnectReject = null
      }
    }
  }

  public async sendTextInput(text: string): Promise<void> {
    if (!this.activeSession) {
      await this.startSession()
    }

    if (this.activeSession) {
      console.log('[DIAG] Text input sent:', text)
      this.setState('processing')
      this.resetIdleTimer()
      this.activeSession.sendRealtimeInput({
        text
      })
    }
  }

  public finishTurn(): void {
    if (this.activeSession) {
      try {
        const diagnostics = this.inputAudioDiagnostics
        const rms = diagnostics.samples > 0 ? Math.sqrt(diagnostics.sumSquares / diagnostics.samples) : 0
        console.log('[VOICE][AUDIO]', {
          inputSampleRate: 16000,
          outputSampleRate: 16000,
          channelCount: 1,
          pcmChunks: diagnostics.chunks,
          pcmSamples: diagnostics.samples,
          totalPcmBytes: diagnostics.bytes,
          rms: Number(rms.toFixed(6)),
          min: diagnostics.samples > 0 ? diagnostics.min : 0,
          max: diagnostics.samples > 0 ? diagnostics.max : 0
        })
        // sendRealtimeInput audio is a realtime stream, not client content.
        // Closing it with audioStreamEnd lets Gemini finalize exactly the PCM
        // that was sent, and preserves input-transcription events.
        this.activeSession.sendRealtimeInput({ audioStreamEnd: true })
        console.log('[VOICE][GEMINI] audio stream end sent')
        this.resetInputAudioDiagnostics()
      } catch (err) {
        console.error('[VOICE][GEMINI] Failed to end audio stream:', sanitizeForLog(err))
      }
    }
  }

  private async handleServerMessage(msg: LiveServerMessage): Promise<void> {
    this.resetIdleTimer()

    // 1. Session Resumption Token
    if (msg.sessionResumptionUpdate?.newHandle) {
      this.resumptionHandle = msg.sessionResumptionUpdate.newHandle
    }

    // 2. Handle Tool Calls from Gemini Live
    if (msg.toolCall) {
      const toolCall = msg.toolCall
      console.log('[AiVoiceService] Received toolCall from Gemini:', toolCall)
      this.setState('processing')

      if (toolCall.functionCalls && toolCall.functionCalls.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responses: any[] = []

        for (const fc of toolCall.functionCalls) {
          const toolName = fc.name || ''
          console.log('[VOICE][GEMINI] tool=', toolName, 'args=', fc.args || {})
          getVoiceTrace().record('tool_selected', { name: toolName })
          getVoiceTrace().record('tool_args', { name: toolName, args: fc.args || {} })
          this.broadcastActionProgress('start', toolName)
          const result = await this.actionExecutor.executeTool(
            toolName,
            (fc.args || {}) as Record<string, unknown>
          )
          getVoiceTrace().record('result', { name: toolName, success: result.success })

          responses.push({
            id: fc.id,
            name: toolName,
            response: {
              output: result
            }
          })

          if (result.success) {
            if (toolName === 'create_reminder') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const reminderData = result.data as any
              const alreadyExisted = reminderData?.alreadyExisted === true
              this.setState('action_result', {
                title: alreadyExisted ? 'Reminder already set' : 'Reminder scheduled',
                subtitle: alreadyExisted
                  ? `"${reminderData?.title || 'Reminder'}" already exists.`
                  : `"${reminderData?.title || 'Reminder'}" set successfully.`
              })
            } else if (toolName === 'cancel_reminder' || toolName === 'delete_reminder') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const reminderData = result.data as any
              this.setState('action_result', {
                title: 'Reminder cancelled',
                subtitle: `"${reminderData?.title || 'Reminder'}" removed.`
              })
            } else if (toolName === 'update_reminder') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const reminderData = result.data as any
              this.setState('action_result', {
                title: 'Reminder updated',
                subtitle: `"${reminderData?.title || 'Reminder'}" updated.`
              })
            } else if (toolName === 'create_calendar_event') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const evt = result.data as any
              this.setState('action_result', {
                title: 'Event created',
                subtitle: `"${evt?.title || 'Event'}" added to your calendar.`
              })
            } else if (toolName === 'update_calendar_event') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const evt = result.data as any
              this.setState('action_result', {
                title: 'Event updated',
                subtitle: `"${evt?.title || 'Event'}" updated.`
              })
            } else if (toolName === 'delete_calendar_event') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const evt = result.data as any
              this.setState('action_result', {
                title: 'Event deleted',
                subtitle: `"${evt?.title || 'Event'}" removed from your calendar.`
              })
            } else if (toolName === 'snooze_reminder') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const snoozeData = result.data as any
              this.setState('action_result', {
                title: 'Reminder snoozed',
                subtitle: `Snoozed for ${snoozeData?.minutes || 5} minutes.`
              })
            } else if (toolName === 'create_memory') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const memoryData = result.data as any
              this.setState('action_result', {
                title: 'Saved to memory',
                subtitle: `"${memoryData?.content || 'Note'}" stored.`
              })
            } else if (toolName === 'get_upcoming_events') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const eventData = result.data as any
              if (eventData?.notConnected) {
                this.setState('action_result', {
                  title: 'Calendar disconnected',
                  subtitle: 'Connect Google Calendar in Settings.'
                })
              } else {
                const count = typeof eventData?.count === 'number' ? eventData.count : (eventData?.events?.length || 0)
                this.setState('action_result', {
                  title: 'Calendar checked',
                  subtitle:
                    count === 0
                      ? 'No upcoming events found.'
                      : `Found ${count} event${count === 1 ? '' : 's'}.`
                })
              }
            }
          }
          this.broadcastActionProgress(
            result.needsClarification ? 'clarify' : result.success ? 'complete' : 'failed',
            toolName
          )
        }

        if (this.activeSession && responses.length > 0) {
          try {
            console.log('[AiVoiceService] Sending toolResponse to Gemini:', responses)
            this.activeSession.sendToolResponse({
              functionResponses: responses
            })
          } catch (err) {
            console.error('[AiVoiceService] Failed to send tool response:', sanitizeForLog(err))
          }
        }
      }
      return
    }

    if (msg.serverContent) {
      const content = msg.serverContent

      // Interruption signal (Barge-in by user)
      if (content.interrupted) {
        console.log('[VOICE][GEMINI] server signaled interruption')
        this.broadcast('voice:interrupted')
        this.setState('listening')
      }

      // Interim User Input Transcription
      if (content.interimInputTranscription?.text) {
        this.broadcast('voice:transcript', {
          role: 'user',
          text: content.interimInputTranscription.text,
          isFinal: false
        })
        if (this.state !== 'listening') {
          this.setState('listening')
        }
      }

      // Final User Input Transcription
      if (content.inputTranscription?.text) {
        console.log(`[VOICE][USER] "${content.inputTranscription.text}"`)
        getVoiceTrace().record('heard', { text: content.inputTranscription.text })
        this.broadcast('voice:transcript', {
          role: 'user',
          text: content.inputTranscription.text,
          isFinal: true
        })
        if (this.state === 'listening') {
          this.setState('processing')
        }
      }

      // Model Output Audio & Text
      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.inlineData?.data) {
            this.broadcast('voice:audio-chunk', part.inlineData.data)
            if (this.state !== 'speaking') {
              this.setState('speaking')
            }
          }
          if (part.text) {
            console.log(`[VOICE][GEMINI] outputTranscript="${part.text}"`)
            this.broadcast('voice:transcript', {
              role: 'assistant',
              text: part.text,
              isFinal: false
            })
          }
        }
      }

      // Model Output Transcription
      if (content.outputTranscription?.text) {
        console.log(`[VOICE][GEMINI] outputTranscript="${content.outputTranscription.text}"`)
        if (content.outputTranscription.finished) {
          getVoiceTrace().record('final_response', { text: content.outputTranscription.text })
        }
        this.broadcast('voice:transcript', {
          role: 'assistant',
          text: content.outputTranscription.text,
          isFinal: Boolean(content.outputTranscription.finished)
        })
        if (this.state !== 'speaking') {
          this.setState('speaking')
        }
      }

      // Turn Complete
      if (content.turnComplete) {
        console.log('[VOICE][GEMINI] turnComplete server signal received')
        getVoiceTrace().record('final_response', { signal: 'turnComplete' })
        this.broadcast('voice:turn-complete')
      }
    }
  }

  private lastAudioSentLogTime: number = 0

  public async sendAudioChunk(chunkBase64: string): Promise<void> {
    if (!this.activeSession) {
      // Never kick off a reconnect from the high frequency audio path: a failed
      // session has to be retried explicitly ("Try Again"), and while an attempt
      // is in flight there is nothing to send to yet.
      if (this.connectPromise || this.state === 'error') return
      await this.startSession()
    }

    if (this.activeSession) {
      this.resetIdleTimer()
      try {
        const pcm = Buffer.from(chunkBase64, 'base64')
        // The renderer produces Int16Array-backed bytes. Node runs on the
        // same little-endian desktop platforms supported by Electron, so
        // readInt16LE verifies aggregate values without retaining raw audio.
        for (let offset = 0; offset + 1 < pcm.length; offset += 2) {
          const sample = pcm.readInt16LE(offset)
          this.inputAudioDiagnostics.samples += 1
          this.inputAudioDiagnostics.sumSquares += sample * sample
          this.inputAudioDiagnostics.min = Math.min(this.inputAudioDiagnostics.min, sample)
          this.inputAudioDiagnostics.max = Math.max(this.inputAudioDiagnostics.max, sample)
        }
        this.inputAudioDiagnostics.chunks += 1
        this.inputAudioDiagnostics.bytes += pcm.length
        const now = Date.now()
        if (now - this.lastAudioSentLogTime > 1000) {
          this.lastAudioSentLogTime = now
          console.log('[VOICE][GEMINI] inputAudioSent')
        }
        this.activeSession.sendRealtimeInput({
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: chunkBase64
          }
        })
        if (this.state === 'idle' || this.state === 'action_result') {
          this.setState('listening')
        }
      } catch (err) {
        console.error('[VOICE][GEMINI] Failed to send audio chunk:', sanitizeForLog(err))
        // Full teardown so the next explicit start creates a fresh session.
        this.failSession('AUDIO_CHUNK_SEND_FAILED')
      }
    }
  }

  private resetInputAudioDiagnostics(): void {
    this.inputAudioDiagnostics = {
      chunks: 0,
      samples: 0,
      bytes: 0,
      sumSquares: 0,
      min: 32767,
      max: -32768
    }
  }

  public interrupt(): void {
    console.log('[AiVoiceService] Client requested interrupt')
    this.broadcast('voice:interrupted')
    this.setState('listening')
    this.resetIdleTimer()
  }

  public async previewVoice(
    voiceName: string
  ): Promise<{ audioBase64: string; mimeType: string }> {
    const validVoice = isSupportedGeminiVoice(voiceName) ? voiceName : DEFAULT_GEMINI_VOICE

    console.log(`[AiVoiceService] previewVoice started: voice = ${validVoice}, model = ${GEMINI_LIVE_MODEL}`)

    const apiKey = await this.credentialService.getApiKey()
    if (!apiKey) {
      const err = new Error('Gemini API key is not configured.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(err as any).code = 'NO_API_KEY'
      throw err
    }

    console.log('[AiVoiceService] Gemini API key loaded.')

    // One Live session at a time: stop the conversation session (its resumption
    // handle is kept, so context survives) and any earlier preview first.
    if (this.activeSession || this.connectPromise) {
      await this.stopSession()
    }
    this.closePreviewSession()

    const ai = new GoogleGenAI({ apiKey })

    const speechConfig = createGeminiSpeechConfig(validVoice)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liveConfig: any = {
      responseModalities: ['AUDIO'],
      speechConfig
    }

    return new Promise<{ audioBase64: string; mimeType: string }>((resolve, reject) => {
      let isSettled = false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let previewSession: any = null
      const audioChunks: string[] = []
      let receivedAudioThisSession = false
      let timeoutTimer: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer)
          timeoutTimer = null
        }
        if (previewSession) {
          const closing = previewSession
          previewSession = null
          if (this.previewSession === closing) {
            this.previewSession = null
          }
          try {
            closing.close()
          } catch {
            // session might already be closed
          }
        }
      }

      timeoutTimer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true
          cleanup()
          console.error('[AiVoiceService] previewVoice timed out for voice:', validVoice)
          const err = new Error("Couldn't connect to Gemini. Check your internet connection.")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(err as any).code = 'CONNECTION_TIMEOUT'
          reject(err)
        }
      }, 10000)

      ai.live
        .connect({
          model: GEMINI_LIVE_MODEL,
          config: liveConfig,
          callbacks: {
            onopen: () => {
              console.log('[AiVoiceService] previewVoice socket opened')
            },
            onmessage: (msg: LiveServerMessage) => {
              if (msg.serverContent?.modelTurn?.parts) {
                for (const part of msg.serverContent.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    audioChunks.push(part.inlineData.data)
                    if (!receivedAudioThisSession) {
                      receivedAudioThisSession = true
                      console.log('[AiVoiceService] previewVoice received audio')
                    }
                  }
                }
              }

              if (msg.serverContent?.turnComplete) {
                console.log('[AiVoiceService] previewVoice turn complete')
                if (!isSettled) {
                  isSettled = true
                  cleanup()
                  if (audioChunks.length > 0) {
                    const buffers = audioChunks.map((c) => Buffer.from(c, 'base64'))
                    const combined = Buffer.concat(buffers)
                    resolve({
                      audioBase64: combined.toString('base64'),
                      mimeType: 'audio/pcm;rate=24000'
                    })
                  } else {
                    const err = new Error('Gemini returned no audio for this preview.')
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ;(err as any).code = 'NO_AUDIO'
                    reject(err)
                  }
                }
              }
            },
            onerror: (err: unknown) => {
              if (!isSettled) {
                isSettled = true
                cleanup()
                const errMsg = err instanceof Error ? err.message : String(err)
                console.error('[AiVoiceService] previewVoice onerror:', sanitizeForLog(errMsg))
                const lower = errMsg.toLowerCase()
                const isAuth =
                  lower.includes('auth') ||
                  lower.includes('401') ||
                  lower.includes('403') ||
                  lower.includes('api key')
                const isModel =
                  lower.includes('404') ||
                  lower.includes('not_found') ||
                  lower.includes('model not found')

                const error = new Error(
                  isAuth
                    ? 'Your Gemini API key could not be authenticated.'
                    : isModel
                    ? "Calby's voice service is temporarily unavailable."
                    : "Couldn't connect to Gemini. Check your internet connection."
                )
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(error as any).code = isAuth ? 'AUTH_FAILED' : isModel ? 'MODEL_NOT_FOUND' : 'LIVE_ERROR'
                reject(error)
              }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onclose: (e: any) => {
              console.log(
                `[AiVoiceService] previewVoice session closed (code=${e?.code}, reason=${sanitizeForLog(
                  e?.reason || 'normal'
                )})`
              )
              if (!isSettled) {
                isSettled = true
                cleanup()
                if (audioChunks.length > 0) {
                  const buffers = audioChunks.map((c) => Buffer.from(c, 'base64'))
                  const combined = Buffer.concat(buffers)
                  resolve({
                    audioBase64: combined.toString('base64'),
                    mimeType: 'audio/pcm;rate=24000'
                  })
                } else {
                  const err = new Error('Gemini returned no audio for this preview.')
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ;(err as any).code = 'NO_AUDIO'
                  reject(err)
                }
              }
            }
          }
        })
        .then((session) => {
          previewSession = session
          this.previewSession = session
          console.log('[AiVoiceService] previewVoice session connected')
          try {
            const phrase = this.getNextPreviewPhrase()
            session.sendRealtimeInput({
              text: phrase
            })
            console.log(`[AiVoiceService] previewVoice sent text: "${phrase}"`)
          } catch (err) {
            console.error(
              '[AiVoiceService] Error sending preview realtime input:',
              sanitizeForLog(err)
            )
          }
        })
        .catch((err) => {
          if (!isSettled) {
            isSettled = true
            cleanup()
            const errMsg = err instanceof Error ? err.message : String(err)
            console.error('[AiVoiceService] previewVoice connect failed:', sanitizeForLog(errMsg))
            const lower = errMsg.toLowerCase()
            const isAuth =
              lower.includes('auth') ||
              lower.includes('401') ||
              lower.includes('403') ||
              lower.includes('api key')
            const isModel =
              lower.includes('404') ||
              lower.includes('not_found') ||
              lower.includes('model not found')

            const error = new Error(
              isAuth
                ? 'Your Gemini API key could not be authenticated.'
                : isModel
                ? "Calby's voice service is temporarily unavailable."
                : "Couldn't connect to Gemini. Check your internet connection."
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(error as any).code = isAuth ? 'AUTH_FAILED' : isModel ? 'MODEL_NOT_FOUND' : 'CONNECTION_FAILED'
            reject(error)
          }
        })
    })
  }

  public async stopSession(): Promise<void> {
    // cleanupSession() invalidates every callback of the session being closed,
    // so its asynchronous onclose can no longer overwrite the idle state below.
    this.cleanupSession()
    this.setState('idle')
  }

  /**
   * Fully tears down the current session or connection attempt: timers, socket,
   * single-flight guard and (on failure) the resumption handle, so the next
   * explicit start always creates a brand new session.
   */
  private cleanupSession(options: { resetResumption?: boolean } = {}): void {
    // Everything still belonging to the outgoing generation becomes a no-op.
    this.sessionEpoch++

    if (this.connectTimer) {
      clearTimeout(this.connectTimer)
      this.connectTimer = null
    }
    this.clearIdleTimer()

    if (this.activeSession) {
      try {
        this.activeSession.close()
      } catch (err) {
        console.error('[AiVoiceService] Error closing session:', sanitizeForLog(err))
      }
      this.activeSession = null
    }

    // Settle an in-flight connect() so startSession() callers are never stuck.
    const rejectSetup = this.pendingConnectReject
    if (rejectSetup) {
      this.pendingConnectReject = null
      rejectSetup(new Error('SESSION_CLEANED_UP'))
    }

    if (options.resetResumption) {
      this.resumptionHandle = null
    }
  }

  /** Reports a failure only after a full teardown, so "Try Again" starts fresh. */
  private failSession(code: string, message: string = DEFAULT_LIVE_ERROR_MESSAGE): void {
    this.cleanupSession({ resetResumption: true })
    this.setState('error', { code, message })
    this.broadcast('voice:error', { code, message })
  }

  private closePreviewSession(): void {
    const session = this.previewSession
    if (!session) return
    this.previewSession = null
    try {
      session.close()
    } catch (err) {
      console.error('[AiVoiceService] Error closing preview session:', sanitizeForLog(err))
    }
  }
}
