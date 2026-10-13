import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className ?? 'size-5')} aria-hidden />;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <Spinner className="size-6 text-indigo-600" />
      <span>{label}</span>
    </div>
  );
}
