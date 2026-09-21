import { useState, useEffect, type FC, type KeyboardEvent } from 'react'

interface UserNameScreenProps {
  onBack: () => void
  onNext: () => void
}

export const UserNameScreen: FC<UserNameScreenProps> = ({ onBack, onNext }) => {
  const [userName, setUserName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Load initial name if available
  useEffect(() => {
    const loadInitialName = async () => {
      try {
        if (window.calby?.settings?.getConfig) {
          const res = await window.calby.settings.getConfig()
          if (res.ok && res.data?.personalize?.userName) {
            setUserName(res.data.personalize.userName)
          }
        }
      } catch (err) {
        console.error('Failed to load initial user name:', err)
      }
    }
    void loadInitialName()
  }, [])

  const handleContinue = async () => {
    try {
      setIsSaving(true)
      if (window.calby?.settings?.updatePersonalize) {
        await window.calby.settings.updatePersonalize({
          userName: userName.trim()
        })
      }
    } catch (err) {
      console.error('Failed to save user name during onboarding:', err)
    } finally {
      setIsSaving(false)
      onNext()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      void handleContinue()
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden select-none">
      {/* Setup Step Indicator / Subheader Bar */}
      <nav aria-label="Setup Progress" className="h-10 px-8 flex items-center justify-between border-b border-slate-800/50 bg-[#0E1320]/60 text-xs shrink-0">
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="font-medium text-slate-300">Step 5 of 6</span>
          <span className="text-slate-600">·</span>
          <span className="text-sky-400 font-medium">Personalize</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-emerald-500" />
          <span className="w-7 h-1 rounded-full bg-sky-500" />
          <span className="w-7 h-1 rounded-full bg-slate-800" />
        </div>
      </nav>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col justify-between px-10 py-6 relative z-10 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full flex flex-col items-center text-center my-auto">
          {/* User Icon Badge */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-full bg-sky-500/20 blur-2xl" />
            <div className="relative w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            What should Calby call you?
          </h1>
          <p className="text-sm text-slate-400 max-w-md">
            Enter your name so Calby can greet you personally. You can change or remove this anytime in settings.
          </p>

          {/* Name Input */}
          <div className="w-full mt-6 text-left">
            <label htmlFor="user-name-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              id="user-name-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Rajesh"
              className="w-full px-4 py-3 bg-[#121826] border border-slate-700/70 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Reassuring Privacy Badge */}
          <div className="w-full mt-6 p-4 rounded-xl bg-[#121826]/80 border border-slate-800 text-left space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>No Account or Login Required</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calby does not collect your personal information or ask you to log in. All your data, preferences, and memories stay completely local and secure on your own system.
            </p>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <footer className="w-full pt-4 pb-2 border-t border-slate-800/60 flex items-center justify-between shrink-0">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/40 cursor-pointer"
            type="button"
          >
            Back
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all duration-150 ease-in-out shadow-glow-button focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              type="button"
            >
              <span>{userName.trim() ? 'Continue' : 'Skip & Continue'}</span>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
