import { ReminderService } from './reminder.service'
import { MemoryService } from './memory.service'
import { GoogleCalendarService, type CalendarEvent } from './google-calendar.service'
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
          'Create a new scheduled reminder. Schedule time must be an ISO 8601 UTC date string.',
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

  public async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<ActionResult> {
    console.log(`[ActionExecutor] Executing tool "${name}" with args:`, args)

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

          const reminder = await this.reminderService.create({
            title,
            scheduledAt: parsedDate.toISOString(),
            alertType,
            alarmEnabled: isAlarm
          })

          return {
            success: true,
            message: `Reminder set for "${reminder.title}" at ${new Date(reminder.scheduledAt).toLocaleTimeString()}${isAlarm ? ' (with alarm)' : ''}.`,
            data: reminder
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
            data: reminders
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

        case 'cancel_reminder': {
          const id = args.id ? String(args.id).trim() : null
          const title = args.title ? String(args.title).trim() : null

          const matchResult = this.findTargetReminder(id, title, false)

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
              message: matchResult.notFoundError || 'Could not find the specified reminder to delete.'
            }
          }

          await this.reminderService.delete(matchResult.target.id)
          return {
            success: true,
            message: 'Reminder "' + matchResult.target.title + '" cancelled.',
            data: { id: matchResult.target.id }
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
            return {
              success: false,
              message: errStr
            }
          }

          if (!events) {
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

          const cleanEvents = filtered.slice(0, 20).map((e) => ({
            id: e.id,
            title: e.title,
            allDay: e.allDay,
            startDate: e.startDate || null,
            startDateTime: e.startDateTime || null,
            endDateTime: e.endDateTime || null,
            location: e.location || null,
            meetingUrl: e.meetingUrl || null
          }))

          return {
            success: true,
            message: `Found ${cleanEvents.length} calendar event(s).`,
            data: {
              range,
              count: cleanEvents.length,
              events: cleanEvents
            }
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
        message: err instanceof Error ? err.message : 'Unknown tool execution error.'
      }
    }
  }
}
