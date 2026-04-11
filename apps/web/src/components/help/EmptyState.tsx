import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-16',
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 mb-5">
        <Icon className="h-8 w-8 text-brand-400" />
      </div>

      <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>

      <p className="text-sm text-slate-500 max-w-[320px] leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
