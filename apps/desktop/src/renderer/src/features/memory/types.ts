export type MemoryType = 'fact' | 'preference' | 'person' | 'work' | 'general'

export type MemoryFilterType = 'all' | MemoryType

export interface Memory {
  id: string
  content: string
  type: MemoryType
  createdAt: string
  updatedAt: string
}

export interface CreateMemoryInput {
  content: string
  type?: MemoryType
}

export interface UpdateMemoryInput {
  id: string
  content?: string
  type?: MemoryType
}
