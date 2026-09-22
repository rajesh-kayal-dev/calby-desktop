import React, { useId } from 'react';

interface CalbyLogoProps {
  className?: string;
  size?: number;
  variant?: 'glyph' | 'app-icon';
}

export function CalbyLogo({ className = 'w-6 h-6', size, variant = 'glyph' }: CalbyLogoProps) {
  const id = useId().replace(/:/g, '');

  const style = size ? { width: size, height: size } : undefined;

  if (variant === 'app-icon') {
    return (
      <svg
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
        aria-label="Calby App Icon"
      >
        <defs>
          <radialGradient id={`appBgGrad-${id}`} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#131B29" />
            <stop offset="60%" stopColor="#0A0F17" />
            <stop offset="100%" stopColor="#06080E" />
          </radialGradient>
          <linearGradient id={`bezelBorder-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id={`topArm-${id}`} x1="20%" y1="60%" x2="90%" y2="15%">
            <stop offset="0%" stopColor="#0055FF" />
            <stop offset="35%" stopColor="#0088FF" />
            <stop offset="75%" stopColor="#00D2FF" />
            <stop offset="100%" stopColor="#38E8FF" />
          </linearGradient>
          <linearGradient id={`innerLoop-${id}`} x1="20%" y1="35%" x2="50%" y2="70%">
            <stop offset="0%" stopColor="#00C8FF" />
            <stop offset="50%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0072FF" />
          </linearGradient>
          <linearGradient id={`bottomArm-${id}`} x1="40%" y1="55%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#0052FF" />
            <stop offset="60%" stopColor="#0047E0" />
            <stop offset="100%" stopColor="#0033C7" />
          </linearGradient>
          <filter id={`ribbonShadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="20" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Outer squircle frame */}
        <rect
          x="40"
          y="40"
          width="920"
          height="920"
          rx="210"
          ry="210"
          fill={`url(#appBgGrad-${id})`}
          stroke={`url(#bezelBorder-${id})`}
          strokeWidth="22"
        />

        {/* Inner rim line */}
        <rect
          x="54"
          y="54"
          width="892"
          height="892"
          rx="198"
          ry="198"
          fill="none"
          stroke="#334155"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Centered Ribbon 'C' */}
        <g transform="translate(142, 142) scale(0.716)" filter={`url(#ribbonShadow-${id})`}>
          <path
            d="M 425 515 L 425 580 L 755 775 C 788 794 800 818 780 848 C 760 878 720 885 660 885 C 540 885 410 830 310 755 C 230 695 195 625 205 540 C 210 500 225 460 250 420 L 425 515 Z"
            fill={`url(#bottomArm-${id})`}
          />
          <path
            d="M 205 385 C 190 450 195 530 225 600 C 255 670 315 725 390 770 C 435 795 480 815 530 830 C 460 760 425 675 425 580 L 425 515 L 205 385 Z"
            fill={`url(#innerLoop-${id})`}
            opacity="0.9"
          />
          <path
            d="M 205 385 C 205 355 225 320 260 295 L 570 145 C 610 125 650 130 685 155 L 795 235 C 825 258 820 290 785 315 L 425 515 L 205 385 Z"
            fill={`url(#topArm-${id})`}
          />
        </g>
      </svg>
    );
  }

  // Standalone ribbon glyph variant (calbe_logo.png)
  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Calby Logo"
    >
      <defs>
        <linearGradient id={`topArmG-${id}`} x1="20%" y1="60%" x2="90%" y2="15%">
          <stop offset="0%" stopColor="#0055FF" />
          <stop offset="35%" stopColor="#0088FF" />
          <stop offset="75%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#38E8FF" />
        </linearGradient>
        <linearGradient id={`innerLoopG-${id}`} x1="20%" y1="35%" x2="50%" y2="70%">
          <stop offset="0%" stopColor="#00C8FF" />
          <stop offset="50%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0072FF" />
        </linearGradient>
        <linearGradient id={`bottomArmG-${id}`} x1="40%" y1="55%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#0052FF" />
          <stop offset="60%" stopColor="#0047E0" />
          <stop offset="100%" stopColor="#0033C7" />
        </linearGradient>
        <linearGradient id={`creaseG-${id}`} x1="35%" y1="50%" x2="45%" y2="55%">
          <stop offset="0%" stopColor="#0033B3" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0033B3" stopOpacity="0" />
        </linearGradient>
        <filter id={`glyphGlow-${id}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0066FF" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter={`url(#glyphGlow-${id})`}>
        {/* 1. Bottom Arm Fold */}
        <path
          d="M 425 515 L 425 580 L 755 775 C 788 794 800 818 780 848 C 760 878 720 885 660 885 C 540 885 410 830 310 755 C 230 695 195 625 205 540 C 210 500 225 460 250 420 L 425 515 Z"
          fill={`url(#bottomArmG-${id})`}
        />

        {/* 2. Translucent Inner Cyan Loop */}
        <path
          d="M 205 385 C 190 450 195 530 225 600 C 255 670 315 725 390 770 C 435 795 480 815 530 830 C 460 760 425 675 425 580 L 425 515 L 205 385 Z"
          fill={`url(#innerLoopG-${id})`}
          opacity="0.9"
        />

        {/* 3. Crease shadow */}
        <path
          d="M 425 515 L 425 580 L 360 620 C 390 580 415 545 425 515 Z"
          fill={`url(#creaseG-${id})`}
        />

        {/* 4. Top Arm */}
        <path
          d="M 205 385 C 205 355 225 320 260 295 L 570 145 C 610 125 650 130 685 155 L 795 235 C 825 258 820 290 785 315 L 425 515 L 205 385 Z"
          fill={`url(#topArmG-${id})`}
        />
      </g>
    </svg>
  );
}
