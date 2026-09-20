import { BrowserWindow, shell } from 'electron'
import http from 'node:http'
import crypto from 'node:crypto'
import { CredentialService, type GoogleOAuthTokens } from './credential.service'

export type CalendarConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'reauth_required'

export interface CalendarStatus {
  status: CalendarConnectionStatus
  connectedEmail?: string | null
  lastSyncedAt?: string | null
  error?: string | null
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  allDay: boolean
  startDateTime?: string | null
  endDateTime?: string | null
  startDate?: string | null
  endDate?: string | null
  timeZone?: string | null
  location?: string | null
  meetingUrl?: string | null
  status?: 'confirmed' | 'tentative' | 'cancelled'
  calendarSummary?: string | null
  htmlLink?: string | null
}

const DEFAULT_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export class GoogleCalendarService {
  private static instance: GoogleCalendarService | null = null
  private credentialService: CredentialService
  private cachedStatus: CalendarStatus = { status: 'disconnected' }
  private activeServer: http.Server | null = null

  private get clientId(): string {
    const id = process.env.GOOGLE_CLIENT_ID
    if (!id) {
      throw new Error(
        'CONFIG_ERROR: Google Calendar OAuth Client ID is not configured. Please set GOOGLE_CLIENT_ID environment variable.'
      )
    }
    return id
  }

  private get clientSecret(): string | undefined {
    return process.env.GOOGLE_CLIENT_SECRET
  }

  private constructor() {
    this.credentialService = CredentialService.getInstance()
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService()
    }
    return GoogleCalendarService.instance
  }

  public async getStatus(): Promise<CalendarStatus> {
    const hasTokens = await this.credentialService.hasGoogleCalendarTokens()
    if (!hasTokens) {
      this.cachedStatus = { status: 'disconnected' }
      return this.cachedStatus
    }

    const tokens = await this.credentialService.getGoogleCalendarTokens()
    if (!tokens || !tokens.accessToken) {
      this.cachedStatus = { status: 'disconnected' }
      return this.cachedStatus
    }

    this.cachedStatus = {
      status: 'connected',
      connectedEmail: tokens.userEmail || 'Google Account',
      lastSyncedAt: this.cachedStatus.lastSyncedAt
    }
    return this.cachedStatus
  }

  public async connect(): Promise<{ connected: boolean }> {
    this.updateStatus({ status: 'connecting' })

    try {
      const tokens = await this.performOAuthFlow()
      await this.credentialService.saveGoogleCalendarTokens(tokens)

      this.updateStatus({
        status: 'connected',
        connectedEmail: tokens.userEmail || 'Google Account',
        lastSyncedAt: new Date().toISOString()
      })

      return { connected: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[GoogleCalendarService] OAuth connection error:', message)
      this.updateStatus({
        status: 'error',
        error: message
      })
      throw err
    }
  }

  public async disconnect(): Promise<void> {
    await this.credentialService.deleteGoogleCalendarTokens()
    this.updateStatus({
      status: 'disconnected',
      connectedEmail: null,
      lastSyncedAt: null,
      error: null
    })
  }

  public async getUpcomingEvents(): Promise<CalendarEvent[]> {
    const tokens = await this.getValidTokens()
    if (!tokens) {
      this.updateStatus({ status: 'reauth_required', error: 'Authentication required' })
      throw new Error('NOT_AUTHENTICATED: Google Calendar is not connected.')
    }

    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: sevenDaysLater.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50'
    })

    const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.updateStatus({ status: 'reauth_required', error: 'Authorization expired' })
        throw new Error('AUTH_EXPIRED: Calendar authorization expired.')
      }
      const errText = await response.text()
      throw new Error(`CALENDAR_API_ERROR: HTTP ${response.status} - ${errText}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json()
    const items = Array.isArray(data.items) ? data.items : []

    // Normalize events without mutating timezone or all-day representation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedEvents: CalendarEvent[] = items.map((item: any) => {
      const allDay = Boolean(item.start?.date && !item.start?.dateTime)

      let meetingUrl: string | null = item.hangoutLink || null
      if (!meetingUrl && item.conferenceData?.entryPoints) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const videoEntry = item.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video' || ep.uri)
        if (videoEntry?.uri) meetingUrl = videoEntry.uri
      }

      return {
        id: item.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: item.summary || '(No title)',
        description: item.description || null,
        allDay,
        startDateTime: item.start?.dateTime || null,
        endDateTime: item.end?.dateTime || null,
        startDate: item.start?.date || null,
        endDate: item.end?.date || null,
        timeZone: item.start?.timeZone || item.end?.timeZone || null,
        location: item.location || null,
        meetingUrl,
        status: item.status as 'confirmed' | 'tentative' | 'cancelled' | undefined,
        calendarSummary: data.summary || 'Primary Calendar',
        htmlLink: item.htmlLink || null
      }
    })

    this.updateStatus({
      status: 'connected',
      connectedEmail: tokens.userEmail || this.cachedStatus.connectedEmail,
      lastSyncedAt: new Date().toISOString()
    })

    return normalizedEvents
  }

  private async getValidTokens(): Promise<GoogleOAuthTokens | null> {
    const tokens = await this.credentialService.getGoogleCalendarTokens()
    if (!tokens || !tokens.accessToken) return null

    // If token expires in less than 5 minutes and we have a refresh token, refresh it
    const fiveMinutesMs = 5 * 60 * 1000
    if (Date.now() + fiveMinutesMs >= tokens.expiresAt && tokens.refreshToken) {
      try {
        const refreshed = await this.refreshAccessToken(tokens.refreshToken)
        const updatedTokens: GoogleOAuthTokens = {
          ...tokens,
          accessToken: refreshed.accessToken,
          expiresAt: refreshed.expiresAt
        }
        await this.credentialService.saveGoogleCalendarTokens(updatedTokens)
        return updatedTokens
      } catch (err) {
        console.warn('[GoogleCalendarService] Failed to refresh token:', err)
        return null
      }
    }

    return tokens
  }

  private async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
    if (this.clientSecret) body.append('client_secret', this.clientSecret)

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })

    if (!res.ok) {
      throw new Error(`Token refresh failed: ${res.statusText}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    const expiresIn = Number(data.expires_in) || 3600
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000
    }
  }

  private async performOAuthFlow(): Promise<GoogleOAuthTokens> {
    return new Promise((resolve, reject) => {
      // 1. Generate PKCE code verifier and challenge
      const verifier = this.generateCodeVerifier()
      const challenge = this.generateCodeChallenge(verifier)
      const state = crypto.randomBytes(16).toString('hex')

      // 2. Start loopback server
      const server = http.createServer(async (req, res) => {
        try {
          if (!req.url?.startsWith('/oauth2callback')) {
            res.writeHead(404)
            res.end()
            return
          }

          const url = new URL(req.url, `http://${req.headers.host}`)
          const code = url.searchParams.get('code')
          const returnedState = url.searchParams.get('state')
          const error = url.searchParams.get('error')

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(this.getCallbackHtml(false, `Authentication error: ${error}`))
            this.cleanupServer()
            reject(new Error(`OAuth error from Google: ${error}`))
            return
          }

          if (returnedState !== state || !code) {
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(this.getCallbackHtml(false, 'State mismatch or missing authorization code.'))
            this.cleanupServer()
            reject(new Error('Invalid OAuth callback state or missing code.'))
            return
          }

          // 3. Exchange code for tokens
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(this.getCallbackHtml(true, 'Authentication successful! You can return to Calby.'))
          this.cleanupServer()

          const tokens = await this.exchangeCodeForTokens(code, verifier, `http://127.0.0.1:${port}/oauth2callback`)
          resolve(tokens)
        } catch (err) {
          this.cleanupServer()
          reject(err)
        }
      })

      this.activeServer = server

      let port = 0
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        if (typeof address === 'object' && address !== null) {
          port = address.port
          const redirectUri = `http://127.0.0.1:${port}/oauth2callback`

          const authUrl = new URL(GOOGLE_AUTH_URL)
          authUrl.searchParams.set('client_id', this.clientId)
          authUrl.searchParams.set('redirect_uri', redirectUri)
          authUrl.searchParams.set('response_type', 'code')
          authUrl.searchParams.set('scope', DEFAULT_SCOPE)
          authUrl.searchParams.set('access_type', 'offline')
          authUrl.searchParams.set('prompt', 'consent')
          authUrl.searchParams.set('code_challenge', challenge)
          authUrl.searchParams.set('code_challenge_method', 'S256')
          authUrl.searchParams.set('state', state)

          console.log('[GoogleCalendarService] Initiating Google OAuth authorization flow in browser')
          void shell.openExternal(authUrl.toString())
        }
      })

      // Timeout after 2 minutes if user abandons flow
      const timeout = setTimeout(() => {
        this.cleanupServer()
        reject(new Error('OAuth authentication timed out. Please try again.'))
      }, 2 * 60 * 1000)

      server.on('close', () => clearTimeout(timeout))
    })
  }

  private async exchangeCodeForTokens(code: string, verifier: string, redirectUri: string): Promise<GoogleOAuthTokens> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
    if (this.clientSecret) body.append('client_secret', this.clientSecret)

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Token exchange failed: ${res.statusText} (${errText})`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    const expiresIn = Number(data.expires_in) || 3600

    // Fetch verified user identity from primary calendar
    const userEmail = await this.fetchUserEmail(data.access_token)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + expiresIn * 1000,
      tokenType: data.token_type,
      scope: data.scope,
      userEmail
    }
  }

  private async fetchUserEmail(accessToken: string): Promise<string | undefined> {
    try {
      const res = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList/primary`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      })
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json()
        if (data.id && typeof data.id === 'string' && data.id.includes('@')) {
          return data.id
        }
        if (data.summary && typeof data.summary === 'string' && data.summary.includes('@')) {
          return data.summary
        }
      }
    } catch {
      // Fallback silently if offline or metadata unavailable
    }
    return undefined
  }

  private cleanupServer(): void {
    if (this.activeServer) {
      this.activeServer.close()
      this.activeServer = null
    }
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url')
  }

  private updateStatus(status: CalendarStatus): void {
    this.cachedStatus = status
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('calendar:status-changed', status)
      }
    }
  }

  private getCallbackHtml(success: boolean, message: string): string {
    const bg = '#070A11'
    const cardBg = '#121826'
    const text = '#F8FAFC'
    const accent = success ? '#10B981' : '#EF4444'

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Calby - Google Calendar Connection</title>
          <style>
            body {
              margin: 0;
              background-color: ${bg};
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              color: ${text};
            }
            .card {
              background-color: ${cardBg};
              border: 1px solid #1E293B;
              border-radius: 16px;
              padding: 32px 40px;
              text-align: center;
              max-width: 400px;
              box-shadow: 0 12px 32px rgba(0,0,0,0.5);
            }
            h2 { margin-top: 0; color: ${accent}; font-size: 20px; }
            p { color: #94A3B8; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${success ? 'Connected to Calby' : 'Connection Failed'}</h2>
            <p>${message}</p>
            <p style="font-size: 12px; color: #64748B;">You can safely close this browser window and return to the desktop app.</p>
          </div>
        </body>
      </html>
    `
  }
}