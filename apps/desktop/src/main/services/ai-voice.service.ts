import { BrowserWindow } from 'electron'
import { GoogleGenAI, type LiveServerMessage } from '@google/genai'
import { CredentialService } from './credential.service'
import { ActionExecutor } from './action-executor'
import { ConfigService } from './config.service'

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

export class AiVoiceService {
  private static instance: AiVoiceService | null = null
  private credentialService: CredentialService
  private actionExecutor: ActionExecutor
  private configService: ConfigService
  private state: VoiceState = 'idle'
  private stateMetadata?: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private activeSession: any = null
  private isConnecting: boolean = false
  private resumptionHandle: string | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private connectTimer: ReturnType<typeof setTimeout> | null = null

  private constructor() {
    this.credentialService = CredentialService.getInstance()
    this.actionExecutor = ActionExecutor.getInstance()
    this.configService = ConfigService.getInstance()
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
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args)
      }
    }
  }

  public async startSession(): Promise<void> {
    if (this.activeSession || this.isConnecting) {
      console.log('[AiVoiceService] Session already active or connecting.')
      return
    }

    const apiKey = await this.credentialService.getApiKey()
    if (!apiKey) {
      const msg = 'Gemini API key is not configured.'
      this.setState('error', { code: 'NO_API_KEY', message: msg })
      this.broadcast('voice:error', { code: 'NO_API_KEY', message: msg })
      throw new Error(msg)
    }

    this.isConnecting = true
    this.setState('idle', { statusText: 'Connecting to Gemini...' })

    try {
      const ai = new GoogleGenAI({ apiKey })

      // Setup connection timeout
      if (this.connectTimer) clearTimeout(this.connectTimer)
      this.connectTimer = setTimeout(() => {
        if (this.isConnecting && !this.activeSession) {
          console.error('[AiVoiceService] Connection setup timed out')
          this.cleanupSession()
          const msg = "Can't reach Gemini right now. Check your internet connection."
          this.setState('error', { code: 'CONNECTION_TIMEOUT', message: msg })
          this.broadcast('voice:error', { code: 'CONNECTION_TIMEOUT', message: msg })
        }
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

      let personalizationPrompt = ''
      if (personalize.userName) {
        personalizationPrompt += `\nUser's name: ${personalize.userName}.`
      }
      if (personalize.userTone) {
        personalizationPrompt += `\nPreferred conversation tone/style: ${personalize.userTone}.`
      }
      if (personalize.userAbout) {
        personalizationPrompt += `\nAbout the user: ${personalize.userAbout}.`
      }
      if (personalize.userInstructions) {
        personalizationPrompt += `\nAdditional instructions from user: ${personalize.userInstructions}.`
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveConfig: any = {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceSettings.voiceName || 'Aoede'
            }
          }
        },
        tools,
        systemInstruction: {
          parts: [
            {
              text: `You are Calby, a calm, focused, personal desktop voice assistant. Keep answers concise, clear, and direct. Help the user remember, understand, and act across reminders, personal memory, and Google Calendar. Never output markdown asterisks or bullet formatting in spoken speech.${personalizationPrompt}

Current reference time: ${nowIso} (User timezone: ${userTimeZone}).

Capabilities and available tools:
1. Google Calendar:
- Use "get_upcoming_events" with the "range" argument ("today", "tomorrow", "this_week", or "next_7_days") when the user asks about their schedule, meetings, agenda, or events (e.g., "What meetings do I have tomorrow?" -> range: "tomorrow", "What is on my calendar today?" -> range: "today", "What do I have this week?" -> range: "this_week").
- If Google Calendar is not connected, the tool returns a notice; inform the user to connect Google Calendar in Settings.
2. Reminders:
- When the user asks to set, create, or schedule a reminder (e.g. "Remind me tomorrow at 10 AM", "Remind me one hour before my 10 AM meeting"), resolve relative times against the reference time into a precise ISO 8601 UTC date string and call "create_reminder".
- You can also list, cancel, or snooze reminders using "list_reminders", "cancel_reminder", and "snooze_reminder".
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

      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: liveConfig,
        callbacks: {
          onopen: () => {
            if (this.connectTimer) clearTimeout(this.connectTimer)
            console.log('[DIAG] Live session connected')
            this.setState('listening')
            this.resetIdleTimer()
          },
          onmessage: (msg: LiveServerMessage) => {
            void this.handleServerMessage(msg)
          },
          onerror: (err: unknown) => {
            if (this.connectTimer) clearTimeout(this.connectTimer)
            console.error('[AiVoiceService] Gemini Live session error:', err)
            const message = "Can't reach Gemini right now. Check your internet connection."
            this.setState('error', { code: 'LIVE_API_ERROR', message })
            this.broadcast('voice:error', { code: 'LIVE_API_ERROR', message })
            this.cleanupSession()
          },
          onclose: (e: unknown) => {
            if (this.connectTimer) clearTimeout(this.connectTimer)
            console.log('[AiVoiceService] Gemini Live session closed:', e)
            this.cleanupSession()
            if (this.state !== 'error') {
              this.setState('idle')
            }
          }
        }
      })

      this.activeSession = session
      this.isConnecting = false
      if (this.connectTimer) clearTimeout(this.connectTimer)
      this.setState('listening')
      this.resetIdleTimer()
    } catch (err) {
      if (this.connectTimer) clearTimeout(this.connectTimer)
      this.isConnecting = false
      this.cleanupSession()
      console.error('[AiVoiceService] Failed to establish Live session:', err)
      const message = "Can't reach Gemini right now. Check your internet connection."
      this.setState('error', { code: 'CONNECTION_FAILED', message })
      this.broadcast('voice:error', { code: 'CONNECTION_FAILED', message })
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
        console.log('[VOICE][GEMINI] turnComplete client signal sent')
        this.activeSession.sendClientContent({ turnComplete: true })
      } catch (err) {
        console.error('[VOICE][GEMINI] Failed to send turnComplete:', err)
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
          const result = await this.actionExecutor.executeTool(
            toolName,
            (fc.args || {}) as Record<string, unknown>
          )

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
              this.setState('action_result', {
                title: 'Reminder scheduled',
                subtitle: `"${reminderData?.title || 'Reminder'}" set successfully.`
              })
            } else if (toolName === 'cancel_reminder') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const reminderData = result.data as any
              this.setState('action_result', {
                title: 'Reminder cancelled',
                subtitle: `"${reminderData?.title || 'Reminder'}" removed.`
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
        }

        if (this.activeSession && responses.length > 0) {
          try {
            console.log('[AiVoiceService] Sending toolResponse to Gemini:', responses)
            this.activeSession.sendToolResponse({
              functionResponses: responses
            })
          } catch (err) {
            console.error('[AiVoiceService] Failed to send tool response:', err)
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
        console.log(`[VOICE][GEMINI] inputTranscript="${content.inputTranscription.text}"`)
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
        this.broadcast('voice:turn-complete')
      }
    }
  }

  private lastAudioSentLogTime: number = 0

  public async sendAudioChunk(chunkBase64: string): Promise<void> {
    this.resetIdleTimer()

    if (!this.activeSession) {
      await this.startSession()
    }

    if (this.activeSession) {
      try {
        const now = Date.now()
        if (now - this.lastAudioSentLogTime > 1000) {
          this.lastAudioSentLogTime = now
          console.log('[VOICE][GEMINI] inputAudioSent')
        }
        this.activeSession.sendRealtimeInput({
          media: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: chunkBase64
            }
          ]
        })
        if (this.state === 'idle' || this.state === 'action_result') {
          this.setState('listening')
        }
      } catch (err) {
        console.error('[VOICE][GEMINI] Failed to send audio chunk:', err)
      }
    }
  }

  public interrupt(): void {
    console.log('[AiVoiceService] Client requested interrupt')
    this.broadcast('voice:interrupted')
    this.setState('listening')
    this.resetIdleTimer()
  }

  public async stopSession(): Promise<void> {
    this.cleanupSession()
    this.setState('idle')
  }

  private cleanupSession(): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer)
      this.connectTimer = null
    }
    this.clearIdleTimer()
    if (this.activeSession) {
      try {
        this.activeSession.close()
      } catch (err) {
        console.error('[AiVoiceService] Error closing session:', err)
      }
      this.activeSession = null
    }
    this.isConnecting = false
  }
}
