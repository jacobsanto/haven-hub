import { useState } from 'react';
import { Loader2, Lock, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handlePayment = async () => {
    if (!termsAccepted) return;

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

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.message || 'Failed to create checkout session');
      if (!data?.url) throw new Error('No checkout URL returned');

      if (data.bookingReference) {
        setBookingReference(data.bookingReference);
      }

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

  // Error state
  if (stage === 'error' && error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={onBack}>Back</Button>
          <Button size="lg" className="flex-1" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Ready state — Review and Pay
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-medium mb-1">Review and Pay</h2>
        <p className="text-sm text-muted-foreground">
          Please review your details and complete your booking.
        </p>
      </div>

      {/* Preferences & Terms */}
      <div className="bg-card rounded-xl border p-6 space-y-5">
        <h3 className="font-medium">Preferences & Terms</h3>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketing-consent"
            checked={marketingConsent}
            onCheckedChange={(v) => setMarketingConsent(v === true)}
          />
          <div className="space-y-0.5 leading-none">
            <Label htmlFor="marketing-consent" className="font-normal cursor-pointer">
              Send me exclusive offers and updates
            </Label>
            <p className="text-xs text-muted-foreground">
              Get early access to deals and new properties
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms-accepted"
            checked={termsAccepted}
            onCheckedChange={(v) => setTermsAccepted(v === true)}
          />
          <div className="space-y-0.5 leading-none">
            <Label htmlFor="terms-accepted" className="font-normal cursor-pointer">
              I accept the{' '}
              <a href="/terms" className="text-primary underline" target="_blank">Terms & Conditions</a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary underline" target="_blank">Privacy Policy</a> *
            </Label>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handlePayment}
          disabled={!termsAccepted}
        >
          <Lock className="h-4 w-4 mr-2" />
          Confirm and Pay €{priceBreakdown.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Button>
      </div>

      {/* Security note */}
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
      <p className="text-xs text-center text-muted-foreground">
        Your payment information is encrypted and secure. You will be redirected to a secure payment page.
      </p>
    </div>
  );
}
