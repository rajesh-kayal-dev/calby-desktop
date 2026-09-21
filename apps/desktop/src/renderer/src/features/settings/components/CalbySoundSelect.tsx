import { useState, useRef, useEffect, type FC, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import type { CalbySound } from '../sound-catalog'
import { CalbySoundPlayer } from '../../../services/sound-player.service'

interface CalbySoundSelectProps {
  label: string
  sounds: CalbySound[]
  selectedSoundName: string
  onSelectSound: (soundName: string) => void
  testIdPrefix?: string
}

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="5" width="14" height="14" rx="1.5" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const CalbySoundSelect: FC<CalbySoundSelectProps> = ({
  sounds,
  selectedSoundName,
  onSelectSound,
  testIdPrefix = 'sound'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedSound = sounds.find(
    (s) => s.displayName.toLowerCase() === selectedSoundName.toLowerCase() || s.id.toLowerCase() === selectedSoundName.toLowerCase()
  ) || sounds[0]

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        CalbySoundPlayer.getInstance().stopAll()
        setPreviewingId(null)
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      CalbySoundPlayer.getInstance().stopAll()
    }
  }, [])

  // Check playing sound state
  useEffect(() => {
    const interval = setInterval(() => {
      const activeId = CalbySoundPlayer.getInstance().getCurrentPlayingId()
      setPreviewingId(activeId)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev)
    if (!isOpen) {
      const idx = sounds.findIndex((s) => s.id === selectedSound.id)
      setFocusedIndex(idx >= 0 ? idx : 0)
    }
  }

  const handlePreview = async (e: ReactMouseEvent, sound: CalbySound) => {
    e.stopPropagation()
    const player = CalbySoundPlayer.getInstance()

    if (previewingId === sound.id) {
      player.stopAll()
      setPreviewingId(null)
      return
    }

    setPreviewingId(sound.id)
    try {
      await player.playPreview(sound)
    } catch {
      setPreviewingId(null)
    }
  }

  const handleSelectOption = (sound: CalbySound) => {
    CalbySoundPlayer.getInstance().stopAll()
    setPreviewingId(null)
    onSelectSound(sound.displayName)
    setIsOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
        setFocusedIndex(0)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev + 1) % sounds.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((prev) => (prev - 1 + sounds.length) % sounds.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focusedIndex >= 0 && focusedIndex < sounds.length) {
        handleSelectOption(sounds[focusedIndex])
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative flex items-center gap-2 select-none ${isOpen ? 'z-50' : 'z-10'}`}
    >
      {/* ── Trigger Selector Button ── */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        data-testid={`${testIdPrefix}-select`}
        onClick={handleToggleOpen}
        className="inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs bg-[#1E293B] border border-white/10 hover:border-white/20 focus:outline-none focus:border-[#38BDF8] transition-colors cursor-pointer text-white font-medium min-w-[140px]"
      >
        <span className="truncate">{selectedSound.displayName}</span>
        <span className="text-slate-400 shrink-0">
          <ChevronDownIcon />
        </span>
      </button>

      {/* ── Outside Preview Button ── */}
      <button
        type="button"
        data-testid={`preview-${testIdPrefix}-sound-button`}
        onClick={(e) => void handlePreview(e, selectedSound)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#38BDF8] transition-colors cursor-pointer"
        aria-label={`Preview ${selectedSound.displayName}`}
      >
        <span className="text-[#38BDF8]">
          {previewingId === selectedSound.id ? <StopIcon /> : <PlayIcon />}
        </span>
        <span>{previewingId === selectedSound.id ? 'Stop' : 'Preview'}</span>
      </button>

      {/* ── Custom Dark Options Popover Menu ── */}
      {isOpen && (
        <div
          role="listbox"
          data-testid={`${testIdPrefix}-popover-menu`}
          className="absolute top-full right-0 mt-1.5 w-64 max-h-56 overflow-y-auto z-50 py-1.5 rounded-xl bg-[#0F172A] border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {sounds.map((sound, idx) => {
            const isSelected = sound.id === selectedSound.id
            const isPreviewing = previewingId === sound.id
            const isFocused = idx === focusedIndex

            return (
              <div
                key={sound.id}
                ref={(el) => {
                  if (isFocused && el) {
                    el.scrollIntoView({ block: 'nearest' })
                  }
                }}
                role="option"
                aria-selected={isSelected}
                data-testid={`${testIdPrefix}-option-${sound.id}`}
                onClick={() => handleSelectOption(sound)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={[
                  'flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer mx-1 rounded-lg',
                  isSelected
                    ? 'bg-[#2563EB]/20 text-white font-medium'
                    : isFocused
                    ? 'bg-white/10 text-slate-100'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                {/* Left: Play/Stop Control button for Previewing */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    aria-label={isPreviewing ? `Stop previewing ${sound.displayName}` : `Preview ${sound.displayName}`}
                    onClick={(e) => void handlePreview(e, sound)}
                    className={[
                      'p-1.5 rounded-md transition-colors shrink-0 cursor-pointer',
                      isPreviewing
                        ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/15 hover:text-white',
                    ].join(' ')}
                  >
                    {isPreviewing ? <StopIcon /> : <PlayIcon />}
                  </button>
                  <span className="truncate">{sound.displayName}</span>
                </div>

                {/* Right: Selected Checkmark Indicator */}
                {isSelected && (
                  <span className="text-[#38BDF8] shrink-0 ml-2">
                    <CheckIcon />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
