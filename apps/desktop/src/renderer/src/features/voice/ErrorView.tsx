import type { FC } from 'react'

interface ErrorViewProps {
  title?: string
  message?: string
  onRetry: () => void
}

export const ErrorView: FC<ErrorViewProps> = ({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry
}) => {
  return (
    <div
      className="relative z-10 flex flex-col items-center text-center space-y-2 px-6 max-w-sm"
      data-purpose="error-view-container"
    >
      <h2 className="text-base font-semibold text-white tracking-tight">
        {title}
      </h2>
      <p className="text-xs text-slate-400 font-normal leading-relaxed">
        {message}
      </p>
      <button
        onClick={onRetry}
        type="button"
        className="px-5 py-1.5 bg-[#1B2333] hover:bg-[#222C40] active:bg-[#182030] text-slate-200 hover:text-white border border-[#2B354D] rounded-lg text-xs font-medium tracking-wide shadow-lg shadow-black/40 transition-all duration-150 transform active:scale-95 cursor-pointer mt-2"
        data-purpose="retry-action-button"
      >
        Try Again
      </button>
    </div>
  )
}
