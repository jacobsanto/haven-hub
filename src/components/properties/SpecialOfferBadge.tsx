import { Percent, Clock } from 'lucide-react';
import { SpecialOffer } from '@/types/database';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface SpecialOfferBadgeProps {
  offer: SpecialOffer;
  variant?: 'badge' | 'card' | 'inline';
  className?: string;
}

export function SpecialOfferBadge({
  offer,
  variant = 'badge',
  className,
}: SpecialOfferBadgeProps) {
  const daysRemaining = differenceInDays(parseISO(offer.valid_until), new Date());
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400',
          className
        )}
      >
        <Percent className="h-3 w-3" />
        {offer.discount_percent}% off
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium',
          className
        )}
      >
        <Percent className="h-4 w-4" />
        <span>{offer.discount_percent}% off</span>
        {isExpiringSoon && (
          <span className="text-xs opacity-75">
            · {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
          </span>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div
      className={cn(
        'card-organic p-4 border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
          <Percent className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-green-700 dark:text-green-400">
              {offer.title}
            </h4>
            <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">
              {offer.discount_percent}% OFF
            </span>
          </div>
          {offer.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {offer.description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Valid until {format(parseISO(offer.valid_until), 'MMM d, yyyy')}
            </span>
            {isExpiringSoon && (
              <span className="text-orange-500 font-medium">
                · Only {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
