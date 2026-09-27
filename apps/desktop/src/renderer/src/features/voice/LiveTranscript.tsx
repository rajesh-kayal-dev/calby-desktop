import type { FC } from 'react'

interface LiveTranscriptProps {
  userTranscript?: string
  assistantTranscript?: string
  isListening?: boolean
}

export const LiveTranscript: FC<LiveTranscriptProps> = ({
  userTranscript,
  assistantTranscript,
  isListening = false
}) => {
  // Guard against empty/whitespace-only transcripts (e.g. failed transcription)
  // so we never render an empty quote bubble.
  const heardText = userTranscript?.trim() || ''
  const spokenText = assistantTranscript?.trim() || ''

  if (!heardText && !spokenText && !isListening) {
    return null
  }

  return (
    <div className="relative z-10 max-w-lg w-full px-4 space-y-3" data-purpose="speech-transcription-container">
      {/* What Calby heard — user input bubble */}
      {heardText && (
        <div className="ml-auto max-w-[85%] text-right space-y-1">
          <p
            className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500"
            data-purpose="what-calby-heard-label"
          >
            What Calby heard
          </p>
          <div className="bg-[#101726]/70 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-end text-right">
            <p className="text-slate-300 text-xs font-normal leading-relaxed">
              <span className="text-slate-500">You: </span>
              &ldquo;{heardText}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Make the live-input state explicit before Gemini emits its first
          interim transcription; the user can immediately see that speech is
          being captured, and the same bubble updates with recognized words. */}
      {isListening && !heardText && (
        <div className="ml-auto max-w-[85%] text-right space-y-1" data-purpose="live-input-pending">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
            What Calby heard
          </p>
          <div className="bg-[#101726]/70 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 text-right">
            <p className="text-slate-400 text-xs font-normal leading-relaxed">Listening for your words…</p>
          </div>
        </div>
      )}

      {/* Assistant Vocal Response Card */}
      {spokenText && (
        <div className="bg-[#0c121c]/85 backdrop-blur-md border border-[#1d2738] rounded-2xl px-5 py-3.5 flex items-center space-x-3.5 shadow-xl shadow-black/40">
          <div className="flex items-center space-x-[2.5px] text-cyan-400 shrink-0">
            <span className="w-[2.5px] h-2.5 bg-cyan-400 rounded-full" />
            <span className="w-[2.5px] h-4 bg-cyan-400 rounded-full" />
            <span className="w-[2.5px] h-2 bg-cyan-400 rounded-full" />
          </div>
          <p className="text-white text-sm font-normal tracking-wide leading-relaxed">
            &ldquo;{spokenText}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
