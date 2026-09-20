import { type FC } from 'react'

interface MemorySettingsProps {
  memoryCount: number
  onNavigateMemory?: () => void
  onRequestClearMemories: () => void
}

export const MemorySettings: FC<MemorySettingsProps> = ({
  memoryCount,
  onNavigateMemory,
  onRequestClearMemories
}) => {
  return (
    <div data-testid="memory-settings" className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#121826] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">Personal Memory</span>
            <span
              data-testid="memory-count-badge"
              className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20"
            >
              {memoryCount} {memoryCount === 1 ? 'item' : 'items'} stored
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Personal facts and notes remembered from voice commands
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateMemory && (
            <button
              onClick={onNavigateMemory}
              type="button"
              data-testid="view-memories-button"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              View Memories
            </button>
          )}
          <button
            onClick={onRequestClearMemories}
            type="button"
            data-testid="clear-memories-button"
            disabled={memoryCount === 0}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear All Memories
          </button>
        </div>
      </div>
    </div>
  )
}
