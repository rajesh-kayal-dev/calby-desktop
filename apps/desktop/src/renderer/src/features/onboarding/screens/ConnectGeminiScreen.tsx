import { useState, type FC, type KeyboardEvent } from 'react'

interface ConnectGeminiScreenProps {
  initialKey?: string
  error?: string | null
  onBack: () => void
  onConnect: (key: string) => void
  onSkip?: () => void
}

export const ConnectGeminiScreen: FC<ConnectGeminiScreenProps> = ({
  initialKey = '',
  error,
  onBack,
  onConnect,
  onSkip
}) => {
  const [apiKey, setApiKey] = useState(initialKey)
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleConnect = (): void => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setLocalError('Please enter your Gemini API key.')
      return
    }
    setLocalError(null)
    onConnect(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleConnect()
    }
  }

  const displayedError = localError || error

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden select-none">
      {/* Desktop Sub-Navigation / Steps Header */}
      <div className="px-8 pt-6 pb-3 flex items-center justify-between border-b border-border-subtle/40 bg-[#0E131F]/50 shrink-0">
        <button
          onClick={onBack}
          className="group inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1.5 -ml-2.5 rounded-lg hover:bg-slate-800/60 cursor-pointer"
          type="button"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Back to Step 1</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-6 h-1.5 rounded-full bg-sky-500" />
            <span className="w-6 h-1.5 rounded-full bg-sky-500" />
            <span className="w-6 h-1.5 rounded-full bg-slate-800" />
            <span className="w-6 h-1.5 rounded-full bg-slate-800" />
            <span className="w-6 h-1.5 rounded-full bg-slate-800" />
          </div>
          <span className="text-xs text-slate-500 font-mono">Step 2/5</span>
        </div>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 flex flex-col justify-between px-8 py-6 md:px-16 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center my-auto space-y-6">
          {/* Header Section */}
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-1">
              <span>Google Gemini</span>
              <span className="text-sky-600">/</span>
              <span className="text-slate-400">Flash &amp; Pro Models</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              Connect your Gemini API
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
              Add your Gemini API key to power Calby&apos;s fast local context indexing and meeting intelligence.
            </p>
          </div>

          {/* Error Message Alert */}
          {displayedError && (
            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200">
              <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="leading-relaxed font-medium">{displayedError}</div>
            </div>
          )}

          {/* Input Card Container */}
          <div className="space-y-3.5">
            <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase" htmlFor="gemini-key-input">
              Gemini API Key
            </label>

            <div className="relative flex items-center bg-[#131A29] rounded-xl border border-slate-700/70 shadow-inner focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all duration-200">
              {/* Google 4-Color Logo */}
              <div className="pl-4 pr-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>

              {/* Key Input */}
              <input
                id="gemini-key-input"
                type={showPassword ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  if (displayedError) setLocalError(null)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Paste your Gemini API key..."
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 py-3.5 pr-11 font-mono tracking-wider focus:outline-none border-0 ring-0 focus:ring-0"
              />

              {/* Visibility Toggle Button */}
              <button
                type="button"
                aria-label="Toggle API Key visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Helper Link Row */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <svg className="w-3.5 h-3.5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>Get your API key from</span>
                <a
                  className="text-sky-400 hover:text-sky-300 font-medium underline underline-offset-2 transition-colors cursor-pointer"
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google AI Studio
                </a>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">Free tier available</span>
            </div>
          </div>

          {/* Security Note / Local Storage Assurance Badge */}
          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#121826] border border-border-subtle/80 text-xs text-slate-400">
            <div className="mt-0.5 text-emerald-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="leading-relaxed">
              <span className="text-slate-200 font-medium">Security assurance:</span> Your API key is stored locally in
              OS-secured credential storage on this machine and never shared with external intermediate servers.
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="w-full max-w-xl mx-auto pt-4 pb-2 border-t border-border-subtle/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">Enter ↵</kbd> to continue
          </div>

          <div className="flex items-center space-x-3">
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                type="button"
              >
                Skip for now
              </button>
            )}

            <button
              onClick={handleConnect}
              className="py-2.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all duration-150 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-[#0E131F] active:scale-[0.98] cursor-pointer"
              type="button"
            >
              <span>Connect</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
