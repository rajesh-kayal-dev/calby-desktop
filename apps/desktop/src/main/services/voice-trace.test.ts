import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redactForTrace, getVoiceTrace } from './voice-trace'

vi.mock('electron', () => ({
  app: { isPackaged: false, getPath: () => '/tmp' }
}))

describe('redactForTrace', () => {
  it('strips Google API keys', () => {
    const out = redactForTrace('key is AIzaSyDeterministicValidKey1234567890 ok') as string
    expect(out).not.toContain('AIzaSy')
    expect(out).toContain('[redacted]')
  })

  it('strips bearer tokens and OAuth access tokens', () => {
    const bearer = redactForTrace('Authorization: Bearer ya29.abc123XYZ') as string
    expect(bearer).not.toContain('ya29.abc123XYZ')
    expect(bearer).not.toContain('Bearer ya29')

    const kv = redactForTrace('access_token="super-secret-value"') as string
    expect(kv).not.toContain('super-secret-value')
  })

  it('strips JWTs', () => {
    const jwt =
      'header is eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N9IZ4m-5'
    const out = redactForTrace(jwt) as string
    expect(out).not.toContain('eyJhbGciOiJIUzI1NiJ9')
    expect(out).not.toContain('dGhpcyBpcyBhIHNpZ25hdHVyZQ')
  })

  it('removes query strings from URLs (keys travel in query params)', () => {
    const out = redactForTrace('wss://generativelanguage.googleapis.com/ws?key=SECRETKEY123') as string
    expect(out).not.toContain('SECRETKEY123')
    expect(out).toContain('wss://generativelanguage.googleapis.com/ws')
    expect(out).toContain('?<redacted>')

    const https = redactForTrace('https://oauth2.googleapis.com/token?refresh_token=abc') as string
    expect(https).not.toContain('refresh_token=abc')
  })

  it('redacts sensitive keys inside nested objects and arrays', () => {
    const out = redactForTrace({
      apiKey: 'AIzaSySECRET',
      nested: { refreshToken: 'rt-123', ok: 'fine' },
      list: [{ authorization: 'Bearer zzz' }]
    }) as Record<string, unknown>

    expect(JSON.stringify(out)).not.toContain('AIzaSySECRET')
    expect(JSON.stringify(out)).not.toContain('rt-123')
    expect(JSON.stringify(out)).not.toContain('Bearer zzz')
    expect((out.nested as Record<string, unknown>).ok).toBe('fine')
  })

  it('keeps ordinary content intact (no over-redaction)', () => {
    const out = redactForTrace('Design review at 1:00 PM in Room 4') as string
    expect(out).toBe('Design review at 1:00 PM in Room 4')
  })
})

describe('VoiceTrace buffer', () => {
  beforeEach(() => {
    getVoiceTrace().clear()
  })

  it('records redacted entries and returns a copy of the buffer', () => {
    const trace = getVoiceTrace()
    trace.record('tool_args', { name: 'create_reminder', args: { title: 'X' } })

    const entries = trace.getTrace()
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[entries.length - 1].stage).toBe('tool_args')
    expect(entries[entries.length - 1].detail).toContain('create_reminder')

    // Returned array must be a copy, not the live buffer.
    entries.pop()
    expect(trace.getTrace().length).toBeGreaterThan(0)
  })

  it('never stores raw secrets', () => {
    const trace = getVoiceTrace()
    trace.record('error', 'failed with key AIzaSyTopSecretKey999999999')
    const dump = JSON.stringify(trace.getTrace())
    expect(dump).not.toContain('AIzaSyTopSecretKey999999999')
  })

  it('clear() empties the buffer', () => {
    const trace = getVoiceTrace()
    trace.record('session', 'open')
    trace.clear()
    expect(trace.getTrace()).toHaveLength(0)
  })
})
