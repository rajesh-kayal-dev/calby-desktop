import { type FC } from 'react'
import type { MicPermissionState } from '../types'

interface MicrophoneSettingsProps {
  state: MicPermissionState
  onOpenSettings: () => void
}

export const MicrophoneSettings: FC<MicrophoneSettingsProps> = ({ state, onOpenSettings }) => {
  const isGranted = state === 'granted'

  return (
    <div data-testid="microphone-settings" className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#121826] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Microphone</span>
              <span
                data-testid="mic-permission-badge"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  isGranted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isGranted ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isGranted ? 'Permission Granted' : 'Permission Not Granted'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Captures audio during live Push-to-Talk or streaming turns
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          type="button"
          data-testid="open-mic-settings-button"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          System Mic Settings
        </button>
      </div>
    </div>
  )
}
