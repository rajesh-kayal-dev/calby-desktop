import type { FC } from 'react'

interface LiveTranscriptProps {
  userTranscript?: string
  assistantTranscript?: string
}

export const LiveTranscript: FC<LiveTranscriptProps> = ({
  userTranscript,
  assistantTranscript
}) => {
  if (!userTranscript && !assistantTranscript) {
    return null
  }

  return (
    <div className="relative z-10 max-w-lg w-full px-4 space-y-3" data-purpose="speech-transcription-container">
      {/* User Input Bubble */}
      {userTranscript && (
        <div className="bg-[#101726]/70 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-end ml-auto max-w-[85%] text-right">
          <p className="text-slate-300 text-xs font-normal leading-relaxed">
            {userTranscript}
          </p>
        </div>
      )}

      {/* Assistant Vocal Response Card */}
      {assistantTranscript && (
        <div className="bg-[#0c121c]/85 backdrop-blur-md border border-[#1d2738] rounded-2xl px-5 py-3.5 flex items-center space-x-3.5 shadow-xl shadow-black/40">
          <div className="flex items-center space-x-[2.5px] text-cyan-400 shrink-0">
            <span className="w-[2.5px] h-2.5 bg-cyan-400 rounded-full" />
            <span className="w-[2.5px] h-4 bg-cyan-400 rounded-full" />
            <span className="w-[2.5px] h-2 bg-cyan-400 rounded-full" />
          </div>
          <p className="text-white text-sm font-normal tracking-wide leading-relaxed">
            “{assistantTranscript}”
          </p>
        </div>
      )}
    </div>
  )
}
