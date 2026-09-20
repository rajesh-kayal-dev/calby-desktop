import { BrowserWindow } from 'electron'
import { GoogleGenAI, type LiveServerMessage } from '@google/genai'
import { CredentialService } from './credential.service'

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
    if (this.activeSession) {
      // Already active, switch to listening
      this.setState('listening')
      this.resetIdleTimer()
      return
    }

    if (this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      const apiKey = await this.credentialService.getApiKey()
      if (!apiKey) {
        this.isConnecting = false
        const msg = "Can't connect to Gemini. Check your API key."
        this.setState('error', { code: 'NO_API_KEY', message: msg })
        this.broadcast('voice:error', { code: 'NO_API_KEY', message: msg })
        return
      }

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveConfig: any = {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede'
            }
          }
        },
        systemInstruction: {
          parts: [
            {
              text: "You are Calby, a calm, focused, personal desktop voice assistant. Keep answers concise, clear, and direct. Help the user remember, understand, and act. Respond naturally and helpfully to the user's spoken input. Never output markdown asterisks or bullet formatting in spoken speech."
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
            this.handleServerMessage(msg)
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

  private handleServerMessage(msg: LiveServerMessage): void {
    this.resetIdleTimer()

    // 1. Session Resumption Token
    if (msg.sessionResumptionUpdate?.newHandle) {
      this.resumptionHandle = msg.sessionResumptionUpdate.newHandle
    }

    if (msg.serverContent) {
      const content = msg.serverContent

      // 2. Interruption signal (Barge-in by user)
      if (content.interrupted) {
        console.log('[VOICE][GEMINI] server signaled interruption')
        this.broadcast('voice:interrupted')
        this.setState('listening')
      }

      // 3. Interim User Input Transcription
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

      // 4. Final User Input Transcription
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

      // 5. Model Output Audio & Text
      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.inlineData?.data) {
            console.log('[VOICE][GEMINI] modelAudioReceived')
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

      // 6. Model Output Transcription (from outputAudioTranscription)
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

      // 7. Turn Complete
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
