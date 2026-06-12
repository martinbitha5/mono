import type { HTMLAttributes } from 'react';

type Color = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'orange';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: Color;
  dot?:   boolean;
}

// Stripe-calibrated badge palette — for light backgrounds
const colors: Record<Color, string> = {
  green:  'bg-emerald-50   text-emerald-700 ring-1 ring-emerald-200',
  red:    'bg-red-50       text-red-600     ring-1 ring-red-200',
  yellow: 'bg-amber-50     text-amber-700   ring-1 ring-amber-200',
  blue:   'bg-blue-50      text-blue-600    ring-1 ring-blue-200',
  purple: 'bg-purple-50    text-purple-700  ring-1 ring-purple-200',
  gray:   'bg-[#F4F5FA]     text-zinc-500    ring-1 ring-[#E6E8F0]',
  orange: 'bg-orange-50    text-orange-700  ring-1 ring-orange-200',
};

const dotColors: Record<Color, string> = {
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  yellow: 'bg-amber-500',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
  gray:   'bg-zinc-600',
  orange: 'bg-orange-500',
};

export function Badge({
  color     = 'gray',
  dot       = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5',
        'rounded-md text-[11px] font-semibold tracking-wide',
        colors[color],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[color]].join(' ')} />
      )}
      {children}
    </span>
  );
}
