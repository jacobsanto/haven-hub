import { useEffect, useState } from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Shield, Lock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStripePayment, CreatePaymentIntentParams } from '@/hooks/useStripePayment';
import { PriceBreakdown, SelectedAddon, BookingGuestWithCounts, PaymentType } from '@/types/booking-engine';

interface PaymentStepProps {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  guestInfo: BookingGuestWithCounts;
  selectedAddons: SelectedAddon[];
  priceBreakdown: PriceBreakdown;
  paymentType: PaymentType;
  holdId?: string | null;
  onPaymentSuccess: (result: {
    bookingId: string;
    bookingReference: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalPaid: number;
  }) => void;
  onBack: () => void;
}

type PaymentStage = 'initializing' | 'ready' | 'processing' | 'confirming' | 'success' | 'error';

export function PaymentStep({
  propertyId,
  checkIn,
  checkOut,
  nights,
  guests,
  adults,
  children,
  guestInfo,
  selectedAddons,
  priceBreakdown,
  paymentType,
  holdId,
  onPaymentSuccess,
  onBack,
}: PaymentStepProps) {
  const [stage, setStage] = useState<PaymentStage>('initializing');
  const [cardComplete, setCardComplete] = useState(false);

  const {
    isReady,
    isInitializing,
    isProcessing,
    clientSecret,
    bookingReference,
    error,
    canRetry,
    createPaymentIntent,
    processPayment,
    confirmPayment,
    reset,
  } = useStripePayment();

  // Initialize payment intent on mount
  useEffect(() => {
    if (!isReady) return;
    
    const initPayment = async () => {
      setStage('initializing');
      
      const params: CreatePaymentIntentParams = {
        propertyId,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        nights,
        guests,
        adults,
        children,
        guestInfo,
        selectedAddons,
        priceBreakdown,
        paymentType,
        holdId: holdId || undefined,
      };

      const result = await createPaymentIntent(params);
      
      if (result) {
        setStage('ready');
      } else {
        setStage('error');
      }
    };

    if (!clientSecret) {
      initPayment();
    } else {
      setStage('ready');
    }
  }, [isReady, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardComplete) return;

    // Step 1: Process payment with Stripe
    setStage('processing');
    const paymentResult = await processPayment();

    if (!paymentResult.success) {
      setStage('error');
      return;
    }

    // Step 2: Confirm payment and create booking
    setStage('confirming');
    const confirmResult = await confirmPayment();

    if (confirmResult) {
      setStage('success');
      onPaymentSuccess(confirmResult);
    } else {
      setStage('error');
    }
  };

  const handleRetry = () => {
    reset();
    setStage('initializing');
  };

  // Stripe not ready yet
  if (!isReady) {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading payment system...</p>
      </div>
    );
  }

  // Initializing payment intent
  if (stage === 'initializing' || isInitializing) {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <h3 className="font-serif text-xl font-medium mb-2">Preparing Payment</h3>
        <p className="text-muted-foreground">Securing your booking details...</p>
      </div>
    );
  }

  // Error state with retry
  if (stage === 'error' && error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={onBack}>
            Back
          </Button>
          {canRetry && (
            <Button size="lg" className="flex-1" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Success state (brief, before redirect)
  if (stage === 'success') {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="font-serif text-xl font-medium mb-2">Payment Successful!</h3>
        <p className="text-muted-foreground">Redirecting to your confirmation...</p>
      </div>
    );
  }

  // Confirming state
  if (stage === 'confirming') {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <h3 className="font-serif text-xl font-medium mb-2">Finalizing Booking</h3>
        <p className="text-muted-foreground">Creating your reservation...</p>
      </div>
    );
  }

  // Ready state - show card form
  return (
    <div className="space-y-6">
      {/* Payment summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Booking Reference</span>
          <span className="font-mono font-medium">{bookingReference}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-medium">Total to Pay</span>
          <span className="text-xl font-serif font-semibold">
            €{priceBreakdown.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Card form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Card Details</h3>
          </div>

          <div className="p-4 border rounded-lg bg-background">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'var(--foreground)',
                    '::placeholder': {
                      color: 'var(--muted-foreground)',
                    },
                  },
                  invalid: {
                    color: 'hsl(0 84% 60%)',
                  },
                },
                hidePostalCode: false,
              }}
              onChange={(e) => setCardComplete(e.complete)}
            />
          </div>

          {error && stage === 'ready' && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>PCI Compliant</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            size="lg" 
            onClick={onBack}
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={!cardComplete || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay €{priceBreakdown.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
