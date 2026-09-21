import { app } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import type { Reminder } from '../../storage/reminder.repository'
import type { IReminderWakeScheduler } from './reminder-wake-scheduler.interface'

const execFileAsync = promisify(execFile)

/**
 * Windows Task Scheduler integration for offline and post-quit reminder wake-up.
 * Uses native schtasks.exe with XML task definitions to configure StartWhenAvailable
 * and WakeToRun for robust delivery across system restarts and full app quits.
 */
export class WindowsReminderScheduler implements IReminderWakeScheduler {
  private static instance: WindowsReminderScheduler | null = null

  private constructor() {}

  public static getInstance(): WindowsReminderScheduler {
    if (!WindowsReminderScheduler.instance) {
      WindowsReminderScheduler.instance = new WindowsReminderScheduler()
    }
    return WindowsReminderScheduler.instance
  }

  /**
   * Schedules or updates a one-time Windows Task Scheduler task for a reminder.
   */
  public async scheduleWake(reminder: Reminder): Promise<void> {
    if (process.platform !== 'win32') return

    // Do not schedule tasks for inactive reminders
    if (reminder.status === 'completed' || reminder.status === 'dismissed') {
      await this.cancelWake(reminder.id)
      return
    }

    const scheduledDate = new Date(reminder.scheduledAt)
    // Only schedule future or recent reminders
    if (isNaN(scheduledDate.getTime())) {
      console.warn(`[WindowsReminderScheduler] Invalid scheduled date for reminder ${reminder.id}`)
      return
    }

    const taskName = `Calby\\CalbyReminder-${reminder.id}`
    const startBoundary = this.formatLocalIso(scheduledDate)
    const xmlContent = this.generateTaskXml(reminder.id, startBoundary)

    const tempDir = join(app.getPath('userData'), 'temp-tasks')
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    const tempXmlPath = join(tempDir, `${reminder.id}.xml`)

    try {
      // Write XML file encoded in utf-16le or utf-8 with BOM for schtasks
      writeFileSync(tempXmlPath, xmlContent, 'utf-8')

      await execFileAsync('schtasks.exe', [
        '/create',
        '/tn',
        taskName,
        '/xml',
        tempXmlPath,
        '/f'
      ])

      console.log(`[WindowsReminderScheduler] Successfully registered task "${taskName}" for ${startBoundary}`)
    } catch (err) {
      console.warn(`[WindowsReminderScheduler] Failed to register task for reminder ${reminder.id}:`, err)
    } finally {
      if (existsSync(tempXmlPath)) {
        try {
          unlinkSync(tempXmlPath)
        } catch {
          // ignore cleanup failure
        }
      }
    }
  }

  /**
   * Deletes a Windows scheduled task for a reminder.
   */
  public async cancelWake(reminderId: string): Promise<void> {
    if (process.platform !== 'win32') return

    const taskName = `Calby\\CalbyReminder-${reminderId}`
    try {
      await execFileAsync('schtasks.exe', ['/delete', '/tn', taskName, '/f'])
      console.log(`[WindowsReminderScheduler] Deleted task "${taskName}"`)
    } catch (err: unknown) {
      // Ignore if task was already absent
      const errMsg = String(err)
      if (!errMsg.includes('cannot find the file') && !errMsg.includes('ERROR: The system cannot find')) {
        console.warn(`[WindowsReminderScheduler] Error deleting task "${taskName}":`, err)
      }
    }
  }

  /**
   * Reconciles Windows scheduled tasks against active SQLite reminders:
   * 1. Deletes orphaned tasks that no longer match active reminders.
   * 2. Re-creates missing tasks for active upcoming reminders.
   */
  public async reconcile(activeReminders: Reminder[]): Promise<void> {
    if (process.platform !== 'win32') return

    console.log('[WindowsReminderScheduler] Starting startup reconciliation of scheduled tasks...')
    const activeIds = new Set(activeReminders.map((r) => r.id))

    try {
      const { stdout } = await execFileAsync('schtasks.exe', ['/query', '/fo', 'CSV', '/nh'])
      const lines = stdout.split(/\r?\n/)

      for (const line of lines) {
        if (!line.trim()) continue
        // CSV format: "TaskName","Next Run Time","Status"
        const parts = line.split('","').map((p) => p.replace(/^"|"$/g, ''))
        const fullTaskName = parts[0] || ''

        if (fullTaskName.includes('CalbyReminder-')) {
          const match = fullTaskName.match(/CalbyReminder-([a-zA-Z0-9_-]+)/)
          if (match && match[1]) {
            const taskId = match[1]
            if (!activeIds.has(taskId)) {
              console.log(`[WindowsReminderScheduler] Removing orphaned task: ${fullTaskName}`)
              await this.cancelWake(taskId)
            }
          }
        }
      }
    } catch (queryErr) {
      console.warn('[WindowsReminderScheduler] Could not query scheduled tasks list for reconciliation:', queryErr)
    }

    // Ensure all future active reminders have their tasks registered
    const now = Date.now()
    for (const reminder of activeReminders) {
      const scheduledMs = new Date(reminder.scheduledAt).getTime()
      if (scheduledMs > now) {
        await this.scheduleWake(reminder)
      }
    }

    console.log('[WindowsReminderScheduler] Task reconciliation complete.')
  }

  /**
   * Cleans up all Calby reminder scheduled tasks (e.g. for complete data clear / uninstall).
   */
  public async cleanupAll(): Promise<void> {
    if (process.platform !== 'win32') return

    try {
      const { stdout } = await execFileAsync('schtasks.exe', ['/query', '/fo', 'CSV', '/nh'])
      const lines = stdout.split(/\r?\n/)

      for (const line of lines) {
        if (!line.trim()) continue
        const parts = line.split('","').map((p) => p.replace(/^"|"$/g, ''))
        const fullTaskName = parts[0] || ''

        if (fullTaskName.includes('CalbyReminder-')) {
          const match = fullTaskName.match(/CalbyReminder-([a-zA-Z0-9_-]+)/)
          if (match && match[1]) {
            await this.cancelWake(match[1])
          }
        }
      }
      console.log('[WindowsReminderScheduler] Cleaned up all Calby reminder scheduled tasks.')
    } catch (err) {
      console.warn('[WindowsReminderScheduler] Error during cleanupAll tasks:', err)
    }
  }

  /**
   * Generates Task Scheduler XML with StartWhenAvailable and WakeToRun enabled.
   */
  private generateTaskXml(reminderId: string, startBoundary: string): string {
    const isPackaged = app.isPackaged
    const execPath = this.escapeXml(process.execPath)
    let argumentsStr: string

    if (isPackaged) {
      argumentsStr = `--trigger-reminder "${this.escapeXml(reminderId)}"`
    } else {
      // In development: node_modules/electron/dist/electron.exe <appPath> --trigger-reminder <id>
      const appPath = this.escapeXml(app.getAppPath())
      argumentsStr = `"${appPath}" --trigger-reminder "${this.escapeXml(reminderId)}"`
    }

    return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <TimeTrigger>
      <StartBoundary>${startBoundary}</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <WakeToRun>true</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>5</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${execPath}</Command>
      <Arguments>${argumentsStr}</Arguments>
    </Exec>
  </Actions>
</Task>`
  }

  /**
   * Formats a Date object into local time ISO format: YYYY-MM-DDTHH:mm:ss
   * required by Windows Task Scheduler StartBoundary.
   */
  private formatLocalIso(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}`
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
