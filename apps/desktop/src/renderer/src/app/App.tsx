import type { FC } from 'react'
import { useAppInfo } from '../hooks/useAppInfo'

export const App: FC = () => {
  const { info, loading, error } = useAppInfo()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface p-6 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-surface-container border border-outline-variant/30 p-6 flex flex-col items-center text-center shadow-2xl transition-all">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-lg mb-4">
          C
        </div>

        <h1 className="text-base font-medium tracking-tight text-white mb-1">
          {info?.name ?? 'Calby'}
        </h1>

        <p className="text-xs text-on-surface-variant font-mono">
          {loading ? 'Initializing foundation...' : error ? `Error: ${error}` : `v${info?.version} (ready)`}
        </p>
      </div>
    </main>
  )
}
