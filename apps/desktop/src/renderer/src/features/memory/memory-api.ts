import type {
  Memory,
  MemoryType,
  CreateMemoryInput,
  UpdateMemoryInput
} from './types'

export async function fetchMemories(type?: MemoryType): Promise<Memory[]> {
  if (!window.calby?.memory) {
    throw new Error('window.calby.memory API is unavailable')
  }

  const result = await window.calby.memory.list(type ? { type } : undefined)
  if (!result.ok) {
    throw new Error(result.error.message || 'Failed to fetch memories')
  }
  return result.data
}

export async function searchMemories(query: string): Promise<Memory[]> {
  if (!window.calby?.memory) {
    throw new Error('window.calby.memory API is unavailable')
  }

  const result = await window.calby.memory.search(query)
  if (!result.ok) {
    throw new Error(result.error.message || 'Failed to search memories')
  }
  return result.data
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  if (!window.calby?.memory) {
    throw new Error('window.calby.memory API is unavailable')
  }

  const result = await window.calby.memory.create(input)
  if (!result.ok) {
    throw new Error(result.error.message || 'Failed to create memory')
  }
  return result.data
}

export async function updateMemory(input: UpdateMemoryInput): Promise<Memory> {
  if (!window.calby?.memory) {
    throw new Error('window.calby.memory API is unavailable')
  }

  const result = await window.calby.memory.update(input)
  if (!result.ok) {
    throw new Error(result.error.message || 'Failed to update memory')
  }
  return result.data
}

export async function deleteMemory(id: string): Promise<void> {
  if (!window.calby?.memory) {
    throw new Error('window.calby.memory API is unavailable')
  }

  const result = await window.calby.memory.delete(id)
  if (!result.ok) {
    throw new Error(result.error.message || 'Failed to delete memory')
  }
}
