import type { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  trailing?: ReactNode;
}

export default function Input({ label, hint, trailing, className, id, ...props }: InputProps) {
  const inputEl = (
    <input
      id={id}
      className={clsx(
        'w-full rounded-lg border border-surface-400 bg-surface-100 px-3 py-2 text-sm text-zinc-100',
        'placeholder:text-zinc-500',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
        'disabled:opacity-50',
        trailing && 'pr-9',
        className,
      )}
      {...props}
    />
  );

  if (!label) {
    return trailing ? (
      <div className="relative">
        {inputEl}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
      </div>
    ) : (
      inputEl
    );
  }

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      <div className="relative">
        {inputEl}
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
