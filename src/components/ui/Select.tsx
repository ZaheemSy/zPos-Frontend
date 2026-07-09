import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export default function Select({ label, className, id, children, ...props }: SelectProps) {
  const selectEl = (
    <select
      id={id}
      className={clsx(
        'w-full rounded-lg border border-surface-400 bg-surface-100 px-3 py-2 text-sm text-zinc-100',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );

  if (!label) return selectEl;

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      {selectEl}
    </label>
  );
}
