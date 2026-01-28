import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ArrowLeft, MapPin, Users, Calendar, Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { AddonsSelection } from '@/components/booking/AddonsSelection';
import { GuestForm } from '@/components/booking/GuestForm';
import { PriceBreakdownDisplay } from '@/components/booking/PriceBreakdown';
import { CouponInput } from '@/components/booking/CouponInput';
import { PaymentOptions } from '@/components/booking/PaymentOptions';
import { StripePaymentForm } from '@/components/booking/StripePaymentForm';
import { CancellationPolicyDisplay } from '@/components/booking/CancellationPolicyDisplay';
import { useProperty } from '@/hooks/useProperties';
import { useFeesTaxes, calculatePriceBreakdown } from '@/hooks/useBookingEngine';
import { useCreateCheckoutHold, useReleaseCheckoutHold, generateSessionId } from '@/hooks/useCheckoutFlow';
import { useCompleteBooking } from '@/hooks/useCompleteBooking';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { SelectedAddon, CouponPromo, BookingGuestWithCounts, PaymentType, PriceBreakdown } from '@/types/booking-engine';
import { CancellationPolicyKey } from '@/lib/cancellation-policies';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type CheckoutStep = 'dates' | 'addons' | 'guest' | 'payment';

// Generate booking reference
function generateBookingReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${year}${month}-${random}`;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const propertySlug = searchParams.get('property');
  const initialCheckIn = searchParams.get('checkIn');
  const initialCheckOut = searchParams.get('checkOut');
  const initialGuests = parseInt(searchParams.get('guests') || '2', 10);

  const { data: property, isLoading: propertyLoading } = useProperty(propertySlug || '');
  const { data: feesTaxes } = useFeesTaxes(property?.id);

  // Checkout state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('dates');
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn ? parseISO(initialCheckIn) : null);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut ? parseISO(initialCheckOut) : null);
  const [guests, setGuests] = useState(initialGuests);
  const [adults, setAdults] = useState(Math.min(initialGuests, 2));
  const [children, setChildren] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPromo | null>(null);
  const [guestInfo, setGuestInfo] = useState<BookingGuestWithCounts | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [sessionId] = useState(generateSessionId);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stripe state
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const createHold = useCreateCheckoutHold();
  const releaseHold = useReleaseCheckoutHold();
  const completeBooking = useCompleteBooking();
  
  // Real-time availability updates
  useRealtimeAvailability(property?.id);

  // Calculate nights and price
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return differenceInDays(checkOut, checkIn);
  }, [checkIn, checkOut]);

  const nightlyRate = property?.base_price || 500;

  const priceBreakdown: PriceBreakdown | null = useMemo(() => {
    if (!nights || nights <= 0 || !feesTaxes) return null;

    return calculatePriceBreakdown(
      nightlyRate,
      nights,
      guests,
      selectedAddons,
      feesTaxes,
      appliedCoupon || undefined,
      paymentType === 'deposit' ? 30 : undefined
    );
  }, [nightlyRate, nights, guests, selectedAddons, feesTaxes, appliedCoupon, paymentType]);

  // Calculate amount due
  const amountDue = useMemo(() => {
    if (!priceBreakdown) return 0;
    return paymentType === 'deposit' 
      ? (priceBreakdown.depositAmount || Math.ceil(priceBreakdown.total * 0.3))
      : priceBreakdown.total;
  }, [priceBreakdown, paymentType]);

  // Handle date selection
  const handleDateSelect = useCallback((date: Date, type: 'checkIn' | 'checkOut') => {
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(null);
      // Release any existing hold
      if (holdId) {
        releaseHold.mutate(holdId);
        setHoldId(null);
        setHoldExpiresAt(null);
      }
    } else {
      setCheckOut(date);
    }
  }, [holdId, releaseHold]);

  // Create hold when dates are selected
  useEffect(() => {
    if (checkIn && checkOut && property?.id && !holdId) {
      createHold.mutate(
        {
          propertyId: property.id,
          checkIn: format(checkIn, 'yyyy-MM-dd'),
          checkOut: format(checkOut, 'yyyy-MM-dd'),
          sessionId,
          ttlMinutes: 10,
        },
        {
          onSuccess: (data) => {
            setHoldId(data.id);
            setHoldExpiresAt(new Date(data.expires_at));
            toast({
              title: 'Dates reserved',
              description: 'Your dates are held for 10 minutes while you complete checkout.',
            });
          },
          onError: (error) => {
            toast({
              title: 'Could not reserve dates',
              description: 'These dates may no longer be available.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  }, [checkIn, checkOut, property?.id, holdId, sessionId, createHold]);

  // Step navigation
  const canProceedFromDates = checkIn && checkOut && nights >= 2;
  const canProceedFromAddons = true; // Addons are optional
  const canProceedFromGuest = guestInfo !== null;

  const handleNextStep = () => {
    switch (currentStep) {
      case 'dates':
        if (canProceedFromDates) setCurrentStep('addons');
        break;
      case 'addons':
        setCurrentStep('guest');
        break;
      case 'guest':
        if (canProceedFromGuest) setCurrentStep('payment');
        break;
    }
  };

  // Create Payment Intent and show Stripe form
  const handleProceedToPayment = async () => {
    if (!property || !checkIn || !checkOut || !guestInfo || !priceBreakdown) {
      toast({
        title: 'Missing information',
        description: 'Please complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Generate booking reference
      const newBookingReference = generateBookingReference();
      setBookingReference(newBookingReference);

      // First create the booking record (with pending payment status)
      const bookingResult = await completeBooking.mutateAsync({
        propertyId: property.id,
        property: {
          id: property.id,
          name: property.name,
          slug: property.slug,
          instant_booking: property.instant_booking,
        },
        checkIn,
        checkOut,
        nights,
        guests,
        adults,
        children,
        guestInfo,
        selectedAddons,
        priceBreakdown,
        appliedCoupon,
        paymentType,
        holdId: holdId || undefined,
        sessionId,
      });

      setCreatedBookingId(bookingResult.bookingId);

      // Create Payment Intent via edge function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          propertyId: property.id,
          propertyName: property.name,
          propertySlug: property.slug,
          propertyCity: property.city,
          propertyCountry: property.country,
          checkIn: format(checkIn, 'yyyy-MM-dd'),
          checkOut: format(checkOut, 'yyyy-MM-dd'),
          nights,
          guests,
          adults,
          children,
          accommodationTotal: priceBreakdown.accommodationTotal,
          addonsTotal: priceBreakdown.addonsTotal,
          feesTotal: priceBreakdown.feesTotal,
          taxesTotal: priceBreakdown.taxesTotal,
          discountAmount: priceBreakdown.discountAmount,
          discountCode: priceBreakdown.discountCode,
          totalAmount: priceBreakdown.total,
          currency: priceBreakdown.currency,
          paymentType,
          depositPercentage: paymentType === 'deposit' ? 30 : 100,
          amountDue,
          balanceDue: paymentType === 'deposit' ? priceBreakdown.balanceAmount : 0,
          cancellationPolicyName: 'Moderate',
          guestName: `${guestInfo.firstName} ${guestInfo.lastName}`,
          guestEmail: guestInfo.email,
          guestCountry: guestInfo.country,
          sessionId,
          bookingReference: bookingResult.bookingReference,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment');
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret received');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setShowStripeForm(true);
    } catch (error) {
      console.error('Payment setup error:', error);
      toast({
        title: 'Payment setup failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle successful Stripe payment
  const handlePaymentSuccess = async (stripePaymentIntentId: string) => {
    if (!createdBookingId) {
      toast({
        title: 'Error',
        description: 'Booking not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Confirm payment via edge function
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: {
          paymentIntentId: stripePaymentIntentId,
          bookingId: createdBookingId,
          paymentType,
        },
      });

      if (error) {
        console.error('Payment confirmation error:', error);
      }

      // Navigate to confirmation page
      navigate(`/booking/confirm?ref=${bookingReference}`, {
        state: {
          propertyName: property?.name,
          checkIn: checkIn ? format(checkIn, 'MMM d, yyyy') : '',
          checkOut: checkOut ? format(checkOut, 'MMM d, yyyy') : '',
          nights,
          totalPrice: priceBreakdown?.total,
          amountPaid: amountDue,
          paymentType,
          status: 'confirmed',
          bookingReference,
          receiptUrl: data?.receiptUrl,
        },
      });
    } catch (error) {
      console.error('Confirmation error:', error);
      // Still navigate - payment was successful
      navigate(`/booking/confirm?ref=${bookingReference}`);
    }
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    toast({
      title: 'Payment failed',
      description: errorMessage,
      variant: 'destructive',
    });
    setShowStripeForm(false);
    setClientSecret(null);
  };

  if (propertyLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!property) {
    return (
      <PageLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="font-serif text-2xl">Property not found</h1>
          <Button asChild>
            <Link to="/properties">Browse Properties</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Stripe Elements appearance
  const stripeAppearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(16 50% 48%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
    },
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-secondary/30">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-serif text-xl font-medium">{property.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{property.city}, {property.country}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              {['dates', 'addons', 'guest', 'payment'].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const steps: CheckoutStep[] = ['dates', 'addons', 'guest', 'payment'];
                      const currentIndex = steps.indexOf(currentStep);
                      if (index < currentIndex && !showStripeForm) setCurrentStep(step as CheckoutStep);
                    }}
                    disabled={showStripeForm}
                    className={`capitalize px-3 py-1 rounded-full transition-colors ${
                      currentStep === step
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    } ${showStripeForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {step}
                  </button>
                  {index < 3 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step: Dates */}
              {currentStep === 'dates' && (
                <>
                  <div className="bg-card rounded-xl border p-6">
                    <h2 className="font-serif text-xl font-medium mb-4">Select Your Dates</h2>
                    <AvailabilityCalendar
                      propertyId={property.id}
                      selectedCheckIn={checkIn}
                      selectedCheckOut={checkOut}
                      onDateSelect={handleDateSelect}
                      minStay={2}
                    />
                  </div>

                  <div className="bg-card rounded-xl border p-6">
                    <h3 className="font-medium mb-4">Number of Guests</h3>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        aria-label="Decrease guests"
                      >
                        -
                      </Button>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg font-medium">{guests}</span>
                        <span className="text-muted-foreground">guests</span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(Math.min(property.max_guests, guests + 1))}
                        disabled={guests >= property.max_guests}
                        aria-label="Increase guests"
                      >
                        +
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        (max {property.max_guests})
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleNextStep}
                    disabled={!canProceedFromDates}
                  >
                    Continue to Add-ons
                  </Button>
                </>
              )}

              {/* Step: Add-ons */}
              {currentStep === 'addons' && (
                <>
                  <AddonsSelection
                    propertyId={property.id}
                    nights={nights}
                    guests={guests}
                    selectedAddons={selectedAddons}
                    onAddonsChange={setSelectedAddons}
                  />

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentStep('dates')}
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={handleNextStep}
                    >
                      Continue to Guest Details
                    </Button>
                  </div>
                </>
              )}

              {/* Step: Guest */}
              {currentStep === 'guest' && (
                <>
                  <GuestForm
                    onSubmit={(data) => {
                      setGuestInfo(data);
                      setAdults(data.adults);
                      setChildren(data.children);
                      setGuests(data.adults + data.children);
                      setCurrentStep('payment');
                    }}
                    defaultValues={guestInfo ? {
                      firstName: guestInfo.firstName,
                      lastName: guestInfo.lastName,
                      email: guestInfo.email,
                      phone: guestInfo.phone,
                      country: guestInfo.country,
                      specialRequests: guestInfo.specialRequests,
                      adults: guestInfo.adults,
                      children: guestInfo.children,
                    } : {
                      adults,
                      children,
                    }}
                    maxGuests={property.max_guests}
                    initialGuests={guests}
                  />

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentStep('addons')}
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      type="submit"
                      form="guest-form"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </>
              )}

              {/* Step: Payment */}
              {currentStep === 'payment' && checkIn && (
                <>
                  {/* Cancellation Policy - shown before payment */}
                  <CancellationPolicyDisplay
                    policyKey="moderate"
                    checkInDate={checkIn}
                  />

                  {/* Show Stripe form if client secret is available */}
                  {showStripeForm && clientSecret ? (
                    <div className="bg-card rounded-xl border p-6">
                      <h3 className="font-serif text-lg font-medium mb-4">Complete Payment</h3>
                      <Elements
                        stripe={getStripe()}
                        options={{
                          clientSecret,
                          appearance: stripeAppearance,
                        }}
                      >
                        <StripePaymentForm
                          amountDue={amountDue}
                          currency={priceBreakdown?.currency || 'EUR'}
                          propertyName={property.name}
                          checkIn={format(checkIn, 'MMM d, yyyy')}
                          checkOut={checkOut ? format(checkOut, 'MMM d, yyyy') : ''}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    </div>
                  ) : (
                    <PaymentOptions
                      breakdown={priceBreakdown!}
                      depositPercentage={30}
                      selectedPaymentType={paymentType}
                      onPaymentTypeChange={setPaymentType}
                      onProceedToPayment={handleProceedToPayment}
                      isProcessing={isProcessing}
                      holdExpiresAt={holdExpiresAt || undefined}
                    />
                  )}

                  {!showStripeForm && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentStep('guest')}
                    >
                      Back to Guest Details
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Right column - Summary */}
            <div className="space-y-6">
              {/* Property summary */}
              <div className="bg-card rounded-xl border overflow-hidden">
                {property.hero_image_url && (
                  <img
                    src={property.hero_image_url}
                    alt={property.name}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-serif font-medium">{property.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {property.city}, {property.country}
                  </p>
                </div>
              </div>

              {/* Booking summary */}
              {checkIn && checkOut && (
                <div className="bg-card rounded-xl border p-4 space-y-3">
                  <h4 className="font-medium">Your Stay</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(checkIn, 'MMM d')} - {format(checkOut, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {adults} adult{adults !== 1 ? 's' : ''}
                      {children > 0 && `, ${children} child${children !== 1 ? 'ren' : ''}`}
                      {' · '}{nights} night{nights > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Price breakdown */}
              {priceBreakdown && (
                <>
                  <CouponInput
                    propertyId={property.id}
                    nights={nights}
                    bookingValue={priceBreakdown.subtotal}
                    appliedCoupon={appliedCoupon}
                    onCouponApply={setAppliedCoupon}
                  />
                  <PriceBreakdownDisplay
                    breakdown={priceBreakdown}
                    showDeposit={paymentType === 'deposit'}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
