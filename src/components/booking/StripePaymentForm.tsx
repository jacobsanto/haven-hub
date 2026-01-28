import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StripePaymentFormProps {
  amountDue: number;
  currency: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export function StripePaymentForm({
  amountDue,
  currency,
  propertyName,
  checkIn,
  checkOut,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirm`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentStatus('error');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // 3DS or additional authentication required
        // Stripe handles this automatically
        setPaymentStatus('processing');
      } else {
        setPaymentStatus('error');
        onError('Payment could not be processed');
      }
    } catch (err) {
      setPaymentStatus('error');
      onError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-serif text-xl font-medium text-foreground">
          Payment Successful!
        </h3>
        <p className="text-muted-foreground mt-2">
          Processing your booking...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Property</span>
          <span className="font-medium">{propertyName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Dates</span>
          <span>{checkIn} - {checkOut}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-medium">Amount Due</span>
          <span className="font-serif text-lg font-semibold">{formatPrice(amountDue)}</span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="space-y-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg gap-2"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay {formatPrice(amountDue)}
          </>
        )}
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe • 256-bit SSL encryption</span>
      </div>
    </form>
  );
}
