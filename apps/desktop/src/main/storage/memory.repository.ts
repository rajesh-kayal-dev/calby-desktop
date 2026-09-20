import { getDatabase } from './database'

export type MemoryType = 'fact' | 'preference' | 'person' | 'work' | 'general'

export interface Memory {
  id: string
  content: string
  type: MemoryType
  createdAt: string
  updatedAt: string
}

export interface MemoryRow {
  id: string
  content: string
  type: string
  created_at: number
  updated_at: number
}

export interface CreateMemoryRecord {
  id: string
  content: string
  type: MemoryType
}

export interface UpdateMemoryRecord {
  id: string
  content?: string
  type?: MemoryType
}

export class MemoryRepository {
  private static instance: MemoryRepository | null = null

  private constructor() {}

  public static getInstance(): MemoryRepository {
    if (!MemoryRepository.instance) {
      MemoryRepository.instance = new MemoryRepository()
    }
    return MemoryRepository.instance
  }

  private mapRowToMemory(row: MemoryRow): Memory {
    return {
      id: row.id,
      content: row.content,
      type: row.type as MemoryType,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    }
  }

  public listAll(limit: number = 50): Memory[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM memories ORDER BY created_at DESC LIMIT ?')
      .all(limit) as MemoryRow[]
    return rows.map((row) => this.mapRowToMemory(row))
  }

  public listByType(type: MemoryType, limit: number = 50): Memory[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM memories WHERE type = ? ORDER BY created_at DESC LIMIT ?')
      .all(type, limit) as MemoryRow[]
    return rows.map((row) => this.mapRowToMemory(row))
  }

  public findById(id: string): Memory | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as
      | MemoryRow
      | undefined
    return row ? this.mapRowToMemory(row) : null
  }

  public search(query: string, limit: number = 20): Memory[] {
    const db = getDatabase()
    const trimmed = query.trim()
    if (!trimmed) {
      return this.listAll(limit)
    }

    const pattern = '%' + trimmed + '%'
    const rows = db
      .prepare('SELECT * FROM memories WHERE content LIKE ? ORDER BY created_at DESC LIMIT ?')
      .all(pattern, limit) as MemoryRow[]
    return rows.map((row) => this.mapRowToMemory(row))
  }

  public create(data: CreateMemoryRecord): Memory {
    const db = getDatabase()
    const now = Date.now()

    const stmt = db.prepare(`
      INSERT INTO memories (id, content, type, created_at, updated_at)
      VALUES (@id, @content, @type, @created_at, @updated_at)
    `)

    stmt.run({
      id: data.id,
      content: data.content,
      type: data.type,
      created_at: now,
      updated_at: now
    })

    const created = this.findById(data.id)
    if (!created) {
      throw new Error('Failed to retrieve newly created memory with id ' + data.id)
    }
    return created
  }

  public update(data: UpdateMemoryRecord): Memory | null {
    const db = getDatabase()
    const existing = this.findById(data.id)
    if (!existing) {
      return null
    }

    const updates: string[] = ['updated_at = @updated_at']
    const params: Record<string, unknown> = {
      id: data.id,
      updated_at: Date.now()
    }

    if (data.content !== undefined) {
      updates.push('content = @content')
      params.content = data.content
    }

    if (data.type !== undefined) {
      updates.push('type = @type')
      params.type = data.type
    }

    const query = 'UPDATE memories SET ' + updates.join(', ') + ' WHERE id = @id'
    db.prepare(query).run(params)

    return this.findById(data.id)
  }

  public delete(id: string): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM memories WHERE id = ?').run(id)
    return result.changes > 0
  }
}
