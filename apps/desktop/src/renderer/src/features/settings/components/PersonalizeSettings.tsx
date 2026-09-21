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

export const DEFAULT_CALBY_INSTRUCTION = `You are Calby, a personal desktop voice assistant.

Your job is to help the user stay organized, remember important things, understand their schedule, and take useful actions when asked.

Speak naturally, warmly, and clearly, like a helpful human assistant.

Keep responses concise for simple requests and provide more detail only when it is useful or requested.

Do not sound robotic, overly formal, or like customer support.

Avoid unnecessary phrases such as:
'Certainly.'
'Of course.'
'I would be happy to assist you.'

Prefer natural responses such as:
'Done.'
'Got it.'
'I'll remind you at 6.'
'You have a meeting at 10.'

Use the user's preferred name and personal information when relevant.

Respect the user's instructions and preferences.

Only remember information when the user explicitly asks you to remember it.

Use reminders, memory, and calendar capabilities when they are relevant to the user's request.

Do not claim that an action was completed unless the corresponding action actually succeeded.

When an action fails, explain the problem simply and suggest the next useful step.

Do not perform unrelated actions without the user's request.

Keep spoken responses easy to understand and natural for voice conversation.`

export const PersonalizeSettingsComponent: FC<PersonalizeSettingsProps> = ({ personalize, onSave }) => {
  const [name, setName] = useState(personalize?.userName || '')
  const [tone, setTone] = useState(personalize?.userTone || 'friendly')
  const [about, setAbout] = useState(personalize?.userAbout || '')
  const [instructions, setInstructions] = useState(
    personalize?.userInstructions?.trim() ? personalize.userInstructions : DEFAULT_CALBY_INSTRUCTION
  )
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (personalize) {
      setName(personalize.userName || '')
      setTone(personalize.userTone || 'friendly')
      setAbout(personalize.userAbout || '')
      setInstructions(
        personalize.userInstructions?.trim() ? personalize.userInstructions : DEFAULT_CALBY_INSTRUCTION
      )
    }
  }, [personalize])

  const isCustomized = instructions.trim() !== DEFAULT_CALBY_INSTRUCTION.trim()

  const handleResetToDefault = () => {
    setInstructions(DEFAULT_CALBY_INSTRUCTION)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSavedSuccess(false)
    const success = await onSave({
      userName: name.trim(),
      userTone: tone,
      userAbout: about.trim(),
      userInstructions: instructions.trim() || DEFAULT_CALBY_INSTRUCTION
    })
    setIsSaving(false)
    if (success) {
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }
  }

  return (
    <div data-testid="personalize-settings" className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-name-input"
            className="block text-sm font-medium"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            What should Calby call you?
          </label>
          <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
            Choose the name you&apos;d like Calby to use.
          </p>
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

        {/* Tone */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-tone-select"
            className="block text-sm font-medium"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            How should Calby talk to you?
          </label>
          <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
            Choose the tone that feels natural to you.
          </p>
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

        {/* About */}
        <div className="space-y-1.5">
          <label
            htmlFor="user-about-input"
            className="block text-sm font-medium"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            About you
          </label>
          <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
            Share a little about yourself so Calby can give more relevant answers.
          </p>
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

        {/* Behavior */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="user-instructions-input"
              className="block text-sm font-medium"
              style={{ color: 'var(--ds-text-primary)' }}
            >
              How should Calby behave?
            </label>
            <div className="flex items-center gap-3">
              <span
                data-testid="behavior-status-badge"
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                  isCustomized
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'bg-white/5 text-zinc-400 border border-white/10'
                }`}
              >
                {isCustomized ? 'Customized behavior' : 'Default behavior'}
              </span>
              {isCustomized && (
                <button
                  type="button"
                  data-testid="reset-behavior-button"
                  onClick={handleResetToDefault}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium cursor-pointer"
                >
                  Reset to Calby&apos;s default
                </button>
              )}
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
            Calby already has a default personality. Customize it to make Calby work the way you prefer.
          </p>
          <textarea
            id="user-instructions-input"
            data-testid="personalize-instructions-input"
            rows={12}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Tell Calby how you'd like it to respond..."
            className="w-full px-3.5 py-3 rounded-lg text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors resize-y leading-relaxed font-normal"
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
            <span
              data-testid="personalize-saved-badge"
              className="text-xs text-[#10B981] font-medium flex items-center gap-1"
            >
              ✓ Changes saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
