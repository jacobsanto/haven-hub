import { useState } from 'react';
import { Loader2, Lock, Shield, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { PriceBreakdown, SelectedAddon, BookingGuestWithCounts, PaymentType } from '@/types/booking-engine';

interface PaymentStepProps {
  propertyId: string;
  propertySlug: string;
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

type PaymentStage = 'ready' | 'redirecting' | 'error';

export function PaymentStep({
  propertyId,
  propertySlug,
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
  onBack,
}: PaymentStepProps) {
  const [stage, setStage] = useState<PaymentStage>('ready');
  const [error, setError] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState<string | null>(null);

  const handlePayment = async () => {
    setStage('redirecting');
    setError(null);

    try {
      const origin = window.location.origin;
      
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          propertyId,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          nights,
          guests,
          adults,
          children,
          guestInfo: {
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            email: guestInfo.email,
            phone: guestInfo.phone,
            country: guestInfo.country,
            specialRequests: guestInfo.specialRequests,
          },
          selectedAddons: selectedAddons.map(sa => ({
            addonId: sa.addon.id,
            quantity: sa.quantity,
            calculatedPrice: sa.calculatedPrice,
          })),
          priceBreakdown,
          paymentType,
          holdId: holdId || undefined,
          couponCode: priceBreakdown.discountCode,
          successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/payment-cancelled?property=${propertySlug}`,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      // Store booking reference for reference
      if (data.bookingReference) {
        setBookingReference(data.bookingReference);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to start payment');
      setStage('error');
    }
  };

  const handleRetry = () => {
    setStage('ready');
    setError(null);
  };

  // Redirecting state
  if (stage === 'redirecting') {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <h3 className="font-serif text-xl font-medium mb-2">Redirecting to Payment</h3>
        <p className="text-muted-foreground">Opening secure checkout page...</p>
        {bookingReference && (
          <p className="text-sm text-muted-foreground mt-2">
            Reference: <span className="font-mono">{bookingReference}</span>
          </p>
        )}
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
          <Button size="lg" className="flex-1" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Ready state - show payment button
  return (
    <div className="space-y-6">
      {/* Payment summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Total to Pay</span>
          <span className="text-xl font-serif font-semibold">
            €{priceBreakdown.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          You will be redirected to a secure Stripe payment page to complete your booking.
        </p>
      </div>

      {/* Payment methods info */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-medium mb-4">Accepted Payment Methods</h3>
        <div className="flex flex-wrap gap-3">
          <div className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
            💳 Credit/Debit Cards
          </div>
          <div className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
            Apple Pay
          </div>
          <div className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
            Google Pay
          </div>
          <div className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium">
            Link
          </div>
        </div>
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
        >
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handlePayment}
        >
          Pay €{priceBreakdown.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
