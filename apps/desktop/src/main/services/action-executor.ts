import { ReminderService } from './reminder.service'
import { MemoryService } from './memory.service'
import type { Reminder } from '../storage/reminder.repository'
import type { Memory, MemoryType } from '../storage/memory.repository'

export interface ToolExecutionResult {
  success: boolean
  message: string
  data?: unknown
  ambiguous?: boolean
}

export class ActionExecutor {
  private static instance: ActionExecutor | null = null
  private reminderService: ReminderService
  private memoryService: MemoryService

  private constructor() {
    this.reminderService = ReminderService.getInstance()
    this.memoryService = MemoryService.getInstance()
  }

  public static getInstance(): ActionExecutor {
    if (!ActionExecutor.instance) {
      ActionExecutor.instance = new ActionExecutor()
    }
    return ActionExecutor.instance
  }

  public getToolDeclarations(): unknown[] {
    return [
      // 1. Reminders Tools
      {
        name: 'create_reminder',
        description: 'Creates and schedules a reminder for the user at a specified future date and time.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'The short, descriptive title of what to be reminded about (e.g. "Call Rahul", "Team meeting").'
            },
            scheduledAt: {
              type: 'STRING',
              description: 'The exact ISO 8601 UTC date-time string when the reminder is scheduled to trigger (e.g. "2026-09-21T04:30:00.000Z").'
            },
            alarmEnabled: {
              type: 'BOOLEAN',
              description: 'Whether to enable sound/alarm notification for this reminder. Defaults to true.'
            }
          },
          required: ['title', 'scheduledAt']
        }
      },
      {
        name: 'list_reminders',
        description: 'Lists all currently scheduled and upcoming reminders for the user.',
        parameters: {
          type: 'OBJECT',
          properties: {}
        }
      },
      {
        name: 'complete_reminder',
        description: 'Marks a reminder as completed by its ID or exact title match.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'The unique ID of the reminder if known.'
            },
            title: {
              type: 'STRING',
              description: 'The exact title of the reminder to match if ID is not known.'
            }
          }
        }
      },
      {
        name: 'delete_reminder',
        description: 'Deletes / cancels a reminder by its ID or exact title match.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'The unique ID of the reminder if known.'
            },
            title: {
              type: 'STRING',
              description: 'The exact title of the reminder to match if ID is not known.'
            }
          }
        }
      },

      // 2. Personal Memory Tools (Phase 5)
      {
        name: 'create_memory',
        description: 'Saves a personal fact, preference, person note, work note, or general detail to memory ONLY when the user explicitly instructs Calby to remember/save/keep something in memory (e.g. "Remember Rahul handles payments").',
        parameters: {
          type: 'OBJECT',
          properties: {
            content: {
              type: 'STRING',
              description: 'The concise personal fact or note to remember (e.g. "Rahul handles the payment module").'
            },
            type: {
              type: 'STRING',
              enum: ['fact', 'preference', 'person', 'work', 'general'],
              description: 'The category of the memory. Defaults to general.'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'search_memory',
        description: 'Searches stored personal memories by query/keyword when the user asks a question about their saved personal context (e.g. "Who handles payments?").',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The search term or keyword to find relevant memories.'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'list_memories',
        description: 'Lists stored personal memories, optionally filtered by category/type.',
        parameters: {
          type: 'OBJECT',
          properties: {
            type: {
              type: 'STRING',
              enum: ['fact', 'preference', 'person', 'work', 'general'],
              description: 'Optional category filter.'
            }
          }
        }
      },
      {
        name: 'update_memory',
        description: 'Updates the content or type of an existing memory when the user explicitly asks to change or correct a stored memory.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'The unique ID of the memory if known.'
            },
            query: {
              type: 'STRING',
              description: 'A query or key phrase matching the old memory content to update if ID is not known.'
            },
            newContent: {
              type: 'STRING',
              description: 'The new replacement memory content.'
            },
            type: {
              type: 'STRING',
              enum: ['fact', 'preference', 'person', 'work', 'general'],
              description: 'Optional new category/type.'
            }
          },
          required: ['newContent']
        }
      },
      {
        name: 'delete_memory',
        description: 'Deletes / forgets an existing memory when the user explicitly asks to forget or remove a stored memory.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: {
              type: 'STRING',
              description: 'The unique ID of the memory if known.'
            },
            query: {
              type: 'STRING',
              description: 'A query or key phrase matching the memory content to forget if ID is not known.'
            }
          }
        }
      }
    ]
  }

  private findTargetReminder(
    id?: string | null,
    title?: string | null,
    filterNonCompleted: boolean = false
  ): { target: Reminder | null; ambiguityError?: string; notFoundError?: string } {
    if (id) {
      const target = this.reminderService.getById(id)
      if (!target) {
        return { target: null, notFoundError: 'No reminder found with ID "' + id + '".' }
      }
      return { target }
    }

    if (!title) {
      return { target: null, notFoundError: 'Neither reminder ID nor title was provided.' }
    }

    const normalizedTarget = title.trim().toLowerCase()
    if (!normalizedTarget) {
      return { target: null, notFoundError: 'Provided title is empty.' }
    }

    let candidates = this.reminderService.listAll()
    if (filterNonCompleted) {
      candidates = candidates.filter((r) => r.status !== 'completed' && r.status !== 'dismissed')
    }

    const exactMatches = candidates.filter(
      (r) => r.title.trim().toLowerCase() === normalizedTarget
    )

    if (exactMatches.length === 1) {
      return { target: exactMatches[0] }
    }

    if (exactMatches.length > 1) {
      return {
        target: null,
        ambiguityError: 'Found multiple reminders matching "' + title + '". Please specify which one by scheduled time or exact details.'
      }
    }

    return {
      target: null,
      notFoundError: 'No reminder found with exact title "' + title + '".'
    }
  }

  private findTargetMemory(
    id?: string | null,
    query?: string | null
  ): { target: Memory | null; ambiguityError?: string; notFoundError?: string } {
    if (id) {
      const target = this.memoryService.getById(id)
      if (!target) {
        return { target: null, notFoundError: 'No memory found with ID "' + id + '".' }
      }
      return { target }
    }

    if (!query) {
      return { target: null, notFoundError: 'Neither memory ID nor search query was provided.' }
    }

    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery) {
      return { target: null, notFoundError: 'Provided query is empty.' }
    }

    const matches = this.memoryService.search(trimmedQuery, 20)

    if (matches.length === 0) {
      return {
        target: null,
        notFoundError: 'No memory found matching "' + query + '".'
      }
    }

    if (matches.length === 1) {
      return { target: matches[0] }
    }

    // Check if there is an exact case-insensitive match among multiple
    const exactMatches = matches.filter((m) => m.content.trim().toLowerCase() === trimmedQuery)
    if (exactMatches.length === 1) {
      return { target: exactMatches[0] }
    }

    return {
      target: null,
      ambiguityError: 'Found ' + matches.length + ' memories matching "' + query + '". Please clarify which memory you would like to modify.'
    }
  }

  public async executeTool(name: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    console.log('[ActionExecutor] Executing tool "' + name + '" with args:', args)

    try {
      switch (name) {
        // --- Reminders ---
        case 'create_reminder': {
          const title = String(args.title || '').trim()
          let scheduledAt = String(args.scheduledAt || '').trim()
          const alarmEnabled = args.alarmEnabled !== undefined ? Boolean(args.alarmEnabled) : true

          if (!title) {
            return { success: false, message: 'Missing reminder title.' }
          }

          const dateObj = new Date(scheduledAt)
          if (isNaN(dateObj.getTime())) {
            return {
              success: false,
              message: 'Invalid scheduled date format: "' + scheduledAt + '". Must be an ISO 8601 string.'
            }
          }

          scheduledAt = dateObj.toISOString()

          const reminder = await this.reminderService.create({
            title,
            scheduledAt,
            alarmEnabled
          })

          const localTime = new Date(reminder.scheduledAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })

          return {
            success: true,
            message: 'Reminder "' + reminder.title + '" successfully created for ' + localTime + '.',
            data: reminder
          }
        }

        case 'list_reminders': {
          const reminders = this.reminderService.listAll()
          const pending = reminders.filter((r) => r.status === 'scheduled' || r.status === 'snoozed')
          return {
            success: true,
            message: 'Found ' + pending.length + ' pending reminders.',
            data: pending
          }
        }

        case 'complete_reminder': {
          const id = args.id ? String(args.id).trim() : null
          const title = args.title ? String(args.title).trim() : null

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
              message: matchResult.notFoundError || 'Could not find the specified reminder to complete.'
            }
          }

          const completed = await this.reminderService.complete(matchResult.target.id)
          return {
            success: true,
            message: 'Reminder "' + completed.title + '" marked as complete.',
            data: completed
          }
        }

        case 'delete_reminder': {
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

        // --- Personal Memories (Phase 5) ---
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

          // Bounded search limit (max 20)
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
