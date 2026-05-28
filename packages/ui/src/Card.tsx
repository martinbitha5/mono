import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        'bg-zinc-900 border border-white/[0.06] rounded-xl',
        paddings[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={['flex items-center justify-between mb-5', className].join(' ')}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}
