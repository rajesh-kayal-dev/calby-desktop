import type { ClearDataResult, ClearMemoriesResult } from './types'

export async function clearAllMemories(): Promise<ClearMemoriesResult> {
  if (!window.calby?.settings) {
    throw new Error('window.calby.settings API is unavailable')
  }
  const result = await window.calby.settings.clearMemories()
  if (!result.ok) {
    throw new Error(result.error.message || 'Failed to clear memories')
  }
  return result.data
}

export async function clearAllLocalData(): Promise<ClearDataResult> {
  if (!window.calby?.settings) {
    throw new Error('window.calby.settings API is unavailable')
  }
  const result = await window.calby.settings.clearAllData()
  if (!result.ok) {
    throw new Error(result.error.message || 'Failed to clear all local data')
  }
  return result.data
}

export async function openSystemMicSettings(): Promise<void> {
  if (!window.calby?.settings) {
    throw new Error('window.calby.settings API is unavailable')
  }
  await window.calby.settings.openMicrophoneSettings()
}
