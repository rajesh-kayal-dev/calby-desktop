import { ReminderService } from './reminder.service'
import type { Reminder } from '../storage/reminder.repository'

export interface ToolExecutionResult {
  success: boolean
  message: string
  data?: unknown
  ambiguous?: boolean
}

export class ActionExecutor {
  private static instance: ActionExecutor | null = null
  private reminderService: ReminderService

  private constructor() {
    this.reminderService = ReminderService.getInstance()
  }

  public static getInstance(): ActionExecutor {
    if (!ActionExecutor.instance) {
      ActionExecutor.instance = new ActionExecutor()
    }
    return ActionExecutor.instance
  }

  public getToolDeclarations(): unknown[] {
    return [
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
        return { target: null, notFoundError: `No reminder found with ID "${id}".` }
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

    // 1. Exact normalized title match
    const exactMatches = candidates.filter(
      (r) => r.title.trim().toLowerCase() === normalizedTarget
    )

    if (exactMatches.length === 1) {
      return { target: exactMatches[0] }
    }

    if (exactMatches.length > 1) {
      return {
        target: null,
        ambiguityError: `Found multiple reminders matching "${title}". Please specify which one by scheduled time or exact details.`
      }
    }

    return {
      target: null,
      notFoundError: `No reminder found with exact title "${title}".`
    }
  }

  public async executeTool(name: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    console.log(`[ActionExecutor] Executing tool "${name}" with args:`, args)

    try {
      switch (name) {
        case 'create_reminder': {
          const title = String(args.title || '').trim()
          let scheduledAt = String(args.scheduledAt || '').trim()
          const alarmEnabled = args.alarmEnabled !== undefined ? Boolean(args.alarmEnabled) : true

          if (!title) {
            return { success: false, message: 'Missing reminder title.' }
          }

          // Parse ISO date string
          const dateObj = new Date(scheduledAt)
          if (isNaN(dateObj.getTime())) {
            return {
              success: false,
              message: `Invalid scheduled date format: "${scheduledAt}". Must be an ISO 8601 string.`
            }
          }

          // Ensure it is in UTC ISO format
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
            message: `Reminder "${reminder.title}" successfully created for ${localTime}.`,
            data: reminder
          }
        }

        case 'list_reminders': {
          const reminders = this.reminderService.listAll()
          const pending = reminders.filter((r) => r.status === 'scheduled' || r.status === 'snoozed')
          return {
            success: true,
            message: `Found ${pending.length} pending reminders.`,
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
            message: `Reminder "${completed.title}" marked as complete.`,
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
            message: `Reminder "${matchResult.target.title}" cancelled.`,
            data: { id: matchResult.target.id }
          }
        }

        default:
          return {
            success: false,
            message: `Unknown tool: "${name}"`
          }
      }
    } catch (err) {
      console.error(`[ActionExecutor] Error executing tool "${name}":`, err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown tool execution error.'
      }
    }
  }
}