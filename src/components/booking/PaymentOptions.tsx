import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Loader2, AlertCircle, Clock, Shield } from 'lucide-react';
import { PaymentType, PriceBreakdown } from '@/types/booking-engine';
import { cn } from '@/lib/utils';

interface PaymentOptionsProps {
  breakdown: PriceBreakdown;
  depositPercentage?: number;
  selectedPaymentType: PaymentType;
  onPaymentTypeChange: (type: PaymentType) => void;
  onProceedToPayment: () => void;
  isProcessing?: boolean;
  holdExpiresAt?: Date;
  className?: string;
}

export function PaymentOptions({
  breakdown,
  depositPercentage = 30,
  selectedPaymentType,
  onPaymentTypeChange,
  onProceedToPayment,
  isProcessing,
  holdExpiresAt,
  className,
}: PaymentOptionsProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Timer for checkout hold
  useEffect(() => {
    if (!holdExpiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = holdExpiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: breakdown.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const depositAmount = useMemo(() => {
    return Math.ceil(breakdown.total * (depositPercentage / 100));
  }, [breakdown.total, depositPercentage]);

  const balanceAmount = breakdown.total - depositAmount;

  const amountDueNow = selectedPaymentType === 'deposit' ? depositAmount : breakdown.total;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Hold timer */}
      {holdExpiresAt && timeRemaining && timeRemaining !== 'Expired' && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Your dates are reserved for <span className="font-mono font-medium">{timeRemaining}</span>
          </span>
        </div>
      )}

      {timeRemaining === 'Expired' && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">
            Your reservation hold has expired. Please start over.
          </span>
        </div>
      )}

      {/* Payment type selection */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-serif text-lg font-medium mb-4">Payment Option</h3>

        <RadioGroup
          value={selectedPaymentType}
          onValueChange={(value) => onPaymentTypeChange(value as PaymentType)}
          className="space-y-3"
        >
          {/* Full payment option */}
          <label
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
              selectedPaymentType === 'full'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="full" id="full" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="full" className="font-medium cursor-pointer">
                  Pay in Full
                </Label>
                <span className="font-serif font-semibold text-lg">
                  {formatCurrency(breakdown.total)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Complete your booking with a single payment
              </p>
            </div>
          </label>

          {/* Deposit option */}
          <label
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
              selectedPaymentType === 'deposit'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="deposit" id="deposit" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="deposit" className="font-medium cursor-pointer">
                  Pay Deposit ({depositPercentage}%)
                </Label>
                <span className="font-serif font-semibold text-lg">
                  {formatCurrency(depositAmount)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Pay {formatCurrency(depositAmount)} now, {formatCurrency(balanceAmount)} due 14 days before arrival
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* Summary and proceed */}
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Amount Due Now</span>
          <span className="font-serif text-2xl font-semibold">{formatCurrency(amountDueNow)}</span>
        </div>

        {selectedPaymentType === 'deposit' && (
          <div className="text-sm text-muted-foreground">
            Remaining balance of {formatCurrency(balanceAmount)} due 14 days before check-in
          </div>
        )}

        <Separator />

        <Button
          size="lg"
          className="w-full h-14 text-lg gap-2"
          onClick={onProceedToPayment}
          disabled={isProcessing || timeRemaining === 'Expired'}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Proceed to Payment
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>SSL encrypted</span>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Powered by Stripe • Apple Pay • Google Pay accepted
        </div>
      </div>
    </div>
  );
}
