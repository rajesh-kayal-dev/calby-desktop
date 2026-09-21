import { app } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'

let dbInstance: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance
  }

  const userDataPath = app.getPath('userData')
  mkdirSync(userDataPath, { recursive: true })
  const dbPath = join(userDataPath, 'calby.db')

  console.log('[Database] Initializing SQLite database at:', dbPath)
  const db = new Database(dbPath)

  // Configure WAL mode and busy timeout for high reliability
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')

  initSchema(db)

  dbInstance = db
  return dbInstance
}

function initSchema(db: Database.Database): void {
  const schema = `
    -- Reminders table
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      alarm_enabled INTEGER NOT NULL DEFAULT 1,
      alert_type TEXT NOT NULL DEFAULT 'notification' CHECK(alert_type IN ('notification', 'alarm')),
      status TEXT NOT NULL CHECK(status IN ('scheduled', 'triggered', 'snoozed', 'completed', 'dismissed', 'missed')),
      snooze_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER,
      missed_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled_at 
    ON reminders (status, scheduled_at);

    CREATE INDEX IF NOT EXISTS idx_reminders_created_at 
    ON reminders (created_at DESC);

    -- Personal Memories table (Phase 5)
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('fact', 'preference', 'person', 'work', 'general')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_memories_type
    ON memories (type);

    CREATE INDEX IF NOT EXISTS idx_memories_created_at
    ON memories (created_at DESC);
  `

  db.exec(schema)

  // Migration: ensure alert_type, missed status, and missed_at exist on existing databases
  try {
    const tableSqlRow = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='reminders'")
      .get() as { sql: string } | undefined
    const columns = db.pragma('table_info(reminders)') as Array<{ name: string }>
    const hasAlertType = columns.some((col) => col.name === 'alert_type')
    const hasMissedAt = columns.some((col) => col.name === 'missed_at')
    const hasMissedStatus = tableSqlRow?.sql.includes("'missed'")

    if (!hasAlertType || !hasMissedAt || !hasMissedStatus) {
      console.log('[Database] Migrating reminders table schema for alert_type, missed status, and missed_at...')
      db.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE IF NOT EXISTS reminders_v2 (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          scheduled_at INTEGER NOT NULL,
          alarm_enabled INTEGER NOT NULL DEFAULT 1,
          alert_type TEXT NOT NULL DEFAULT 'notification' CHECK(alert_type IN ('notification', 'alarm')),
          status TEXT NOT NULL CHECK(status IN ('scheduled', 'triggered', 'snoozed', 'completed', 'dismissed', 'missed')),
          snooze_count INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          completed_at INTEGER,
          missed_at INTEGER
        );
        INSERT INTO reminders_v2 (id, title, scheduled_at, alarm_enabled, alert_type, status, snooze_count, created_at, updated_at, completed_at, missed_at)
          SELECT id, title, scheduled_at, alarm_enabled,
                 ${hasAlertType ? 'alert_type' : "'notification'"},
                 status, snooze_count, created_at, updated_at, completed_at,
                 ${hasMissedAt ? 'missed_at' : 'NULL'}
          FROM reminders;
        DROP TABLE reminders;
        ALTER TABLE reminders_v2 RENAME TO reminders;
        CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled_at ON reminders (status, scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_reminders_created_at ON reminders (created_at DESC);
        PRAGMA foreign_keys = ON;
      `)
      console.log('[Database] Reminders table migration complete.')
    }
  } catch (migErr) {
    console.warn('[Database] Warning checking/migrating reminders table:', migErr)
  }

  console.log('[Database] SQLite schema verified and ready.')
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close()
      console.log('[Database] SQLite database connection closed.')
    } catch (err) {
      console.error('[Database] Error closing SQLite database:', err)
    } finally {
      dbInstance = null
    }
  }
}
