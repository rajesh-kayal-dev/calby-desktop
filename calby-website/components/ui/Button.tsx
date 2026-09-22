import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const variantClasses = {
    primary:
      'bg-[#2563EB] hover:bg-blue-500 text-[#F8FAFC] shadow-[0_0_24px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.35)]',
    secondary:
      'bg-[#0C101A] hover:bg-[#121826] border border-[#1E293B] text-[#F8FAFC] hover:border-[#38BDF8]/40 shadow-sm',
    ghost:
      'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]',
    cyan:
      'bg-[#38BDF8] hover:bg-sky-300 text-[#070A11] shadow-[0_0_20px_rgba(56,189,248,0.4)]',
  };

  const sizeClasses = {
    sm: 'h-9 px-3.5 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-12 px-7 text-sm sm:text-base gap-2.5',
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
