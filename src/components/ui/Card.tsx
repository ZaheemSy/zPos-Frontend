import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-lg shadow-black/20', className)}
      {...props}
    />
  );
}
