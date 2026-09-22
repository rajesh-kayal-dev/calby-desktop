'use client';

interface WaveformProps {
  active?: boolean;
  barCount?: number;
  className?: string;
}

export function Waveform({ active = true, barCount = 7, className = '' }: WaveformProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className={`flex items-center justify-center gap-1.5 h-8 ${className}`} id="waveform-visualizer">
      {bars.map((index) => {
        const delays = [0, 0.15, 0.3, 0.45, 0.6, 0.25, 0.4];
        const delay = delays[index % delays.length];

        return (
          <span
            key={index}
            className={`w-1 rounded-full transition-all duration-300 ${
              active
                ? 'bg-[#38BDF8] wave-bar-anim shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                : 'bg-[#38BDF8]/30 h-1.5'
            }`}
            style={{
              animationDelay: `${delay}s`,
              animationDuration: active ? '1.2s' : '0s',
            }}
          />
        );
      })}
    </div>
  );
}
