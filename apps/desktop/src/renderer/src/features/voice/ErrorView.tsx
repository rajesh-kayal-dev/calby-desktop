import type { FC } from 'react'

interface ErrorViewProps {
  message?: string
  onRetry: () => void
}

export const ErrorView: FC<ErrorViewProps> = ({
  message = 'Please check your internet connection and try again.',
  onRetry
}) => {
  return (
    <div className="relative z-10 flex flex-col items-center text-center space-y-3 px-6 max-w-sm" data-purpose="error-view-container">
      <h2 className="text-xl font-semibold text-white tracking-tight">
        Can’t connect right now
      </h2>
      <p className="text-xs text-slate-400 font-normal leading-relaxed">
        {message}
      </p>
      <button
        onClick={onRetry}
        type="button"
        className="px-6 py-2 bg-[#1B2333] hover:bg-[#222C40] active:bg-[#182030] text-slate-200 hover:text-white border border-[#2B354D] rounded-lg text-xs font-medium tracking-wide shadow-lg shadow-black/40 transition-all duration-150 transform active:scale-95 cursor-pointer mt-2"
        data-purpose="retry-action-button"
      >
        Retry
      </button>
    </div>
  )
}
