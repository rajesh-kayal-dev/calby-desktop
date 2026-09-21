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
  hasWriteAccess?: boolean
}

export interface CalendarAttendee {
  email: string
  displayName?: string
  responseStatus?: string
  self?: boolean
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
  attendees?: CalendarAttendee[]
}

export interface CreateCalendarEventInput {
  title: string
  startDateTime: string
  endDateTime: string
  timeZone?: string
  attendeeEmails?: string[]
  location?: string
  description?: string
  createMeet?: boolean
}

// Calby uses unified calendar.events scope from initial connection for read & create access
const PRIMARY_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const DEFAULT_SCOPE = PRIMARY_CALENDAR_SCOPE

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export class GoogleCalendarService {
  private static instance: GoogleCalendarService | null = null
  private credentialService: CredentialService
  private cachedStatus: CalendarStatus = { status: 'disconnected', hasWriteAccess: false }
  private activeServer: http.Server | null = null

  private get clientId(): string {
    const id = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID
    if (!id) {
      throw new Error(
        'CONFIG_ERROR: Google Calendar OAuth Client ID is not configured. Please set GOOGLE_CLIENT_ID environment variable.'
      )
    }
    return id
  }

  private get clientSecret(): string | undefined {
    return process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET
  }

  private get configuredRedirectUri(): string | undefined {
    return process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI || undefined
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

  public checkHasWriteAccess(scopeStr?: string): boolean {
    if (!scopeStr) return false
    const scopes = scopeStr.split(/\s+/)
    return scopes.some(
      (s) =>
        s === 'https://www.googleapis.com/auth/calendar.events' ||
        s === 'https://www.googleapis.com/auth/calendar'
    )
  }

  public async getStatus(): Promise<CalendarStatus> {
    const hasTokens = await this.credentialService.hasGoogleCalendarTokens()
    if (!hasTokens) {
      this.cachedStatus = { status: 'disconnected', hasWriteAccess: false }
      return this.cachedStatus
    }

    const tokens = await this.credentialService.getGoogleCalendarTokens()
    if (!tokens || !tokens.accessToken) {
      this.cachedStatus = { status: 'disconnected', hasWriteAccess: false }
      return this.cachedStatus
    }

    const hasWrite = this.checkHasWriteAccess(tokens.scope)

    this.cachedStatus = {
      status: 'connected',
      connectedEmail: tokens.userEmail || 'Google Account',
      lastSyncedAt: this.cachedStatus.lastSyncedAt,
      hasWriteAccess: hasWrite
    }
    return this.cachedStatus
  }

  public async connect(): Promise<{ connected: boolean }> {
    this.updateStatus({ status: 'connecting' })

    try {
      const tokens = await this.performOAuthFlow(DEFAULT_SCOPE)
      await this.credentialService.saveGoogleCalendarTokens(tokens)

      const hasWrite = this.checkHasWriteAccess(tokens.scope)
      const status: CalendarStatus = {
        status: 'connected',
        connectedEmail: tokens.userEmail || 'Google Account',
        lastSyncedAt: new Date().toISOString(),
        hasWriteAccess: hasWrite
      }
      this.updateStatus(status)

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

  public async requestWriteAccess(): Promise<CalendarStatus> {
    try {
      const tokens = await this.performOAuthFlow(PRIMARY_CALENDAR_SCOPE)
      await this.credentialService.saveGoogleCalendarTokens(tokens)

      const status: CalendarStatus = {
        status: 'connected',
        connectedEmail: tokens.userEmail || 'Google Account',
        lastSyncedAt: new Date().toISOString(),
        hasWriteAccess: true
      }
      this.updateStatus(status)
      return status
    } catch (err: unknown) {
      console.error('[GoogleCalendarService] OAuth write upgrade failed:', err)
      throw err
    }
  }

  public async disconnect(): Promise<void> {
    await this.credentialService.deleteGoogleCalendarTokens()
    this.cachedStatus = { status: 'disconnected', hasWriteAccess: false }
    this.updateStatus({ status: 'disconnected', hasWriteAccess: false })
  }

  public async getUpcomingEvents(): Promise<CalendarEvent[]> {
    const tokens = await this.getValidTokens()
    if (!tokens) {
      this.updateStatus({ status: 'reauth_required', error: 'Authentication required' })
      throw new Error('NOT_AUTHENTICATED: Google Calendar is not connected.')
    }

    const now = new Date()
    const timeMin = now.toISOString()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const timeMax = sevenDaysLater.toISOString()

    const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/primary/events`)
    url.searchParams.set('timeMin', timeMin)
    url.searchParams.set('timeMax', timeMax)
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('maxResults', '50')

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: 'application/json'
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        this.updateStatus({ status: 'reauth_required', error: 'Authorization expired' })
        throw new Error('AUTH_EXPIRED: Calendar authorization expired.')
      }
      throw new Error(`CALENDAR_API_ERROR: Google Calendar API error: ${res.statusText}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    const calendarSummary = data.summary || null
    const calendarTimeZone = data.timeZone || null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = data.items || []

    const events = items
      .filter((item) => item.status !== 'cancelled')
      .map((item) => this.mapGoogleEvent(item, calendarSummary, calendarTimeZone))

    this.cachedStatus.lastSyncedAt = new Date().toISOString()
    this.cachedStatus.hasWriteAccess = this.checkHasWriteAccess(tokens.scope)
    if (tokens.userEmail) {
      this.cachedStatus.connectedEmail = tokens.userEmail
    }

    return events
  }

  public async createEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
    // 1. Validate Input
    if (!input || !input.title || !input.title.trim()) {
      throw new Error('INVALID_INPUT: Title is required.')
    }
    if (!input.startDateTime || !input.endDateTime) {
      throw new Error('INVALID_INPUT: Start time and end time are required.')
    }
    const startMs = new Date(input.startDateTime).getTime()
    const endMs = new Date(input.endDateTime).getTime()
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
      throw new Error('INVALID_INPUT: End time must be after start time.')
    }

    if (input.attendeeEmails && input.attendeeEmails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (const email of input.attendeeEmails) {
        if (!email || !emailRegex.test(email.trim())) {
          throw new Error(`INVALID_INPUT: Invalid guest email address: ${email}`)
        }
      }
    }

    // 2. Auth & Scope Verification
    const tokens = await this.getValidTokens()
    if (!tokens) {
      this.updateStatus({ status: 'reauth_required', error: 'Authentication required' })
      throw new Error('NOT_AUTHENTICATED: Google Calendar is not connected.')
    }

    if (!this.checkHasWriteAccess(tokens.scope)) {
      throw new Error('CALENDAR_WRITE_AUTH_REQUIRED: Calby needs permission to create Google Calendar events.')
    }

    // 3. Construct Google Calendar Event Payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventPayload: any = {
      summary: input.title.trim(),
      start: {
        dateTime: input.startDateTime,
        timeZone: input.timeZone || undefined
      },
      end: {
        dateTime: input.endDateTime,
        timeZone: input.timeZone || undefined
      }
    }

    if (input.description && input.description.trim()) {
      eventPayload.description = input.description.trim()
    }
    if (input.location && input.location.trim()) {
      eventPayload.location = input.location.trim()
    }
    if (input.attendeeEmails && input.attendeeEmails.length > 0) {
      eventPayload.attendees = input.attendeeEmails.map((email) => ({ email: email.trim() }))
    }
    if (input.createMeet) {
      eventPayload.conferenceData = {
        createRequest: {
          requestId: `calby-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    }

    const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/primary/events`)
    if (input.createMeet) {
      url.searchParams.set('conferenceDataVersion', '1')
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(eventPayload)
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.updateStatus({ status: 'reauth_required', error: 'Authorization expired' })
        throw new Error('AUTH_EXPIRED: Calendar authorization expired.')
      }
      if (response.status === 403) {
        throw new Error('PERMISSION_DENIED: Calby needs permission to create Google Calendar events.')
      }
      throw new Error(`GOOGLE_API_ERROR: Google Calendar could not create this event (${response.status})`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdData: any = await response.json()
    return this.mapGoogleEvent(createdData, null, input.timeZone || null)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapGoogleEvent(item: any, calendarSummary: string | null, fallbackTimeZone: string | null): CalendarEvent {
    let meetingUrl: string | null = null
    if (item.conferenceData?.entryPoints) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videoEntry = item.conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video')
      if (videoEntry?.uri) {
        meetingUrl = videoEntry.uri
      }
    }
    if (!meetingUrl && item.hangoutLink) {
      meetingUrl = item.hangoutLink
    }

    const isAllDay = Boolean(item.start?.date && !item.start?.dateTime)
    const eventTimeZone = item.start?.timeZone || item.end?.timeZone || fallbackTimeZone || undefined

    return {
      id: item.id || crypto.randomUUID(),
      title: item.summary || '(No title)',
      description: item.description || null,
      allDay: isAllDay,
      startDateTime: item.start?.dateTime || null,
      endDateTime: item.end?.dateTime || null,
      startDate: item.start?.date || null,
      endDate: item.end?.date || null,
      timeZone: eventTimeZone || null,
      location: item.location || null,
      meetingUrl,
      status: item.status || 'confirmed',
      calendarSummary,
      htmlLink: item.htmlLink || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attendees: item.attendees?.map((a: any) => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
        self: a.self
      }))
    }
  }

  private async getValidTokens(): Promise<GoogleOAuthTokens | null> {
    const tokens = await this.credentialService.getGoogleCalendarTokens()
    if (!tokens) return null

    // Buffer of 60 seconds before expiration
    if (Date.now() < tokens.expiresAt - 60 * 1000) {
      return tokens
    }

    if (!tokens.refreshToken) {
      return null
    }

    // Refresh token
    try {
      const refreshed = await this.refreshTokens(tokens.refreshToken, tokens.scope, tokens.userEmail)
      await this.credentialService.saveGoogleCalendarTokens(refreshed)
      return refreshed
    } catch (err) {
      console.error('[GoogleCalendarService] Failed to refresh tokens:', err)
      return null
    }
  }

  private async refreshTokens(
    refreshToken: string,
    existingScope?: string,
    userEmail?: string
  ): Promise<GoogleOAuthTokens> {
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
      const errText = await res.text()
      throw new Error(`Refresh token request failed: ${res.statusText} (${errText})`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    const expiresIn = Number(data.expires_in) || 3600

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope || existingScope,
      userEmail
    }
  }

  private async performOAuthFlow(requestedScope: string = DEFAULT_SCOPE): Promise<GoogleOAuthTokens> {
    if (!this.clientId) {
      throw new Error('Google OAuth Client ID is not configured in GOOGLE_CLIENT_ID.')
    }

    this.cleanupServer()

    const configuredUri = this.configuredRedirectUri
    let targetPort = 0
    let targetPath = '/oauth2callback'

    if (configuredUri) {
      try {
        const parsed = new URL(configuredUri)
        if (parsed.port) {
          targetPort = parseInt(parsed.port, 10)
        }
        if (parsed.pathname && parsed.pathname !== '/') {
          targetPath = parsed.pathname
        }
      } catch (e) {
        console.warn('[GoogleCalendarService] Invalid configured redirect URI:', configuredUri, e)
      }
    }

    const verifier = this.generateCodeVerifier()
    const challenge = this.generateCodeChallenge(verifier)
    const state = crypto.randomBytes(16).toString('hex')

    return new Promise((resolve, reject) => {
      let finalRedirectUri = ''

      const server = http.createServer(async (req, res) => {
        try {
          const reqUrl = req.url ? new URL(req.url, 'http://127.0.0.1') : null
          const reqPath = reqUrl?.pathname || ''

          if (!reqPath.startsWith(targetPath) && !reqPath.startsWith('/oauth2callback')) {
            res.writeHead(404)
            res.end()
            return
          }

          const code = reqUrl?.searchParams.get('code')
          const returnedState = reqUrl?.searchParams.get('state')
          const error = reqUrl?.searchParams.get('error')

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

          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(this.getCallbackHtml(true, 'Authentication successful! You can return to Calby.'))
          this.cleanupServer()

          const tokens = await this.exchangeCodeForTokens(code, verifier, finalRedirectUri)
          resolve(tokens)
        } catch (err) {
          this.cleanupServer()
          reject(err)
        }
      })

      this.activeServer = server

      server.listen(targetPort, '127.0.0.1', () => {
        const address = server.address()
        if (typeof address === 'object' && address !== null) {
          const actualPort = address.port
          finalRedirectUri = configuredUri || `http://127.0.0.1:${actualPort}/oauth2callback`

          const authUrl = new URL(GOOGLE_AUTH_URL)
          authUrl.searchParams.set('client_id', this.clientId)
          authUrl.searchParams.set('redirect_uri', finalRedirectUri)
          authUrl.searchParams.set('response_type', 'code')
          authUrl.searchParams.set('scope', requestedScope)
          authUrl.searchParams.set('access_type', 'offline')
          authUrl.searchParams.set('prompt', 'consent')
          authUrl.searchParams.set('code_challenge', challenge)
          authUrl.searchParams.set('code_challenge_method', 'S256')
          authUrl.searchParams.set('state', state)

          console.log('[GoogleCalendarService] [OAuth Diagnostics] Redirect URI:', finalRedirectUri)
          void shell.openExternal(authUrl.toString())
        }
      })

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
      // Fallback silently
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
    const prev = this.cachedStatus
    this.cachedStatus = status

    const isSame =
      prev &&
      prev.status === status.status &&
      prev.connectedEmail === status.connectedEmail &&
      prev.hasWriteAccess === status.hasWriteAccess &&
      prev.error === status.error

    if (!isSame) {
      const windows = BrowserWindow.getAllWindows()
      for (const win of windows) {
        if (!win.isDestroyed()) {
          win.webContents.send('calendar:status-changed', status)
        }
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
