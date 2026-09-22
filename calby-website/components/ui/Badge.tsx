import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'blue' | 'neutral' | 'success';
}

export function Badge({
  className,
  variant = 'cyan',
  children,
  ...props
}: BadgeProps) {
  const variantClasses = {
    cyan: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
    blue: 'bg-[#2563EB]/15 text-[#38BDF8] border-[#2563EB]/40',
    neutral: 'bg-[#121826] text-[#94A3B8] border-[#1E293B]',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide uppercase select-none',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
