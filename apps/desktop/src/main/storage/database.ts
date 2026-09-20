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

  console.log(`[Database] Initializing SQLite database at: ${dbPath}`)
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
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      alarm_enabled INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK(status IN ('scheduled', 'triggered', 'snoozed', 'completed', 'dismissed')),
      snooze_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled_at 
    ON reminders (status, scheduled_at);

    CREATE INDEX IF NOT EXISTS idx_reminders_created_at 
    ON reminders (created_at DESC);
  `

  db.exec(schema)
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