import type { ReactNode } from 'react';

type Color = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

interface StatCardProps {
  label:   string;
  value:   string | number;
  icon:    ReactNode;
  color?:  Color;
  sub?:    string;
  trend?:  { value: string; up: boolean };
}

const colorMap: Record<Color, { icon: string; value: string }> = {
  blue:   { icon: 'text-blue-600',   value: 'text-zinc-900'  },
  green:  { icon: 'text-emerald-600',value: 'text-zinc-900'  },
  red:    { icon: 'text-red-600',    value: 'text-zinc-900'  },
  yellow: { icon: 'text-amber-600',  value: 'text-zinc-900'  },
  purple: { icon: 'text-purple-600', value: 'text-zinc-900'  },
};

export function StatCard({ label, value, icon, color = 'blue', sub, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    /* zinc-900 = white, border zinc-800 = #E3EBF6, shadow-card = Stripe shadow */
    <div className="bg-white border border-[#E6E8F0] rounded-xl px-5 py-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.07em] mb-3">
            {label}
          </p>
          <p className={['text-[28px] font-bold leading-none tabular-nums', c.value].join(' ')}>
            {value}
          </p>
          {sub && <p className="text-[12px] text-zinc-500 mt-2">{sub}</p>}
          {trend && (
            <p className={['text-[12px] font-semibold mt-2', trend.up ? 'text-emerald-500' : 'text-red-500'].join(' ')}>
              {trend.up ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        <span className={['flex-shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]', c.icon].join(' ')}>
          {icon}
        </span>
      </div>
    </div>
  );
}
