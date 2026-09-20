import { ipcMain } from 'electron'
import {
  MemoryService,
  type CreateMemoryInput,
  type UpdateMemoryInput
} from '../services/memory.service'
import type { Memory, MemoryType } from '../storage/memory.repository'

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export function registerMemoryIpc(): void {
  const memoryService = MemoryService.getInstance()

  // 1. List All Memories (or by type)
  ipcMain.handle(
    'memory:list',
    async (
      _event,
      params?: { type?: MemoryType; limit?: number }
    ): Promise<IpcResult<Memory[]>> => {
      try {
        const data = params?.type
          ? memoryService.listByType(params.type, params.limit)
          : memoryService.listAll(params?.limit)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][memory:list] Error:', err)
        return {
          ok: false,
          error: {
            code: 'FETCH_FAILED',
            message: err instanceof Error ? err.message : 'Failed to retrieve memories'
          }
        }
      }
    }
  )

  // 2. Get Memory by ID
  ipcMain.handle(
    'memory:get',
    async (_event, { id }: { id: string }): Promise<IpcResult<Memory>> => {
      try {
        const data = memoryService.getById(id)
        if (!data) {
          return {
            ok: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Memory not found'
            }
          }
        }
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][memory:get] Error:', err)
        return {
          ok: false,
          error: {
            code: 'FETCH_FAILED',
            message: err instanceof Error ? err.message : 'Failed to retrieve memory'
          }
        }
      }
    }
  )

  // 3. Search Memories
  ipcMain.handle(
    'memory:search',
    async (
      _event,
      { query, limit }: { query: string; limit?: number }
    ): Promise<IpcResult<Memory[]>> => {
      try {
        const data = memoryService.search(query || '', limit)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][memory:search] Error:', err)
        return {
          ok: false,
          error: {
            code: 'SEARCH_FAILED',
            message: err instanceof Error ? err.message : 'Failed to search memories'
          }
        }
      }
    }
  )

  // 4. Create Memory
  ipcMain.handle(
    'memory:create',
    async (_event, input: CreateMemoryInput): Promise<IpcResult<Memory>> => {
      try {
        const data = await memoryService.create(input)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][memory:create] Error:', err)
        return {
          ok: false,
          error: {
            code: 'CREATE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to create memory'
          }
        }
      }
    }
  )

  // 5. Update Memory
  ipcMain.handle(
    'memory:update',
    async (_event, input: UpdateMemoryInput): Promise<IpcResult<Memory>> => {
      try {
        const data = await memoryService.update(input)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][memory:update] Error:', err)
        return {
          ok: false,
          error: {
            code: 'UPDATE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to update memory'
          }
        }
      }
    }
  )

  // 6. Delete Memory
  ipcMain.handle(
    'memory:delete',
    async (_event, { id }: { id: string }): Promise<IpcResult<{ id: string }>> => {
      try {
        const data = await memoryService.delete(id)
        return { ok: true, data }
      } catch (err) {
        console.error('[IPC][memory:delete] Error:', err)
        return {
          ok: false,
          error: {
            code: 'DELETE_FAILED',
            message: err instanceof Error ? err.message : 'Failed to delete memory'
          }
        }
      }
    }
  )

  console.log('[IPC] Memory IPC channels registered.')
}
