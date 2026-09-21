import { type FC } from 'react'

interface SignOutResetSectionProps {
  onTriggerReset: () => void
}

export const SignOutResetSection: FC<SignOutResetSectionProps> = ({ onTriggerReset }) => {
  return (
    <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
      <div>
        <h4 className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
          Sign out &amp; reset
        </h4>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
          Remove your local Calby setup and return to the initial setup.
        </p>
      </div>

      <button
        type="button"
        data-testid="signout-reset-button"
        onClick={onTriggerReset}
        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
      >
        Sign out &amp; reset
      </button>
    </div>
  )
}
