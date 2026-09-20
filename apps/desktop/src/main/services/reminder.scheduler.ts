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
    if (this.isInitialized) {
      this.dueHandler = dueHandler
      this.reschedule()
      return
    }

    this.dueHandler = dueHandler
    this.isInitialized = true

    // 1. Setup 30s periodic safety sweep
    this.safetyInterval = setInterval(() => {
      this.sweep()
    }, SAFETY_TICK_INTERVAL_MS)

    // 2. Setup powerMonitor lifecycle hooks
    powerMonitor.on('resume', () => {
      console.log('[ReminderScheduler] System resumed from sleep. Triggering sweep.')
      this.sweep()
    })

    powerMonitor.on('unlock-screen', () => {
      console.log('[ReminderScheduler] Screen unlocked. Triggering sweep.')
      this.sweep()
    })

    powerMonitor.on('suspend', () => {
      console.log('[ReminderScheduler] System suspending. Clearing transient timer.')
      this.clearActiveTimer()
    })

    // 3. Initial evaluation on startup
    this.sweep()
  }

  public reschedule(): void {
    this.sweep()
  }

  public sweep(): void {
    this.clearActiveTimer()

    const now = Date.now()
    const pending = this.repository.listPending()

    if (pending.length === 0) {
      return
    }

    let nextDueReminderId: string | null = null
    let shortestDelay = Number.POSITIVE_INFINITY

    for (const reminder of pending) {
      const scheduledMs = new Date(reminder.scheduledAt).getTime()
      const delay = scheduledMs - now

      // If already due or overdue
      if (delay <= 0) {
        console.log(`[ReminderScheduler] Reminder ${reminder.id} ("${reminder.title}") is due now. Invoking due handler.`)
        if (this.dueHandler) {
          void this.dueHandler(reminder.id)
        }
      } else if (delay < shortestDelay) {
        shortestDelay = delay
        nextDueReminderId = reminder.id
      }
    }

    // If next reminder is within near-term window (15 mins), arm single high-precision timer
    if (nextDueReminderId && shortestDelay <= MAX_TIMER_DELAY_MS) {
      const targetId = nextDueReminderId
      console.log(`[ReminderScheduler] Arming priority timer for reminder ${targetId} in ${Math.round(shortestDelay / 1000)}s`)
      this.activeTimer = setTimeout(() => {
        console.log(`[ReminderScheduler] Timer fired for reminder ${targetId}`)
        if (this.dueHandler) {
          void this.dueHandler(targetId)
        }
        // Reschedule next after trigger
        this.reschedule()
      }, shortestDelay)
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
  }
}