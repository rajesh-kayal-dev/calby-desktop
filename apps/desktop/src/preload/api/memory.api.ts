import { ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  CalbyMemoryAPI,
  Memory,
  MemoryType,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryChangedPayload,
  IpcResult
} from '../index.d'

export const memoryApi: CalbyMemoryAPI = {
  list: (params?: { type?: MemoryType; limit?: number }): Promise<IpcResult<Memory[]>> => {
    return ipcRenderer.invoke('memory:list', params)
  },

  get: (id: string): Promise<IpcResult<Memory>> => {
    return ipcRenderer.invoke('memory:get', { id })
  },

  search: (query: string, limit?: number): Promise<IpcResult<Memory[]>> => {
    return ipcRenderer.invoke('memory:search', { query, limit })
  },

  create: (input: CreateMemoryInput): Promise<IpcResult<Memory>> => {
    return ipcRenderer.invoke('memory:create', input)
  },

  update: (input: UpdateMemoryInput): Promise<IpcResult<Memory>> => {
    return ipcRenderer.invoke('memory:update', input)
  },

  delete: (id: string): Promise<IpcResult<{ id: string }>> => {
    return ipcRenderer.invoke('memory:delete', { id })
  },

  onChanged: (callback: (payload: MemoryChangedPayload) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, payload: MemoryChangedPayload): void => {
      callback(payload)
    }
    ipcRenderer.on('memory:changed', handler)
    return () => {
      ipcRenderer.removeListener('memory:changed', handler)
    }
  }
}
