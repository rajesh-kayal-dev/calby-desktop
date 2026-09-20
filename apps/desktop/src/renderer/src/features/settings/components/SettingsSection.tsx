import { type FC, type ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
}

export const SettingsSection: FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children
}) => {
  return (
    <div className="p-5 rounded-2xl bg-[#0C101A] border border-slate-800/90 shadow-sm space-y-4">
      <div className="flex items-start gap-3 pb-3 border-b border-slate-800/60">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[#121826] border border-slate-700/60 flex items-center justify-center text-sky-400 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}
