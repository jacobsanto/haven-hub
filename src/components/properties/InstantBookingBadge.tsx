import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstantBookingBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function InstantBookingBadge({
  className,
  size = 'md',
  showLabel = true,
}: InstantBookingBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium',
        sizeClasses[size],
        className
      )}
    >
      <Zap className={cn('fill-current', iconSizes[size])} />
      {showLabel && <span>Instant Book</span>}
    </div>
  );
}
