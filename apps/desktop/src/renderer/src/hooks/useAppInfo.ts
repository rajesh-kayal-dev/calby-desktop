import { useState, useEffect } from 'react'
import type { SystemInfo } from '../types/calby'

export interface UseAppInfoResult {
  info: SystemInfo | null
  loading: boolean
  error: string | null
}

export const useAppInfo = (): UseAppInfoResult => {
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchInfo = async (): Promise<void> => {
      try {
        if (!window.calby?.system) {
          throw new Error('window.calby.system API is not available')
        }

        const result = await window.calby.system.getInfo()
        if (!isMounted) return

        if (result.ok) {
          setInfo(result.data)
        } else {
          setError(result.error.message || 'Failed to fetch app info')
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void fetchInfo()

    return () => {
      isMounted = false
    }
  }, [])

  return { info, loading, error }
}
