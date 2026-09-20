import { useState, useEffect, useCallback } from 'react'
import type { Memory, MemoryType, MemoryFilterType, CreateMemoryInput, UpdateMemoryInput } from '../types'
import {
  fetchMemories,
  searchMemories,
  createMemory as apiCreateMemory,
  updateMemory as apiUpdateMemory,
  deleteMemory as apiDeleteMemory
} from '../memory-api'

export function useMemory() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<MemoryFilterType>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadMemories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      let data: Memory[]
      if (searchQuery.trim()) {
        data = await searchMemories(searchQuery.trim())
        if (filterType !== 'all') {
          data = data.filter((m) => m.type === filterType)
        }
      } else if (filterType !== 'all') {
        data = await fetchMemories(filterType as MemoryType)
      } else {
        data = await fetchMemories()
      }

      setMemories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories')
    } finally {
      setIsLoading(false)
    }
  }, [filterType, searchQuery])

  useEffect(() => {
    void loadMemories()
  }, [loadMemories])

  // Listen for real-time memory changes (from voice or other components)
  useEffect(() => {
    if (!window.calby?.memory?.onChanged) return

    const unsubscribe = window.calby.memory.onChanged(() => {
      void loadMemories()
    })

    return () => {
      unsubscribe()
    }
  }, [loadMemories])

  const create = async (input: CreateMemoryInput): Promise<Memory> => {
    const newMem = await apiCreateMemory(input)
    await loadMemories()
    return newMem
  }

  const update = async (input: UpdateMemoryInput): Promise<Memory> => {
    const updated = await apiUpdateMemory(input)
    await loadMemories()
    return updated
  }

  const remove = async (id: string): Promise<void> => {
    await apiDeleteMemory(id)
    await loadMemories()
  }

  return {
    memories,
    isLoading,
    error,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    create,
    update,
    remove,
    refresh: loadMemories
  }
}
