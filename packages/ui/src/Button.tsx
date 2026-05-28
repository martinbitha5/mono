import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
}

// Stripe-calibrated variants for light background
const variants: Record<Variant, string> = {
  // Stripe violet solid — same as stripe.com "Commencer" button
  primary:
    'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white ' +
    'shadow-btn border border-blue-600/20',
  // Stripe bordered secondary
  secondary:
    'bg-white hover:bg-zinc-950 active:bg-zinc-800 text-zinc-200 ' +
    'border border-zinc-700 shadow-card',
  // Danger
  danger:
    'bg-red-50 hover:bg-red-100 text-red-600 ' +
    'border border-red-200',
  // Ghost — no border, no bg
  ghost:
    'hover:bg-zinc-950 active:bg-zinc-800 text-zinc-400 hover:text-zinc-200',
};

const sizes: Record<Size, string> = {
  sm: 'px-3   py-1.5 text-[12px] gap-1.5 rounded-md',
  md: 'px-4   py-2   text-[13px] gap-2   rounded-lg',
  lg: 'px-5   py-2.5 text-[13px] gap-2   rounded-lg',
};

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150 select-none whitespace-nowrap',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-blue-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
