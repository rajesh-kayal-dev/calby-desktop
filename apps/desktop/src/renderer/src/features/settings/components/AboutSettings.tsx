import { type FC } from 'react'
import type { SystemInfo } from '../types'

interface AboutSettingsProps {
  systemInfo: SystemInfo | null
}

export const AboutSettings: FC<AboutSettingsProps> = ({ systemInfo }) => {
  return (
    <div data-testid="about-settings" className="space-y-3">
      <div className="p-4 rounded-xl bg-[#121826] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">
            CAL
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Calby Desktop</h3>
            <p className="text-[11px] text-slate-400">Personal Desktop AI Voice Assistant</p>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-400 font-mono space-y-0.5">
          <p>
            Version: <span data-testid="app-version" className="text-slate-200">{systemInfo?.version || '1.0.0'}</span>
          </p>
          <p>
            Electron: <span className="text-slate-200">{systemInfo?.electronVersion || '29.x'}</span>
          </p>
          <p>
            Platform: <span className="text-slate-200">{systemInfo?.platform || 'desktop'} ({systemInfo?.arch || 'x64'})</span>
          </p>
        </div>
      </div>
    </div>
  )
}
