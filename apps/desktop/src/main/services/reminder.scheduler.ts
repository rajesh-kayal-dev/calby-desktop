import { powerMonitor } from 'electron'
import { ReminderRepository } from '../storage/reminder.repository'

const SAFETY_TICK_INTERVAL_MS = 30 * 1000 // 30s heartbeat
const MAX_TIMER_DELAY_MS = 15 * 60 * 1000 // 15 minutes near-term priority window

export type ReminderDueHandler = (id: string) => Promise<void> | void

export class ReminderScheduler {
  private static instance: ReminderScheduler | null = null
  private repository: ReminderRepository
  private dueHandler: ReminderDueHandler | null = null
  private activeTimer: ReturnType<typeof setTimeout> | null = null
  private safetyInterval: ReturnType<typeof setInterval> | null = null
  private isInitialized: boolean = false
  private triggeringIds: Set<string> = new Set()

  private constructor() {
    this.repository = ReminderRepository.getInstance()
  }

  public static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler()
    }
    return ReminderScheduler.instance
  }

  public init(dueHandler: ReminderDueHandler): void {
    this.dueHandler = dueHandler

    if (this.isInitialized) {
      this.reschedule()
      return
    }

    this.isInitialized = true

    // 1. Setup 30s periodic safety sweep
    this.safetyInterval = setInterval(() => {
      void this.sweep()
    }, SAFETY_TICK_INTERVAL_MS)

    // 2. Setup powerMonitor lifecycle hooks
    powerMonitor.on('resume', () => {
      console.log('[ReminderScheduler] System resumed from sleep. Triggering sweep.')
      void this.sweep()
    })

    powerMonitor.on('unlock-screen', () => {
      console.log('[ReminderScheduler] Screen unlocked. Triggering sweep.')
      void this.sweep()
    })

    powerMonitor.on('suspend', () => {
      console.log('[ReminderScheduler] System suspending. Clearing transient timer.')
      this.clearActiveTimer()
    })

    // 3. Initial evaluation on startup
    console.log('[ReminderScheduler] Initialized. Triggering initial startup sweep.')
    void this.sweep()
  }

  public reschedule(): void {
    void this.sweep()
  }

  public async sweep(): Promise<void> {
    this.clearActiveTimer()

    const now = Date.now()
    const pending = this.repository.listPending()

    if (pending.length === 0) {
      return
    }

    let nextDueReminderId: string | null = null
    let shortestDelay = Number.POSITIVE_INFINITY

    for (const reminder of pending) {
      if (this.triggeringIds.has(reminder.id)) {
        continue
      }

      const scheduledMs = new Date(reminder.scheduledAt).getTime()
      const delay = scheduledMs - now

      // If already due or overdue (allow 1s tolerance for timer jitter)
      if (delay <= 1000) {
        console.log(`[ReminderScheduler] Reminder ${reminder.id} ("${reminder.title}") is due now. Invoking due handler.`)
        this.triggeringIds.add(reminder.id)
        if (this.dueHandler) {
          try {
            await this.dueHandler(reminder.id)
          } catch (err) {
            console.error(`[ReminderScheduler] Error running dueHandler for ${reminder.id}:`, err)
          } finally {
            this.triggeringIds.delete(reminder.id)
          }
        }
      } else if (delay < shortestDelay) {
        shortestDelay = delay
        nextDueReminderId = reminder.id
      }
    }

    // If next reminder is within near-term window (15 mins), arm single high-precision timer
    if (nextDueReminderId && shortestDelay <= MAX_TIMER_DELAY_MS) {
      const targetId = nextDueReminderId
      const targetDelay = Math.max(0, shortestDelay)
      console.log(`[ReminderScheduler] Arming priority timer for reminder ${targetId} in ${Math.round(targetDelay / 1000)}s`)
      this.activeTimer = setTimeout(async () => {
        console.log(`[ReminderScheduler] Priority timer fired for reminder ${targetId}`)
        if (this.dueHandler && !this.triggeringIds.has(targetId)) {
          this.triggeringIds.add(targetId)
          try {
            await this.dueHandler(targetId)
          } catch (err) {
            console.error(`[ReminderScheduler] Error handling timer for reminder ${targetId}:`, err)
          } finally {
            this.triggeringIds.delete(targetId)
          }
        }
        // Reschedule next after trigger
        this.reschedule()
      }, targetDelay)
    }
  }

  private clearActiveTimer(): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer)
      this.activeTimer = null
    }
  }

  public stop(): void {
    this.clearActiveTimer()
    if (this.safetyInterval) {
      clearInterval(this.safetyInterval)
      this.safetyInterval = null
    }
    this.isInitialized = false
    this.triggeringIds.clear()
  }
}