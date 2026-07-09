import type { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClasses: Record<Tone, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 ring-red-500/30',
  info: 'bg-brand-500/15 text-brand-300 ring-brand-500/30',
  neutral: 'bg-surface-300 text-zinc-300 ring-surface-400',
};

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
