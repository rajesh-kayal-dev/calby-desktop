'use client';

interface OrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  pulsing?: boolean;
  pulse?: boolean;
}

export function Orb({ size = 'md', className = '', pulsing = true, pulse }: OrbProps) {
  const isPulsing = pulse !== undefined ? pulse : pulsing;
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const dotMap = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  return (
    <div
      className={`relative rounded-full bg-gradient-to-tr from-[#38BDF8] via-[#0284C7] to-[#2563EB] flex items-center justify-center shrink-0 ${
        isPulsing ? 'calby-orb-animated' : ''
      } ${sizeMap[size]} ${className}`}
      id="calby-orb"
    >
      <div className={`rounded-full bg-white/95 shadow-sm ${dotMap[size]}`} />
    </div>
  );
}
