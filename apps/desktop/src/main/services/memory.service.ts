import { randomUUID } from 'node:crypto'
import { BrowserWindow } from 'electron'
import { z } from 'zod'
import {
  MemoryRepository,
  type Memory,
  type MemoryType
} from '../storage/memory.repository'

export interface CreateMemoryInput {
  content: string
  type?: MemoryType
}

export interface UpdateMemoryInput {
  id: string
  content?: string
  type?: MemoryType
}

const memoryTypeSchema = z.enum(['fact', 'preference', 'person', 'work', 'general'])

const createMemorySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Memory content cannot be empty')
    .max(1000, 'Memory content cannot exceed 1000 characters'),
  type: memoryTypeSchema.optional().default('general')
})

const updateMemorySchema = z.object({
  id: z.string().trim().min(1, 'Memory ID is required'),
  content: z
    .string()
    .trim()
    .min(1, 'Memory content cannot be empty')
    .max(1000, 'Memory content cannot exceed 1000 characters')
    .optional(),
  type: memoryTypeSchema.optional()
})

export class MemoryService {
  private static instance: MemoryService | null = null
  private repository: MemoryRepository

  private constructor() {
    this.repository = MemoryRepository.getInstance()
  }

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService()
    }
    return MemoryService.instance
  }

  private broadcastChange(action: 'created' | 'updated' | 'deleted', memory: Memory): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('memory:changed', { action, memory })
      }
    }
  }

  public listAll(limit: number = 50): Memory[] {
    return this.repository.listAll(Math.min(limit, 100))
  }

  public listByType(type: MemoryType, limit: number = 50): Memory[] {
    const validatedType = memoryTypeSchema.parse(type)
    return this.repository.listByType(validatedType, Math.min(limit, 100))
  }

  public getById(id: string): Memory | null {
    if (!id || typeof id !== 'string') return null
    return this.repository.findById(id.trim())
  }

  public search(query: string, limit: number = 20): Memory[] {
    const boundedLimit = Math.min(Math.max(1, limit), 50)
    return this.repository.search(query, boundedLimit)
  }

  public async create(input: CreateMemoryInput): Promise<Memory> {
    const parsed = createMemorySchema.parse(input)
    const id = randomUUID()

    const memory = this.repository.create({
      id,
      content: parsed.content,
      type: parsed.type as MemoryType
    })

    this.broadcastChange('created', memory)
    return memory
  }

  public async update(input: UpdateMemoryInput): Promise<Memory> {
    const parsed = updateMemorySchema.parse(input)

    const existing = this.repository.findById(parsed.id)
    if (!existing) {
      throw new Error('Memory with ID ' + parsed.id + ' not found')
    }

    const updated = this.repository.update({
      id: parsed.id,
      content: parsed.content,
      type: parsed.type as MemoryType | undefined
    })

    if (!updated) {
      throw new Error('Failed to update memory with ID ' + parsed.id)
    }

    this.broadcastChange('updated', updated)
    return updated
  }

  public async clearAll(): Promise<number> {
    const count = this.repository.clearAll()
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('memory:changed', { action: 'deleted', memory: { id: 'all' } })
      }
    }
    return count
  }

  public async delete(id: string): Promise<{ id: string }> {
    const trimmedId = id?.trim()
    if (!trimmedId) {
      throw new Error('Memory ID is required')
    }

    const existing = this.repository.findById(trimmedId)
    if (!existing) {
      throw new Error('Memory with ID ' + trimmedId + ' not found')
    }

    const deleted = this.repository.delete(trimmedId)
    if (!deleted) {
      throw new Error('Failed to delete memory with ID ' + trimmedId)
    }

    this.broadcastChange('deleted', existing)
    return { id: trimmedId }
  }
}
