export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1 py-6 text-sm text-zinc-500">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-surface-400 border-t-brand-500" />
      {label}
    </div>
  );
}
