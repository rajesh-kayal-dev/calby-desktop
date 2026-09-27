import { ReminderService } from './reminder.service'
import { MemoryService } from './memory.service'
import { GoogleCalendarService, type CalendarEvent } from './google-calendar.service'
import {
  normalizeCalendarEvent,
  normalizeReminder,
  getUserTimeZone,
  formatHumanReadableDateTime
} from './calendar-format'
import { getVoiceTrace } from './voice-trace'
import type { Reminder } from '../storage/reminder.repository'
import type { Memory, MemoryType } from '../storage/memory.repository'

export interface ToolDeclaration {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
  ambiguous?: boolean
  notConnected?: boolean
  /**
   * Set when the action needs more information from the user before it can run
   * (e.g. "which event?"). The model should ask a clarifying question instead
   * of claiming success or failure.
   */
  needsClarification?: boolean
}

export class ActionExecutor {
  private static instance: ActionExecutor | null = null
  private reminderService: ReminderService
  private memoryService: MemoryService
  private calendarService: GoogleCalendarService

  private constructor() {
    this.reminderService = ReminderService.getInstance()
    this.memoryService = MemoryService.getInstance()
    this.calendarService = GoogleCalendarService.getInstance()
  }

  public static getInstance(): ActionExecutor {
    if (!ActionExecutor.instance) {
      ActionExecutor.instance = new ActionExecutor()
    }
    return ActionExecutor.instance
  }

  public getToolDeclarations(): ToolDeclaration[] {
    return [
      // --- Reminders Tools ---
      {
        name: 'create_reminder',
        description:
          'Create a new scheduled reminder. Schedule time must be an ISO 8601 UTC date string. Idempotent: creating the same reminder again returns the existing one instead of a duplicate. When the reminder is for a calendar event, pass eventId and leadMinutes.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Clear, concise title or text of what to remember/do.'
            },
            scheduledAt: {
              type: 'STRING',
              description: 'ISO 8601 UTC timestamp string when the reminder should trigger.'
            },
            alertType: {
              type: 'STRING',
              description: 'Optional alert type: "notification" (default) or "alarm"'
            },
            eventId: {
              type: 'STRING',
              description:
                'Optional calendar event id this reminder is for (from get_upcoming_events). Passing it prevents duplicate reminders.'
            },
            leadMinutes: {
              type: 'NUMBER',
              description:
                'Optional minutes before the event this reminder should fire (e.g. 5 = 5 minutes before). Only relevant with eventId.'
            }
          },
          required: ['title', 'scheduledAt']
        }
      },
      {
        name: 'list_reminders',
        description: 'List active upcoming scheduled reminders.',
        parameters: {
          type: 'OBJECT',
          properties: {
            filter: {
              type: 'STRING',
              description: 'Optional filter: "upcoming" or "completed"'
            }
          }
        }
      },
      {
        name: 'snooze_reminder',
        description:
          'Snooze a reminder by ID or matching title keyword for a specified number of minutes (default 5m).',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'Exact ID of the reminder if known.'
            },
            title: {
              type: 'STRING',
              description: 'Title or keyword to identify the target reminder.'
            },
            minutes: {
              type: 'INTEGER',
              description: 'Minutes to snooze for (defaults to 5).'
            }
          }
        }
      },
      {
        name: 'cancel_reminder',
        description: 'Cancel and delete a reminder by ID or title match.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'Exact ID of the reminder if known.'
            },
            title: {
              type: 'STRING',
              description: 'Title or keyword to identify the reminder to cancel.'
            }
          }
        }
      },

      // --- Personal Memories Tools ---
      {
        name: 'create_memory',
        description:
          'Save a persistent personal memory, fact, preference, person detail, or work note for the user.',
        parameters: {
          type: 'OBJECT',
          properties: {
            content: {
              type: 'STRING',
              description: 'The memory content, statement, or fact to store.'
            },
            type: {
              type: 'STRING',
              description:
                'Optional category: "fact", "preference", "person", "work", or "general" (defaults to "general").'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'search_memory',
        description: 'Search personal memories and saved notes by query keywords.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Keywords to search for in saved memories.'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'list_memories',
        description: 'List recent stored memories, optionally filtered by category type.',
        parameters: {
          type: 'OBJECT',
          properties: {
            type: {
              type: 'STRING',
              description:
                'Optional category filter: "fact", "preference", "person", "work", or "general".'
            }
          }
        }
      },
      {
        name: 'update_memory',
        description: 'Update the content or type of an existing memory by ID or query keyword match.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'Exact ID of the memory to update.'
            },
            query: {
              type: 'STRING',
              description: 'Unique query keyword to find the memory if ID is not known.'
            },
            newContent: {
              type: 'STRING',
              description: 'The updated replacement content for the memory.'
            },
            type: {
              type: 'STRING',
              description: 'Optional updated category type.'
            }
          },
          required: ['newContent']
        }
      },
      {
        name: 'delete_memory',
        description: 'Delete/forget a personal memory by ID or query keyword match.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'Exact ID of the memory to delete.'
            },
            query: {
              type: 'STRING',
              description: 'Unique query keyword to find the memory to delete.'
            }
          }
        }
      },

      // --- Google Calendar Tools (Phase 7) ---
      {
        name: 'get_upcoming_events',
        description:
          'Get upcoming calendar events from Google Calendar for relative time ranges such as "today", "tomorrow", "this_week", or "next_7_days". If calendar is not connected, returns connection guidance.',
        parameters: {
          type: 'OBJECT',
          properties: {
            range: {
              type: 'STRING',
              enum: ['today', 'tomorrow', 'this_week', 'next_7_days'],
              description:
                'Time range to query: "today", "tomorrow", "this_week", or "next_7_days" (default: "next_7_days").'
            },
            query: {
              type: 'STRING',
              description: 'Optional keyword to filter event titles, descriptions, or locations.'
            }
          }
        }
      },
      {
        name: 'create_calendar_event',
        description:
          'Create a new Google Calendar event. Requires Google Calendar to be connected with write access. Returns the created event with ISO start/end, timezone, and human-readable times.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Event title/summary.'
            },
            startDateTime: {
              type: 'STRING',
              description:
                'ISO 8601 start time with offset (e.g. 2026-09-27T13:00:00+05:30) or an ISO date for all-day events.'
            },
            endDateTime: {
              type: 'STRING',
              description: 'Optional ISO 8601 end time. Defaults to 30 minutes after the start.'
            },
            timeZone: {
              type: 'STRING',
              description: 'IANA timezone of the event (e.g. "Asia/Kolkata"). Defaults to the user timezone.'
            },
            location: {
              type: 'STRING',
              description: 'Optional location text.'
            },
            description: {
              type: 'STRING',
              description: 'Optional description.'
            }
          },
          required: ['title', 'startDateTime']
        }
      },
      {
        name: 'update_calendar_event',
        description:
          'Update an existing Google Calendar event. Provide eventId (preferred) or a title to match. Only the provided fields change. Validates the target first: ambiguous matches are reported back for clarification.',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: {
              type: 'STRING',
              description: 'Exact calendar event id (preferred — from get_upcoming_events).'
            },
            title: {
              type: 'STRING',
              description: 'Event title to find when eventId is unknown.'
            },
            newTitle: {
              type: 'STRING',
              description: 'New event title.'
            },
            startDateTime: {
              type: 'STRING',
              description: 'New ISO 8601 start time.'
            },
            endDateTime: {
              type: 'STRING',
              description: 'New ISO 8601 end time.'
            },
            timeZone: {
              type: 'STRING',
              description: 'IANA timezone for the new start/end.'
            },
            location: {
              type: 'STRING',
              description: 'New location text.'
            },
            description: {
              type: 'STRING',
              description: 'New description.'
            }
          }
        }
      },
      {
        name: 'delete_calendar_event',
        description:
          'Delete a Google Calendar event. Provide eventId (preferred) or a title to match. Multiple matches are reported back for clarification instead of guessing.',
        parameters: {
          type: 'OBJECT',
          properties: {
            eventId: {
              type: 'STRING',
              description: 'Exact calendar event id (preferred — from get_upcoming_events).'
            },
            title: {
              type: 'STRING',
              description: 'Event title to find when eventId is unknown.'
            }
          }
        }
      },
      {
        name: 'update_reminder',
        description:
          'Update an existing reminder. Provide id (preferred) or a title to match. You can change the title and/or scheduled time.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'Exact reminder id (preferred — from list_reminders or create_reminder).'
            },
            title: {
              type: 'STRING',
              description: 'Reminder title to find when id is unknown.'
            },
            newTitle: {
              type: 'STRING',
              description: 'New reminder title.'
            },
            scheduledAt: {
              type: 'STRING',
              description: 'New ISO 8601 UTC trigger time.'
            }
          }
        }
      },
      {
        name: 'delete_reminder',
        description:
          'Delete/cancel a reminder. Provide id (preferred) or a title to match. Multiple matches are reported back for clarification instead of guessing.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'Exact reminder id (preferred).'
            },
            title: {
              type: 'STRING',
              description: 'Reminder title to find when id is unknown.'
            }
          }
        }
      }
    ]
  }

  private findTargetReminder(
    id?: string | null,
    title?: string | null,
    includeAll: boolean = false
  ): { target?: Reminder; ambiguityError?: string; notFoundError?: string } {
    if (id) {
      const byId = this.reminderService.getById(id)
      if (byId) return { target: byId }
    }

    if (title && title.trim()) {
      const q = title.trim().toLowerCase()
      const all = this.reminderService.listAll()
      const candidates = includeAll
        ? all
        : all.filter(
            (r) =>
              r.status === 'scheduled' ||
              r.status === 'triggered' ||
              r.status === 'snoozed'
          )
      const matches = candidates.filter((r) => r.title.toLowerCase().includes(q))

      if (matches.length === 1) {
        return { target: matches[0] }
      }
      if (matches.length > 1) {
        const exact = matches.filter((r) => r.title.toLowerCase() === q)
        if (exact.length === 1) {
          return { target: exact[0] }
        }
        return {
          ambiguityError: `Found ${matches.length} matching reminders. Which one did you mean?`
        }
      }
    }

    return { notFoundError: 'Could not identify which reminder you were referring to.' }
  }

  private findTargetMemory(
    id?: string | null,
    query?: string | null
  ): { target?: Memory; ambiguityError?: string; notFoundError?: string } {
    if (id) {
      const byId = this.memoryService.getById(id)
      if (byId) return { target: byId }
    }

    if (query && query.trim()) {
      const matches = this.memoryService.search(query.trim(), 10)
      if (matches.length === 1) {
        return { target: matches[0] }
      }
      if (matches.length > 1) {
        const exact = matches.filter(
          (m) => m.content.toLowerCase() === query.trim().toLowerCase()
        )
        if (exact.length === 1) {
          return { target: exact[0] }
        }
        return {
          ambiguityError: `Found ${matches.length} memories matching "${query}". Which one would you like to target?`
        }
      }
    }

    return { notFoundError: 'Could not identify which memory you were referring to.' }
  }

  // ---------------------------------------------------------------------
  // Shared action-validation flow (steps 6–7)
  // ---------------------------------------------------------------------

  /** Shared "calendar isn't usable right now" payload (one source of truth). */
  private calendarNotConnectedResult(): ActionResult {
    return {
      success: true,
      message: 'Google Calendar is not connected.',
      data: {
        notConnected: true,
        instruction:
          'Google Calendar is not connected. Tell the user to connect Google Calendar in Settings.'
      }
    }
  }

  /**
   * Result of resolving tool arguments to exactly one concrete target.
   *
   * - `ok`            → single match (or explicit id): safe to execute
   * - `ambiguous`     → multiple matches: ask the user which one
   * - `not_found`     → nothing matched: report it honestly
   * - `missing_info`  → the caller didn't provide enough to even search
   */
  private resolveTarget<T>(
    candidates: T[],
    identify: (item: T) => { id: string; title: string; startHuman?: string },
    provided: { id?: string | null; title?: string | null },
    what: string
  ):
    | { status: 'ok'; target: T }
    | { status: 'ambiguous' | 'not_found' | 'missing_info'; result: ActionResult } {
    // 1. Explicit id always wins — verify it exists.
    if (provided.id && provided.id.trim()) {
      const wanted = provided.id.trim()
      const byId = candidates.find((c) => identify(c).id === wanted)
      if (byId) {
        getVoiceTrace().record('validation', { what, match: 'id', status: 'ok' })
        return { status: 'ok', target: byId }
      }
      getVoiceTrace().record('validation', { what, match: 'id', status: 'not_found' })
      getVoiceTrace().record('confirmation', { what, action: 'none', reason: 'not_found' })
      return {
        status: 'not_found',
        result: {
          success: false,
          message: `Couldn't find that ${what}. It may have already been changed or removed.`,
          data: { code: 'not_found' }
        }
      }
    }

    const q = provided.title?.trim().toLowerCase()
    if (!q) {
      getVoiceTrace().record('confirmation', { what, action: 'ask_user', reason: 'missing_info' })
      return {
        status: 'missing_info',
        result: {
          success: false,
          needsClarification: true,
          message: `Which ${what} did you mean? I need a name or title to find it.`,
          data: { code: 'missing_info' }
        }
      }
    }

    const matches = candidates.filter((c) => identify(c).title.toLowerCase().includes(q))

    if (matches.length === 0) {
      getVoiceTrace().record('confirmation', { what, action: 'none', reason: 'not_found' })
      return {
        status: 'not_found',
        result: {
          success: false,
          message: `Couldn't find a ${what} matching "${provided.title}".`,
          data: { code: 'not_found' }
        }
      }
    }

    if (matches.length === 1) {
      getVoiceTrace().record('validation', { what, match: 'single', status: 'ok' })
      return { status: 'ok', target: matches[0] }
    }

    // Multiple matches: prefer an exact-title match, otherwise ask.
    const exact = matches.filter((c) => identify(c).title.toLowerCase() === q)
    if (exact.length === 1) {
      getVoiceTrace().record('validation', { what, match: 'exact', status: 'ok' })
      return { status: 'ok', target: exact[0] }
    }

    const list = matches.slice(0, 5).map((c) => identify(c))
    getVoiceTrace().record('validation', {
      what,
      match: 'multiple',
      status: 'ambiguous',
      count: matches.length
    })
    return {
      status: 'ambiguous',
      result: {
        success: false,
        ambiguous: true,
        needsClarification: true,
        message: `Found ${matches.length} matching ${what}s: ${list
          .map((c) => `"${c.title}"${c.startHuman ? ` (${c.startHuman})` : ''}`)
          .join(', ')}. Which one did you mean?`,
        data: { code: 'ambiguous', candidates: list }
      }
    }
  }

  /** Maps a thrown service error to a safe, user-facing message. Technical detail stays in the logs. */
  private toSafeErrorMessage(err: unknown, context: string): string {
    const raw = err instanceof Error ? err.message : String(err)
    console.error(`[ActionExecutor] ${context} failed:`, raw)

    // Prefixed error codes (our own taxonomy) → mapped to friendly copy.
    if (raw.startsWith('INVALID_INPUT:')) return raw.slice('INVALID_INPUT:'.length).trim()
    if (raw.startsWith('NOT_AUTHENTICATED:')) return 'Google Calendar is not connected.'
    if (raw.startsWith('AUTH_EXPIRED:'))
      return 'Google Calendar connection has expired. Reconnect it in Settings.'
    if (raw.startsWith('CALENDAR_UNAVAILABLE:'))
      return "Can't reach Google Calendar right now. Check your internet connection."
    if (raw.startsWith('CALENDAR_WRITE_AUTH_REQUIRED:'))
      return 'Calby needs permission to change Google Calendar events. Reconnect with write access in Settings.'
    if (raw.startsWith('CALENDAR_API_ERROR:'))
      return "Google Calendar didn't respond properly. Please try again."
    if (raw.startsWith('GOOGLE_API_ERROR:'))
      return "Google Calendar couldn't complete that change. Please try again."
    if (raw.startsWith('EVENT_NOT_FOUND:'))
      return 'That calendar event no longer exists.'
    if (raw.startsWith('PERMISSION_DENIED:')) return raw.slice('PERMISSION_DENIED:'.length).trim()
    if (raw.startsWith('CONFIG_ERROR:'))
      return 'Google Calendar is not configured for Calby yet. Please finish setup in Settings.'
    if (/^[A-Z][A-Z0-9_]*:/.test(raw)) {
      // Unknown coded error: never leak the technical body.
      return 'Something went wrong while completing that action. Please try again.'
    }

    // Looks like an infrastructure/stack failure → don't surface it.
    const technical = /fetch failed|unexpected token|sqlit|enoent|econn|etimedout|eai_again|getaddrinfo|typeerror|referenceerror|is not a function|cannot read propert|\bat \w+ \(|https?:\/\//i
    if (technical.test(raw)) {
      return 'Something went wrong while completing that action. Please try again.'
    }

    // Messages authored by our services (e.g. "Reminder scheduled time cannot
    // be in the past.") are already user-facing — pass them through verbatim.
    return raw
  }

  public async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<ActionResult> {
    console.log(`[ActionExecutor] Executing tool "${name}" with args:`, args)
    getVoiceTrace().record('execution', { tool: name })

    try {
      switch (name) {
        // --- Reminders ---
        case 'create_reminder': {
          const title = String(args.title || '').trim()
          let scheduledAt = String(args.scheduledAt || '').trim()

          if (!title) {
            return { success: false, message: 'Missing reminder title.' }
          }

          if (!scheduledAt) {
            scheduledAt = new Date(Date.now() + 3600 * 1000).toISOString()
          }

          const parsedDate = new Date(scheduledAt)
          if (isNaN(parsedDate.getTime())) {
            return {
              success: false,
              message: `Invalid scheduledAt timestamp "${scheduledAt}". Must be an ISO 8601 string.`
            }
          }

          const isAlarm = args.alertType === 'alarm' || args.alarmEnabled === true
          const alertType = isAlarm ? 'alarm' : 'notification'
          const eventId = args.eventId ? String(args.eventId).trim() : undefined
          const leadMinutes =
            typeof args.leadMinutes === 'number' && Number.isFinite(args.leadMinutes)
              ? Math.max(0, Math.round(args.leadMinutes))
              : undefined

          let reminder: Reminder
          let alreadyExisted = false
          try {
            const created = await this.reminderService.createWithResult({
              title,
              scheduledAt: parsedDate.toISOString(),
              alertType,
              alarmEnabled: isAlarm,
              eventId,
              leadMinutes,
              source: 'voice'
            })
            reminder = created.reminder
            alreadyExisted = created.alreadyExisted
          } catch (err) {
            return { success: false, message: this.toSafeErrorMessage(err, 'create_reminder') }
          }

          const localTime = formatHumanReadableDateTime(
            reminder.scheduledAt,
            getUserTimeZone()
          )

          return {
            success: true,
            message: alreadyExisted
              ? `That reminder already exists — "${reminder.title}" is already set for ${localTime}${isAlarm ? ' (with alarm)' : ''}. Not creating a duplicate.`
              : `Reminder set for "${reminder.title}" at ${localTime}${isAlarm ? ' (with alarm)' : ''}.`,
            data: { ...normalizeReminder(reminder), alreadyExisted }
          }
        }

        case 'list_reminders': {
          const filter = String(args.filter || 'upcoming')
          const all = this.reminderService.listAll()
          const reminders =
            filter === 'completed'
              ? all.filter((r) => r.status === 'completed' || r.status === 'dismissed')
              : all.filter(
                  (r) =>
                    r.status === 'scheduled' ||
                    r.status === 'triggered' ||
                    r.status === 'snoozed'
                )

          return {
            success: true,
            message: `Found ${reminders.length} ${filter} reminder(s).`,
            data: {
              count: reminders.length,
              userTimeZone: getUserTimeZone(),
              // Normalized: includes `localTime` in the user's timezone plus the
              // raw ISO `scheduledAt` — never a bare UTC timestamp to convert.
              reminders: reminders.map((r) => normalizeReminder(r))
            }
          }
        }

        case 'snooze_reminder': {
          const id = args.id ? String(args.id).trim() : null
          const title = args.title ? String(args.title).trim() : null
          const minutes = Number(args.minutes) || 5

          const matchResult = this.findTargetReminder(id, title, true)

          if (matchResult.ambiguityError) {
            return {
              success: false,
              ambiguous: true,
              message: matchResult.ambiguityError
            }
          }

          if (!matchResult.target) {
            return {
              success: false,
              message: matchResult.notFoundError || 'Could not find the specified reminder to snooze.'
            }
          }

          const updated = await this.reminderService.snooze(matchResult.target.id, minutes)
          return {
            success: true,
            message: `Snoozed "${updated.title}" for ${minutes} minutes.`,
            data: { id: updated.id, minutes, reminder: updated }
          }
        }

        case 'cancel_reminder':
        case 'delete_reminder': {
          const id = args.id ? String(args.id).trim() : null
          const title = args.title ? String(args.title).trim() : null

          // Validate before executing: 1 match → proceed, many → ask, none → report.
          const resolution = this.resolveTarget<Reminder>(
            this.reminderService.listAll(),
            (r) => ({ id: r.id, title: r.title, startHuman: r.scheduledAt }),
            { id, title },
            'reminder'
          )
          if (resolution.status !== 'ok') {
            return resolution.result
          }

          const target = resolution.target
          try {
            await this.reminderService.delete(target.id)
          } catch (err) {
            return { success: false, message: this.toSafeErrorMessage(err, 'delete_reminder') }
          }

          // Verification: the reminder must actually be gone.
          if (this.reminderService.getById(target.id)) {
            return {
              success: false,
              message: "That reminder couldn't be deleted. Please try again."
            }
          }

          return {
            success: true,
            message: `Reminder "${target.title}" deleted.`,
            data: { id: target.id, title: target.title, verified: true }
          }
        }

        case 'update_reminder': {
          const id = args.id ? String(args.id).trim() : null
          const title = args.title ? String(args.title).trim() : null
          const newTitle = args.newTitle ? String(args.newTitle).trim() : null
          const scheduledAt = args.scheduledAt ? String(args.scheduledAt).trim() : null

          if (!newTitle && !scheduledAt) {
            return {
              success: false,
              needsClarification: true,
              message: 'What should change on the reminder — a new title, a new time, or both?',
              data: { code: 'missing_info' }
            }
          }

          const resolution = this.resolveTarget<Reminder>(
            this.reminderService.listAll(),
            (r) => ({ id: r.id, title: r.title, startHuman: r.scheduledAt }),
            { id, title },
            'reminder'
          )
          if (resolution.status !== 'ok') {
            return resolution.result
          }

          const target = resolution.target
          try {
            await this.reminderService.update({
              id: target.id,
              title: newTitle ?? undefined,
              scheduledAt: scheduledAt ?? undefined
            })

            // Verification: the stored reminder reflects the requested change.
            const verify = this.reminderService.getById(target.id)
            if (!verify) {
              return {
                success: false,
                message: "That reminder couldn't be updated. Please try again."
              }
            }

            return {
              success: true,
              message: `Reminder updated: "${verify.title}" at ${formatHumanReadableDateTime(verify.scheduledAt, getUserTimeZone())}.`,
              data: { ...normalizeReminder(verify), verified: true }
            }
          } catch (err) {
            return { success: false, message: this.toSafeErrorMessage(err, 'update_reminder') }
          }
        }

        // --- Personal Memories ---
        case 'create_memory': {
          const content = String(args.content || '').trim()
          const type = (args.type ? String(args.type).trim() : 'general') as MemoryType

          if (!content) {
            return { success: false, message: 'Missing memory content.' }
          }

          const memory = await this.memoryService.create({
            content,
            type
          })

          return {
            success: true,
            message: `Got it. I'll remember that ${memory.content}`,
            data: memory
          }
        }

        case 'search_memory': {
          const query = String(args.query || '').trim()
          if (!query) {
            return { success: false, message: 'Missing search query.' }
          }

          const memories = this.memoryService.search(query, 20)
          return {
            success: true,
            message: 'Found ' + memories.length + ' memories matching "' + query + '".',
            data: memories
          }
        }

        case 'list_memories': {
          const type = args.type ? (String(args.type).trim() as MemoryType) : undefined
          const memories = type
            ? this.memoryService.listByType(type, 20)
            : this.memoryService.listAll(20)
          return {
            success: true,
            message: 'Found ' + memories.length + ' stored memories.',
            data: memories
          }
        }

        case 'update_memory': {
          const id = args.id ? String(args.id).trim() : null
          const query = args.query ? String(args.query).trim() : null
          const newContent = String(args.newContent || '').trim()
          const type = args.type ? (String(args.type).trim() as MemoryType) : undefined

          if (!newContent) {
            return { success: false, message: 'Missing new memory content.' }
          }

          const matchResult = this.findTargetMemory(id, query)
          if (matchResult.ambiguityError) {
            return {
              success: false,
              ambiguous: true,
              message: matchResult.ambiguityError
            }
          }

          if (!matchResult.target) {
            return {
              success: false,
              message: matchResult.notFoundError || 'Could not find the specified memory to update.'
            }
          }

          const updated = await this.memoryService.update({
            id: matchResult.target.id,
            content: newContent,
            type: type || matchResult.target.type
          })

          return {
            success: true,
            message: 'Updated memory to: "' + updated.content + '".',
            data: updated
          }
        }

        case 'delete_memory': {
          const id = args.id ? String(args.id).trim() : null
          const query = args.query ? String(args.query).trim() : null

          const matchResult = this.findTargetMemory(id, query)
          if (matchResult.ambiguityError) {
            return {
              success: false,
              ambiguous: true,
              message: matchResult.ambiguityError
            }
          }

          if (!matchResult.target) {
            return {
              success: false,
              message: matchResult.notFoundError || 'Could not find the specified memory to delete.'
            }
          }

          await this.memoryService.delete(matchResult.target.id)
          return {
            success: true,
            message: 'Forgot memory: "' + matchResult.target.content + '".',
            data: { id: matchResult.target.id }
          }
        }

        // --- Google Calendar (Phase 7) ---
        case 'get_upcoming_events': {
          // Connection state comes from GoogleCalendarService.getStatus() — the
          // single backend source of truth shared with the Calendar UI.
          let notConnected: ActionResult | null = null
          try {
            const status = await this.calendarService.getStatus()
            if (status.status === 'disconnected' || status.status === 'reauth_required') {
              notConnected = this.calendarNotConnectedResult()
            }
          } catch (err) {
            console.error('[ActionExecutor] Failed to read calendar status:', err)
          }

          if (notConnected) return notConnected

          let events: CalendarEvent[] | null = null
          try {
            events = await this.calendarService.getUpcomingEvents()
          } catch (err: unknown) {
            const errStr = err instanceof Error ? err.message : String(err)
            if (
              errStr.includes('NOT_AUTHENTICATED') ||
              errStr.includes('not connected') ||
              errStr.includes('AUTH_EXPIRED')
            ) {
              return this.calendarNotConnectedResult()
            }
            if (errStr.includes('CALENDAR_UNAVAILABLE')) {
              // Transient: the account IS connected, Google just isn't reachable.
              return {
                success: false,
                message: "Can't reach Google Calendar right now. Check your internet connection."
              }
            }
            console.error('[ActionExecutor] get_upcoming_events failed:', errStr)
            return {
              success: false,
              message: "Couldn't load your calendar events. Please try again."
            }
          }

          if (!events) {
            return this.calendarNotConnectedResult()
          }

          // Canonical argument name: range
          const range = String(args.range || 'next_7_days').toLowerCase()
          const query = args.query ? String(args.query).trim().toLowerCase() : null

          const now = new Date()
          const todayStart = new Date(now)
          todayStart.setHours(0, 0, 0, 0)
          const todayEnd = new Date(now)
          todayEnd.setHours(23, 59, 59, 999)

          const tomorrowStart = new Date(todayStart.getTime() + 24 * 3600 * 1000)
          const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 3600 * 1000)

          // this_week: from start of today until the end of current week (Sunday 23:59:59.999)
          const currentDayOfWeek = now.getDay()
          const daysUntilEndOfWeek = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek
          const thisWeekEnd = new Date(todayEnd.getTime() + daysUntilEndOfWeek * 24 * 3600 * 1000)

          // next_7_days: rolling 7 x 24-hour window starting now (start = now, end = now + 7 days)
          const next7DaysStart = now
          const next7DaysEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000)

          const isEventInRange = (e: CalendarEvent, start: Date, end: Date): boolean => {
            if (e.allDay && e.startDate) {
              const [y, m, d] = e.startDate.split('-').map(Number)
              const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0)
              const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999)
              return dayEnd >= start && dayStart <= end
            }
            if (e.startDateTime) {
              const dObj = new Date(e.startDateTime)
              return dObj >= start && dObj <= end
            }
            return false
          }

          let filtered: CalendarEvent[]

          if (range === 'today') {
            filtered = events.filter((e) => isEventInRange(e, todayStart, todayEnd))
          } else if (range === 'tomorrow') {
            filtered = events.filter((e) => isEventInRange(e, tomorrowStart, tomorrowEnd))
          } else if (range === 'this_week') {
            filtered = events.filter((e) => isEventInRange(e, todayStart, thisWeekEnd))
          } else if (range === 'next_7_days') {
            filtered = events.filter((e) => isEventInRange(e, next7DaysStart, next7DaysEnd))
          } else {
            filtered = events.filter((e) => isEventInRange(e, next7DaysStart, next7DaysEnd))
          }

          if (query) {
            filtered = filtered.filter(
              (e) =>
                (e.title && e.title.toLowerCase().includes(query)) ||
                (e.description && e.description.toLowerCase().includes(query)) ||
                (e.location && e.location.toLowerCase().includes(query))
            )
          }

          // Timezone-safe payload: ISO + IANA timezone + human-readable times.
          // Reminder lead times ride along in a separate `reminders` field so a
          // reminder can never be mistaken for an event start.
          const userTimeZone = getUserTimeZone()
          const cleanEvents = filtered.slice(0, 20).map((e) => normalizeCalendarEvent(e, userTimeZone))

          return {
            success: true,
            message: `Found ${cleanEvents.length} calendar event(s).`,
            data: {
              range,
              count: cleanEvents.length,
              userTimeZone,
              events: cleanEvents
            }
          }
        }

        // --- Calendar event writes (create / update / delete) ---
        case 'create_calendar_event': {
          const title = String(args.title || '').trim()
          const startDateTime = String(args.startDateTime || '').trim()

          if (!title) {
            return { success: false, message: 'Missing event title.' }
          }
          if (!startDateTime) {
            return {
              success: false,
              needsClarification: true,
              message: 'When does the event start?',
              data: { code: 'missing_info' }
            }
          }

          let created
          try {
            created = await this.calendarService.createEvent({
              title,
              startDateTime,
              endDateTime: args.endDateTime ? String(args.endDateTime).trim() : undefined,
              timeZone: args.timeZone ? String(args.timeZone).trim() : undefined,
              location: args.location ? String(args.location).trim() : undefined,
              description: args.description ? String(args.description).trim() : undefined
            })
          } catch (err) {
            return { success: false, message: this.toSafeErrorMessage(err, 'create_calendar_event') }
          }

          const normalized = normalizeCalendarEvent(created, getUserTimeZone())
          return {
            success: true,
            message: `Event "${created.title}" created — starts ${normalized.startHumanReadable}.`,
            data: normalized
          }
        }

        case 'update_calendar_event': {
          const eventId = args.eventId ? String(args.eventId).trim() : null
          const title = args.title ? String(args.title).trim() : null
          const patch = {
            title: args.newTitle ? String(args.newTitle).trim() : undefined,
            startDateTime: args.startDateTime ? String(args.startDateTime).trim() : undefined,
            endDateTime: args.endDateTime ? String(args.endDateTime).trim() : undefined,
            timeZone: args.timeZone ? String(args.timeZone).trim() : undefined,
            location: args.location ? String(args.location).trim() : undefined,
            description: args.description !== undefined ? String(args.description) : undefined
          }

          const hasPatch = Object.values(patch).some(
            (v) => v !== undefined && String(v).trim() !== ''
          )
          if (!hasPatch) {
            return {
              success: false,
              needsClarification: true,
              message: 'What should change on the event — the title, time, location, or description?',
              data: { code: 'missing_info' }
            }
          }

          // Validate the target before touching Google Calendar.
          let targetId: string
          let targetTitle: string
          if (eventId) {
            try {
              const existing = await this.calendarService.getEvent(eventId)
              targetId = existing.id
              targetTitle = existing.title
            } catch (err) {
              const safe = this.toSafeErrorMessage(err, 'update_calendar_event')
              return { success: false, message: safe }
            }
          } else {
            let upcoming: CalendarEvent[] = []
            try {
              upcoming = (await this.calendarService.getUpcomingEvents()) || []
            } catch (err) {
              return { success: false, message: this.toSafeErrorMessage(err, 'update_calendar_event') }
            }

            const resolution = this.resolveTarget<CalendarEvent>(
              upcoming,
              (e) => ({
                id: e.id,
                title: e.title,
                startHuman: normalizeCalendarEvent(e, getUserTimeZone()).startHumanReadable
              }),
              { title },
              'event'
            )
            if (resolution.status !== 'ok') {
              return resolution.result
            }
            targetId = resolution.target.id
            targetTitle = resolution.target.title
          }

          let updated
          try {
            updated = await this.calendarService.updateEvent(targetId, patch)
          } catch (err) {
            return { success: false, message: this.toSafeErrorMessage(err, 'update_calendar_event') }
          }

          const normalized = normalizeCalendarEvent(updated, getUserTimeZone())
          return {
            success: true,
            message: `Event "${updated.title}" updated — starts ${normalized.startHumanReadable}.`,
            data: { ...normalized, originalTitle: targetTitle, verified: true }
          }
        }

        case 'delete_calendar_event': {
          const eventId = args.eventId ? String(args.eventId).trim() : null
          const title = args.title ? String(args.title).trim() : null

          if (!eventId && !title) {
            return {
              success: false,
              needsClarification: true,
              message: 'Which event should I delete?',
              data: { code: 'missing_info' }
            }
          }

          let targetId: string
          let targetTitle: string
          if (eventId) {
            try {
              const existing = await this.calendarService.getEvent(eventId)
              targetId = existing.id
              targetTitle = existing.title
            } catch (err) {
              return { success: false, message: this.toSafeErrorMessage(err, 'delete_calendar_event') }
            }
          } else {
            let upcoming: CalendarEvent[] = []
            try {
              upcoming = (await this.calendarService.getUpcomingEvents()) || []
            } catch (err) {
              return { success: false, message: this.toSafeErrorMessage(err, 'delete_calendar_event') }
            }

            const resolution = this.resolveTarget<CalendarEvent>(
              upcoming,
              (e) => ({
                id: e.id,
                title: e.title,
                startHuman: normalizeCalendarEvent(e, getUserTimeZone()).startHumanReadable
              }),
              { title },
              'event'
            )
            if (resolution.status !== 'ok') {
              return resolution.result
            }
            targetId = resolution.target.id
            targetTitle = resolution.target.title
          }

          let outcome: { deleted: boolean; alreadyGone: boolean }
          try {
            outcome = await this.calendarService.deleteEvent(targetId)
          } catch (err) {
            return { success: false, message: this.toSafeErrorMessage(err, 'delete_calendar_event') }
          }

          return {
            success: true,
            message: outcome.alreadyGone && !outcome.deleted
              ? `"${targetTitle}" was already gone — nothing to delete.`
              : `Event "${targetTitle}" deleted.`,
            data: { id: targetId, title: targetTitle, ...outcome, verified: true }
          }
        }

        default:
          return {
            success: false,
            message: 'Unknown tool: "' + name + '"'
          }
      }
    } catch (err) {
      console.error('[ActionExecutor] Error executing tool "' + name + '":', err)
      return {
        success: false,
        message: this.toSafeErrorMessage(err, name)
      }
    }
  }
}
