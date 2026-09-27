import { app } from 'electron'

/**
 * Developer-only voice trace.
 *
 * Records the chain of events during a voice turn so we can debug a session:
 *   voice_detected → heard → tool_selected → tool_args → validation →
 *   confirmation → execution → result → final_response
 *
 * Safety rules:
 * - Never stores API keys, OAuth tokens, auth headers, or full WebSocket URLs.
 * - Output is redacted recursively before it is stored or printed.
 * - Only active when the app is NOT packaged (`app.isPackaged === false`), so
 *   the normal user experience is completely unaffected.
 */

export type VoiceTraceStage =
  | 'session'
  | 'voice_detected'
  | 'heard'
  | 'tool_selected'
  | 'tool_args'
  | 'validation'
  | 'confirmation'
  | 'execution'
  | 'result'
  | 'final_response'
  | 'error'

export interface VoiceTraceEntry {
  /** Epoch ms when the entry was recorded. */
  t: number
  stage: VoiceTraceStage
  /** Redacted, already-safe detail. */
  detail: string
}

const MAX_ENTRIES = 300

/** Patterns that must never appear in a trace. */
const SECRET_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z_-]{10,}/g, // Google API keys
  /ya29\.[0-9A-Za-z_-]+/g, // Google access tokens
  /Bearer\s+[0-9A-Za-z._~+/=-]+/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWTs
  /(access_token|refresh_token|id_token|api_key|apikey|authorization|client_secret)\s*[=:]\s*"[^"]*"/gi,
  /(access_token|refresh_token|id_token|api_key|apikey|authorization|client_secret)\s*[=:]\s*[^\s,}]+/gi
]

/** Truncate a URL down to its origin+path (query strings may carry keys). */
function sanitizeUrl(value: string): string {
  return value.replace(/(wss|https?):\/\/[^\s"']+/gi, (match) => {
    const qIndex = match.indexOf('?')
    const hIndex = match.indexOf('#')
    const cut = qIndex >= 0 ? qIndex : hIndex >= 0 ? hIndex : -1
    return cut >= 0 ? `${match.slice(0, cut)}?<redacted>` : match
  })
}

/** Recursively redacts secrets from any trace payload. */
export function redactForTrace(value: unknown, depth: number = 0): unknown {
  if (depth > 6) return '[depth-limit]'
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    let out = sanitizeUrl(value)
    for (const pattern of SECRET_PATTERNS) {
      out = out.replace(pattern, '[redacted]')
    }
    return out.length > 2000 ? `${out.slice(0, 2000)}…[truncated]` : out
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactForTrace(item, depth + 1))
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (/key|token|secret|password|authorization|cookie|credential/i.test(key)) {
        out[key] = '[redacted]'
        continue
      }
      out[key] = redactForTrace(val, depth + 1)
    }
    return out
  }

  return String(value)
}

export class VoiceTrace {
  private static instance: VoiceTrace | null = null
  private entries: VoiceTraceEntry[] = []

  private constructor() {}

  public static getInstance(): VoiceTrace {
    if (!VoiceTrace.instance) {
      VoiceTrace.instance = new VoiceTrace()
    }
    return VoiceTrace.instance
  }

  /** Trace collection and logging are dev-only. */
  private get enabled(): boolean {
    try {
      return !app.isPackaged
    } catch {
      // No Electron app available (tests/tools): treat as developer mode.
      return true
    }
  }

  public record(stage: VoiceTraceStage, detail: unknown): void {
    if (!this.enabled) return

    const safe = redactForTrace(detail)
    const serialized =
      typeof safe === 'string' ? safe : JSON.stringify(safe === undefined ? null : safe)

    this.entries.push({ t: Date.now(), stage, detail: serialized })
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_ENTRIES)
    }

    console.log(`[VOICE][TRACE] ${stage}:`, serialized)
  }

  public getTrace(): VoiceTraceEntry[] {
    return [...this.entries]
  }

  public clear(): void {
    this.entries = []
  }
}

export const getVoiceTrace = (): VoiceTrace => VoiceTrace.getInstance()
