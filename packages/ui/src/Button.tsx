import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
}

// Variantes thème clair — l'accent vient de --accent défini par chaque app
const variants: Record<Variant, string> = {
  // Bouton plein couleur accent (orange tech / bleu it)
  primary:
    'bg-[var(--accent,#3B82F6)] hover:bg-[var(--accent-hover,#2563EB)] text-white ' +
    'border border-transparent shadow-sm',
  // Stripe bordered secondary
  secondary:
    'bg-white hover:bg-[#F4F5FA] active:bg-[#EEF0F7] text-zinc-800 ' +
    'border border-[#D8DBE8] shadow-card',
  // Danger
  danger:
    'bg-red-50 hover:bg-red-100 text-red-600 ' +
    'border border-red-200',
  // Ghost — no border, no bg
  ghost:
    'hover:bg-[#F4F5FA] active:bg-[#EEF0F7] text-zinc-500 hover:text-zinc-800',
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
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
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
