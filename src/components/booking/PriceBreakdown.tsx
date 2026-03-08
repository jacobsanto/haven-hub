import { PriceBreakdown as PriceBreakdownType } from '@/types/booking-engine';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Check, Tag, Info } from 'lucide-react';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  showDeposit?: boolean;
  compact?: boolean;
  className?: string;
}

export function PriceBreakdownDisplay({
  breakdown,
  showDeposit = false,
  compact = false,
  className,
}: PriceBreakdownProps) {
  const { formatPrice: formatCurrency, selectedCurrency } = useCurrency();
  
  // Helper to format amount using currency context
  const formatAmount = (amount: number) => formatCurrency(amount).display;
  const totalFormatted = formatCurrency(breakdown.total);

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex justify-between text-sm">
          <span>{breakdown.nights} night{breakdown.nights > 1 ? 's' : ''}</span>
          <span>{formatAmount(breakdown.accommodationTotal)}</span>
        </div>
        {breakdown.addonsTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span>Add-ons</span>
            <span>{formatAmount(breakdown.addonsTotal)}</span>
          </div>
        )}
        {breakdown.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-accent">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Discount
            </span>
            <span>-{formatAmount(breakdown.discountAmount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{totalFormatted.display}</span>
        </div>
        {totalFormatted.isConverted && (
          <div className="text-xs text-muted-foreground text-right">
            {totalFormatted.original} · You pay in EUR
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-xl border p-6', className)}>
      <h3 className="font-serif text-lg font-medium mb-4">Price Details</h3>
      
      <div className="space-y-3">
        {/* Accommodation */}
        {breakdown.lineItems
          .filter(item => item.type === 'accommodation')
          .map((item, i) => (
            <div key={`acc-${i}`} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span>{formatAmount(item.amount)}</span>
            </div>
          ))}

        {/* Add-ons */}
        {breakdown.lineItems.some(item => item.type === 'addon') && (
          <>
            <Separator className="my-3" />
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Add-ons
            </div>
            {breakdown.lineItems
              .filter(item => item.type === 'addon')
              .map((item, i) => (
                <div key={`addon-${i}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Check className="h-3 w-3 text-accent" />
                    {item.label}
                  </span>
                  <span>{formatAmount(item.amount)}</span>
                </div>
              ))}
          </>
        )}

        {/* Fees */}
        {breakdown.lineItems.some(item => item.type === 'fee') && (
          <>
            <Separator className="my-3" />
            {breakdown.lineItems
              .filter(item => item.type === 'fee')
              .map((item, i) => (
                <div key={`fee-${i}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>{formatAmount(item.amount)}</span>
                </div>
              ))}
          </>
        )}

        {/* Discount */}
        {breakdown.discountAmount > 0 && (
          <>
            <Separator className="my-3" />
            {breakdown.lineItems
              .filter(item => item.type === 'discount')
              .map((item, i) => (
                <div key={`disc-${i}`} className="flex justify-between text-sm">
                  <span className="text-accent flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {item.label}
                    {item.details && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {item.details}
                      </Badge>
                    )}
                  </span>
                  <span className="text-green-600">{formatAmount(item.amount)}</span>
                </div>
              ))}
          </>
        )}

        {/* Taxes */}
        {breakdown.lineItems.some(item => item.type === 'tax') && (
          <>
            <Separator className="my-3" />
            {breakdown.lineItems
              .filter(item => item.type === 'tax')
              .map((item, i) => (
                <div key={`tax-${i}`} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>{formatAmount(item.amount)}</span>
                </div>
              ))}
          </>
        )}

        {/* Total */}
        <Separator className="my-3" />
        <div className="flex justify-between items-center">
          <span className="font-serif text-lg font-medium">Total</span>
          <span className="font-serif text-2xl font-semibold">{totalFormatted.display}</span>
        </div>
        {totalFormatted.isConverted && (
          <div className="text-sm text-muted-foreground text-right">
            {totalFormatted.original} · You pay in EUR
          </div>
        )}

        {/* Deposit info */}
        {showDeposit && breakdown.depositAmount && breakdown.balanceAmount && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-primary" />
              Payment Options
            </div>
            <div className="flex justify-between text-sm">
              <span>Pay deposit now</span>
              <span className="font-medium">{formatAmount(breakdown.depositAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Balance due before arrival</span>
              <span>{formatAmount(breakdown.balanceAmount)}</span>
            </div>
          </div>
        )}

        {/* Direct booking savings */}
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span className="font-medium">You're saving up to 15% by booking direct!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
