import { useState, useEffect, type FC, type FormEvent } from 'react'
import type { PersonalizeSettings } from '../types'

interface PersonalizeSettingsProps {
  personalize?: PersonalizeSettings
  onSave: (data: Partial<PersonalizeSettings>) => Promise<boolean>
}

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly & natural' },
  { value: 'professional', label: 'Professional & concise' },
  { value: 'minimal', label: 'Direct & minimal' },
  { value: 'casual', label: 'Warm & casual' }
]

const DEFAULT_BEHAVIOR_INSTRUCTION =
  'You are Calby, a calm, focused, personal desktop voice assistant. Keep answers concise, clear, and direct. Help the user remember, understand, and act across reminders, personal memory, and Google Calendar.'

export const PersonalizeSettingsComponent: FC<PersonalizeSettingsProps> = ({ personalize, onSave }) => {
  const [name, setName] = useState(personalize?.userName || '')
  const [tone, setTone] = useState(personalize?.userTone || 'friendly')
  const [about, setAbout] = useState(personalize?.userAbout || '')
  const [instructions, setInstructions] = useState(personalize?.userInstructions ?? DEFAULT_BEHAVIOR_INSTRUCTION)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (personalize) {
      setName(personalize.userName || '')
      setTone(personalize.userTone || 'friendly')
      setAbout(personalize.userAbout || '')
      setInstructions(personalize.userInstructions ?? DEFAULT_BEHAVIOR_INSTRUCTION)
    }
  }, [personalize])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSavedSuccess(false)
    const success = await onSave({
      userName: name.trim(),
      userTone: tone,
      userAbout: about.trim(),
      userInstructions: instructions.trim()
    })
    setIsSaving(false)
    if (success) {
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }
  }

  return (
    <div data-testid="personalize-settings" className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="user-name-input" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-text-primary)' }}>
            What should Calby call you?
          </label>
          <input
            id="user-name-input"
            type="text"
            data-testid="personalize-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors"
            style={{ color: 'var(--ds-text-primary)' }}
          />
        </div>

        <div>
          <label htmlFor="user-tone-select" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-text-primary)' }}>
            How should Calby talk to you?
          </label>
          <select
            id="user-tone-select"
            data-testid="personalize-tone-select"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#1E293B] border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors cursor-pointer"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="user-about-input" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-text-primary)' }}>
            About you
          </label>
          <input
            id="user-about-input"
            type="text"
            data-testid="personalize-about-input"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Share something you'd like Calby to know"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors"
            style={{ color: 'var(--ds-text-primary)' }}
          />
        </div>

        <div>
          <label htmlFor="user-instructions-input" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-text-primary)' }}>
            How should Calby behave?
          </label>
          <textarea
            id="user-instructions-input"
            data-testid="personalize-instructions-input"
            rows={4}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Tell Calby how you'd like it to respond..."
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors resize-none leading-relaxed"
            style={{ color: 'var(--ds-text-primary)' }}
          />
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
          These preferences are stored locally on this device and used to personalize Calby&apos;s responses.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            data-testid="save-personalize-button"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
          {savedSuccess && (
            <span data-testid="personalize-saved-badge" className="text-xs text-[#10B981] font-medium flex items-center gap-1">
              ✓ Saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
