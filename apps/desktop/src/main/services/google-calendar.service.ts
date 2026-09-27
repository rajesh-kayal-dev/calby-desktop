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
  /**
   * Google reminder configuration for this event (lead times in minutes only).
   * Kept separate from start/end so a reminder can never be mistaken for the
   * event start time.
   */
  reminders?: {
    useDefault: boolean
    overrides: Array<{ method: string; minutes: number }>
  } | null
}

/** Why token resolution failed — lets callers distinguish auth problems from transient network failures. */
type TokenResolution =
  | { ok: true; tokens: GoogleOAuthTokens }
  | { ok: false; reason: 'missing' | 'reauth' | 'network'; error?: string }

export interface CreateCalendarEventInput {
  title: string
  startDateTime: string
  endDateTime?: string
  timeZone?: string
  attendeeEmails?: string[]
  location?: string
  description?: string
  createMeet?: boolean
  meetUrl?: string
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

  /**
   * Single source of truth for calendar connection state.
   *
   * Validates (and refreshes when expired) tokens through the exact same path
   * every data operation uses, so the Calendar UI and the voice tools can never
   * disagree about whether Google Calendar is connected. Changes are broadcast
   * to all windows via updateStatus().
   */
  public async getStatus(): Promise<CalendarStatus> {
    // Never downgrade a status that an in-flight OAuth flow is establishing.
    if (this.cachedStatus.status === 'connecting') {
      return this.cachedStatus
    }

    const hasTokens = await this.credentialService.hasGoogleCalendarTokens()
    if (!hasTokens) {
      this.updateStatus({ status: 'disconnected', hasWriteAccess: false, error: null })
      return this.cachedStatus
    }

    const tokens = await this.credentialService.getGoogleCalendarTokens()
    if (!tokens || !tokens.accessToken) {
      this.updateStatus({ status: 'disconnected', hasWriteAccess: false, error: null })
      return this.cachedStatus
    }

    const base: Omit<CalendarStatus, 'status'> = {
      connectedEmail: tokens.userEmail || 'Google Account',
      lastSyncedAt: this.cachedStatus.lastSyncedAt,
      hasWriteAccess: this.checkHasWriteAccess(tokens.scope)
    }

    const resolution = await this.resolveTokens()
    if (resolution.ok) {
      this.updateStatus({ ...base, status: 'connected', error: null })
      return this.cachedStatus
    }

    if (resolution.reason === 'reauth') {
      // Google rejected the grant (revoked, expired, or refresh token missing).
      this.updateStatus({ ...base, status: 'reauth_required', error: 'Authorization expired' })
      return this.cachedStatus
    }

    // Transient failure (offline, Google unreachable): the account itself is
    // still connected. Data calls will report the reachability problem — do not
    // claim the calendar is disconnected.
    this.updateStatus({ ...base, status: 'connected', error: null })
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
      this.focusCalbyWindow()

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
    // Let updateStatus() broadcast the change (a direct assignment here would
    // make the change look "already applied" and skip the broadcast).
    this.updateStatus({ status: 'disconnected', hasWriteAccess: false, error: null })
  }

  public async getUpcomingEvents(): Promise<CalendarEvent[]> {
    const tokens = await this.requireTokens()

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

    const res = await this.calendarFetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: 'application/json'
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        this.updateStatus({
          ...this.cachedStatus,
          status: 'reauth_required',
          error: 'Authorization expired'
        })
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
    if (!input.startDateTime) {
      throw new Error('INVALID_INPUT: Start time is required.')
    }
    const startMs = new Date(input.startDateTime).getTime()
    if (isNaN(startMs)) {
      throw new Error('INVALID_INPUT: Invalid start time.')
    }

    // Automatically determine endDateTime (default 30 min duration)
    let endDateTime = input.endDateTime
    if (!endDateTime) {
      const startObj = new Date(startMs)
      const endObj = new Date(startObj.getTime() + 30 * 60 * 1000)
      if (input.startDateTime.includes('T')) {
        const y = endObj.getFullYear()
        const m = String(endObj.getMonth() + 1).padStart(2, '0')
        const d = String(endObj.getDate()).padStart(2, '0')
        const h = String(endObj.getHours()).padStart(2, '0')
        const min = String(endObj.getMinutes()).padStart(2, '0')
        endDateTime = `${y}-${m}-${d}T${h}:${min}:00`
      } else {
        endDateTime = endObj.toISOString()
      }
    } else {
      const endMs = new Date(endDateTime).getTime()
      if (isNaN(endMs) || endMs <= startMs) {
        const startObj = new Date(startMs)
        const endObj = new Date(startObj.getTime() + 30 * 60 * 1000)
        const y = endObj.getFullYear()
        const m = String(endObj.getMonth() + 1).padStart(2, '0')
        const d = String(endObj.getDate()).padStart(2, '0')
        const h = String(endObj.getHours()).padStart(2, '0')
        const min = String(endObj.getMinutes()).padStart(2, '0')
        endDateTime = `${y}-${m}-${d}T${h}:${min}:00`
      }
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
    const tokens = await this.requireTokens()

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
        dateTime: endDateTime,
        timeZone: input.timeZone || undefined
      }
    }

    if (input.description && input.description.trim()) {
      eventPayload.description = input.description.trim()
    }
    if (input.location && input.location.trim()) {
      eventPayload.location = input.location.trim()
    } else if (input.meetUrl && input.meetUrl.trim()) {
      eventPayload.location = input.meetUrl.trim()
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

    const response = await this.calendarFetch(url.toString(), {
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
        this.updateStatus({
          ...this.cachedStatus,
          status: 'reauth_required',
          error: 'Authorization expired'
        })
        throw new Error('AUTH_EXPIRED: Calendar authorization expired.')
      }
      if (response.status === 403) {
        throw new Error('PERMISSION_DENIED: Calby needs permission to create Google Calendar events.')
      }
      throw new Error(`GOOGLE_API_ERROR: Google Calendar could not create this event (${response.status})`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdData: any = await response.json()
    const mapped = this.mapGoogleEvent(createdData, null, input.timeZone || null)
    if (!mapped.meetingUrl && input.meetUrl) {
      mapped.meetingUrl = input.meetUrl.trim()
    }

    // Result verification: the provider must echo a real event with our data.
    if (!createdData?.id || mapped.title !== input.title.trim()) {
      throw new Error('GOOGLE_API_ERROR: Google Calendar did not confirm the created event.')
    }
    return mapped
  }

  /** Fetches a single event by id (used for validation before writes). */
  public async getEvent(eventId: string): Promise<CalendarEvent> {
    const id = (eventId || '').trim()
    if (!id) {
      throw new Error('INVALID_INPUT: Missing calendar event id.')
    }

    const tokens = await this.requireTokens()
    const url = `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(id)}`

    const res = await this.calendarFetch(url, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: 'application/json'
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        this.updateStatus({
          ...this.cachedStatus,
          status: 'reauth_required',
          error: 'Authorization expired'
        })
        throw new Error('AUTH_EXPIRED: Calendar authorization expired.')
      }
      if (res.status === 404) {
        throw new Error('EVENT_NOT_FOUND: That calendar event no longer exists.')
      }
      throw new Error(`GOOGLE_API_ERROR: Google Calendar could not read this event (${res.status})`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()
    return this.mapGoogleEvent(data, null, null)
  }

  /**
   * Partially updates an event (PATCH) and verifies the provider's response:
   * the returned event must exist, keep its id, and reflect the requested start.
   */
  public async updateEvent(
    eventId: string,
    patch: {
      title?: string
      startDateTime?: string
      endDateTime?: string
      timeZone?: string
      description?: string
      location?: string
    }
  ): Promise<CalendarEvent> {
    const id = (eventId || '').trim()
    if (!id) {
      throw new Error('INVALID_INPUT: Missing calendar event id.')
    }

    const hasChanges = Object.values(patch).some((v) => v !== undefined && String(v).trim() !== '')
    if (!hasChanges) {
      throw new Error('INVALID_INPUT: No changes provided for the calendar event.')
    }

    const tokens = await this.requireTokens()
    if (!this.checkHasWriteAccess(tokens.scope)) {
      throw new Error(
        'CALENDAR_WRITE_AUTH_REQUIRED: Calby needs permission to change Google Calendar events.'
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {}
    if (patch.title !== undefined && patch.title.trim()) body.summary = patch.title.trim()
    if (patch.startDateTime !== undefined && patch.startDateTime.trim()) {
      body.start = {
        dateTime: patch.startDateTime,
        timeZone: patch.timeZone || undefined
      }
    }
    if (patch.endDateTime !== undefined && patch.endDateTime.trim()) {
      body.end = {
        dateTime: patch.endDateTime,
        timeZone: patch.timeZone || undefined
      }
    }
    if (patch.description !== undefined) body.description = patch.description
    if (patch.location !== undefined) body.location = patch.location

    const url = `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(id)}`
    const res = await this.calendarFetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      if (res.status === 401) {
        this.updateStatus({
          ...this.cachedStatus,
          status: 'reauth_required',
          error: 'Authorization expired'
        })
        throw new Error('AUTH_EXPIRED: Calendar authorization expired.')
      }
      if (res.status === 403) {
        throw new Error('PERMISSION_DENIED: Calby needs permission to change Google Calendar events.')
      }
      if (res.status === 404) {
        throw new Error('EVENT_NOT_FOUND: That calendar event no longer exists.')
      }
      throw new Error(`GOOGLE_API_ERROR: Google Calendar could not update this event (${res.status})`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json()

    // Result verification: same id, and the requested start (if any) applied.
    if (!data?.id || data.id !== id) {
      throw new Error('GOOGLE_API_ERROR: Google Calendar did not confirm the updated event.')
    }
    if (patch.startDateTime) {
      const expected = new Date(patch.startDateTime).getTime()
      const actual = data.start?.dateTime ? new Date(data.start.dateTime).getTime() : NaN
      if (!Number.isNaN(expected) && Math.abs(expected - actual) > 60_000) {
        throw new Error('GOOGLE_API_ERROR: Google Calendar did not apply the requested start time.')
      }
    }

    return this.mapGoogleEvent(data, null, patch.timeZone || null)
  }

  /**
   * Deletes an event. Success is verified by the response status: 204 (gone),
   * 410 (already deleted) and 404 (already absent) all leave the event gone —
   * but 404 is reported as `alreadyGone` so we never claim to have deleted
   * something that wasn't there.
   */
  public async deleteEvent(
    eventId: string
  ): Promise<{ deleted: boolean; alreadyGone: boolean }> {
    const id = (eventId || '').trim()
    if (!id) {
      throw new Error('INVALID_INPUT: Missing calendar event id.')
    }

    const tokens = await this.requireTokens()
    if (!this.checkHasWriteAccess(tokens.scope)) {
      throw new Error(
        'CALENDAR_WRITE_AUTH_REQUIRED: Calby needs permission to delete Google Calendar events.'
      )
    }

    const url = `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(id)}`
    const res = await this.calendarFetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    })

    if (res.status === 204 || res.status === 200) {
      return { deleted: true, alreadyGone: false }
    }
    if (res.status === 410) {
      return { deleted: true, alreadyGone: true }
    }
    if (res.status === 404) {
      return { deleted: false, alreadyGone: true }
    }

    if (res.status === 401) {
      this.updateStatus({
        ...this.cachedStatus,
        status: 'reauth_required',
        error: 'Authorization expired'
      })
      throw new Error('AUTH_EXPIRED: Calendar authorization expired.')
    }
    if (res.status === 403) {
      throw new Error('PERMISSION_DENIED: Calby needs permission to delete Google Calendar events.')
    }
    throw new Error(`GOOGLE_API_ERROR: Google Calendar could not delete this event (${res.status})`)
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
    if (!meetingUrl && item.location && (item.location.startsWith('https://') || item.location.startsWith('http://'))) {
      meetingUrl = item.location
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
      })),
      reminders: item.reminders
        ? {
            useDefault: item.reminders.useDefault !== false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            overrides: (item.reminders.overrides || []).map((o: any) => ({
              method: String(o?.method || 'popup'),
              minutes: Number(o?.minutes) || 0
            }))
          }
        : null
    }
  }

  /**
   * Resolves usable tokens, distinguishing WHY validation failed:
   * - 'missing': no tokens stored (calendar not connected)
   * - 'reauth'  : Google rejected the grant (revoked/expired/missing refresh token)
   * - 'network' : transient failure reaching Google (offline, Google unreachable)
   */
  private async resolveTokens(): Promise<TokenResolution> {
    const tokens = await this.credentialService.getGoogleCalendarTokens()
    if (!tokens || !tokens.accessToken) {
      return { ok: false, reason: 'missing' }
    }

    // Buffer of 60 seconds before expiration
    if (Date.now() < tokens.expiresAt - 60 * 1000) {
      return { ok: true, tokens }
    }

    if (!tokens.refreshToken) {
      return { ok: false, reason: 'reauth', error: 'No refresh token available.' }
    }

    // Refresh token
    try {
      const refreshed = await this.refreshTokens(tokens.refreshToken, tokens.scope, tokens.userEmail)
      await this.credentialService.saveGoogleCalendarTokens(refreshed)
      return { ok: true, tokens: refreshed }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[GoogleCalendarService] Failed to refresh tokens:', message)
      if (message.startsWith('NETWORK_ERROR')) {
        return { ok: false, reason: 'network', error: message }
      }
      return { ok: false, reason: 'reauth', error: message }
    }
  }

  /**
   * Shared gate for every calendar data operation: resolves tokens and throws a
   * consistently prefixed error so callers (UI IPC and voice tools) map failures
   * the same way.
   */
  private async requireTokens(): Promise<GoogleOAuthTokens> {
    const resolution = await this.resolveTokens()

    if (resolution.ok) {
      return resolution.tokens
    }

    if (resolution.reason === 'missing') {
      this.updateStatus({ status: 'disconnected', hasWriteAccess: false, error: null })
      throw new Error('NOT_AUTHENTICATED: Google Calendar is not connected.')
    }

    if (resolution.reason === 'reauth') {
      this.updateStatus({
        ...this.cachedStatus,
        status: 'reauth_required',
        error: 'Authorization expired'
      })
      throw new Error('AUTH_EXPIRED: Calendar authorization expired. Reconnect Google Calendar in Settings.')
    }

    // Transient: the account is still connected, Google just isn't reachable.
    throw new Error(
      "CALENDAR_UNAVAILABLE: Can't reach Google Calendar right now. Check your internet connection."
    )
  }

  /** Wraps fetch so network-level failures surface as CALENDAR_UNAVAILABLE. */
  private async calendarFetch(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[GoogleCalendarService] Network error calling Calendar API:', message)
      throw new Error(
        "CALENDAR_UNAVAILABLE: Can't reach Google Calendar right now. Check your internet connection."
      )
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

    let res: Response
    try {
      res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      })
    } catch (err) {
      // Could not reach Google at all — transient, NOT an authorization problem.
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`NETWORK_ERROR: Can't reach Google to refresh calendar access. (${message})`)
    }

    if (!res.ok) {
      const errText = await res.text()
      if (res.status >= 500) {
        // Google-side failure: treat as transient so we don't claim the account
        // is disconnected when the service is briefly unavailable.
        throw new Error(`NETWORK_ERROR: Google token endpoint error: ${res.status}`)
      }
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

  /** Bring the existing desktop app back after the browser completes OAuth. */
  private focusCalbyWindow(): void {
    const window = BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed())
    if (!window) return
    if (window.isMinimized()) window.restore()
    if (!window.isVisible()) window.show()
    window.focus()
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
