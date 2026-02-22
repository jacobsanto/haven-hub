import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ArrowLeft, MapPin, Users, Calendar, Loader2, Check } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { AddonsSelection } from '@/components/booking/AddonsSelection';
import { GuestForm } from '@/components/booking/GuestForm';
import { PriceBreakdownDisplay } from '@/components/booking/PriceBreakdown';
import { CouponInput } from '@/components/booking/CouponInput';
import { CancellationPolicyDisplay } from '@/components/booking/CancellationPolicyDisplay';

import { PaymentStep } from '@/components/booking/PaymentStep';
import { StripeHealthBanner } from '@/components/booking/StripeHealthBanner';
import { useProperty } from '@/hooks/useProperties';
import { useFeesTaxes, calculatePriceBreakdown } from '@/hooks/useBookingEngine';
import { useCreateCheckoutHold, useReleaseCheckoutHold, generateSessionId } from '@/hooks/useCheckoutFlow';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { SelectedAddon, CouponPromo, BookingGuestWithCounts, PaymentType, PriceBreakdown } from '@/types/booking-engine';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CheckoutStep = 'dates' | 'guests' | 'details' | 'payment';

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'dates', label: 'Dates' },
  { key: 'guests', label: 'Guests' },
  { key: 'details', label: 'Details' },
  { key: 'payment', label: 'Payment' },
];

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: typeof STEPS;
  currentStep: CheckoutStep;
  onStepClick: (step: CheckoutStep) => void;
}) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (isCompleted) onStepClick(step.key);
              }}
              className={cn(
                'flex flex-col items-center gap-1.5',
                isCompleted && 'cursor-pointer',
                isFuture && 'cursor-default'
              )}
              disabled={isFuture}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'bg-primary border-primary text-primary-foreground',
                  isFuture && 'bg-background border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-20 h-0.5 mx-1 mb-5',
                  index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
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

  const createHold = useCreateCheckoutHold();
  const releaseHold = useReleaseCheckoutHold();
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

  // Handle date selection
  const handleDateSelect = useCallback((date: Date, type: 'checkIn' | 'checkOut') => {
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(null);
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
  const holdCreationPending = useRef(false);
  
  useEffect(() => {
    if (checkIn && checkOut && property?.id && !holdId && !holdCreationPending.current && !createHold.isPending) {
      holdCreationPending.current = true;
      
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
            holdCreationPending.current = false;
            toast({
              title: 'Dates reserved',
              description: 'Your dates are held for 10 minutes while you complete checkout.',
            });
          },
          onError: () => {
            holdCreationPending.current = false;
            toast({
              title: 'Could not reserve dates',
              description: 'These dates may no longer be available.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  }, [checkIn, checkOut, property?.id, holdId, sessionId, createHold.isPending]);

  // Step navigation
  const canProceedFromDates = checkIn && checkOut && nights >= 2;

  const handleStepClick = (step: CheckoutStep) => {
    const currentIndex = STEPS.findIndex(s => s.key === currentStep);
    const targetIndex = STEPS.findIndex(s => s.key === step);
    if (targetIndex < currentIndex) setCurrentStep(step);
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
          <div className="container mx-auto px-4 py-4">
            <StepIndicator
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          {/* Steps 1-3: standard layout with sidebar */}
          {currentStep !== 'payment' ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left column - Main form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Step 1: Dates */}
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
                      onClick={() => { if (canProceedFromDates) setCurrentStep('guests'); }}
                      disabled={!canProceedFromDates}
                    >
                      Continue to Guest Breakdown
                    </Button>
                  </>
                )}

                {/* Step 2: Guests */}
                {currentStep === 'guests' && (
                  <>
                    <div className="bg-card rounded-xl border p-6">
                      <h2 className="font-serif text-xl font-medium mb-2">Guest Breakdown</h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Maximum {property.max_guests} guests allowed
                      </p>

                      {/* Adults */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Adults</div>
                            <p className="text-sm text-muted-foreground">Age 13+</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button" variant="outline" size="icon" className="h-8 w-8"
                              onClick={() => { setAdults(Math.max(1, adults - 1)); setGuests(Math.max(1, adults - 1) + children); }}
                              disabled={adults <= 1}
                            >-</Button>
                            <span className="w-8 text-center font-medium">{adults}</span>
                            <Button
                              type="button" variant="outline" size="icon" className="h-8 w-8"
                              onClick={() => { setAdults(Math.min(property.max_guests - children, adults + 1)); setGuests(Math.min(property.max_guests - children, adults + 1) + children); }}
                              disabled={adults + children >= property.max_guests}
                            >+</Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Children</div>
                            <p className="text-sm text-muted-foreground">Age 0-12</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button" variant="outline" size="icon" className="h-8 w-8"
                              onClick={() => { setChildren(Math.max(0, children - 1)); setGuests(adults + Math.max(0, children - 1)); }}
                              disabled={children <= 0}
                            >-</Button>
                            <span className="w-8 text-center font-medium">{children}</span>
                            <Button
                              type="button" variant="outline" size="icon" className="h-8 w-8"
                              onClick={() => { setChildren(Math.min(property.max_guests - adults, children + 1)); setGuests(adults + Math.min(property.max_guests - adults, children + 1)); }}
                              disabled={adults + children >= property.max_guests}
                            >+</Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Total: <strong>{adults + children}</strong> guest{adults + children !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={() => setCurrentStep('dates')}>
                        Back
                      </Button>
                      <Button size="lg" className="flex-1" onClick={() => setCurrentStep('details')}>
                        Continue to Details
                      </Button>
                    </div>
                  </>
                )}

                {/* Step 3: Details (Add-ons + Guest Info combined) */}
                {currentStep === 'details' && (
                  <>
                    <div>
                      <h2 className="font-serif text-xl font-medium mb-1">Enhance Your Stay</h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Customize your experience and let us know a bit about you.
                      </p>
                    </div>

                    <AddonsSelection
                      propertyId={property.id}
                      nights={nights}
                      guests={guests}
                      selectedAddons={selectedAddons}
                      onAddonsChange={setSelectedAddons}
                    />

                    <GuestForm
                      hidePreferences
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
                        adults,
                        children,
                      } : {
                        adults,
                        children,
                      }}
                      maxGuests={property.max_guests}
                      initialGuests={guests}
                    />

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={() => setCurrentStep('guests')}>
                        Back
                      </Button>
                      <Button size="lg" className="flex-1" type="submit" form="guest-form">
                        Continue to Payment
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Right column - Summary sidebar (steps 1-3) */}
              <div className="space-y-6">
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
          ) : (
            /* Step 4: Payment — Two-column Review & Pay layout */
            checkIn && checkOut && guestInfo && priceBreakdown && (
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Left column: Booking summary */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Property card */}
                  <div className="bg-card rounded-xl border overflow-hidden">
                    {property.hero_image_url && (
                      <img
                        src={property.hero_image_url}
                        alt={property.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-serif text-lg font-medium">{property.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{property.city}, {property.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking details summary */}
                  <div className="bg-card rounded-xl border p-5 space-y-3">
                    <h4 className="font-medium">Booking Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(checkIn, 'MMM d')} – {format(checkOut, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {adults} adult{adults !== 1 ? 's' : ''}
                          {children > 0 && `, ${children} child${children !== 1 ? 'ren' : ''}`}
                          {' · '}{nights} night{nights > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <PriceBreakdownDisplay
                    breakdown={priceBreakdown}
                    showDeposit={paymentType === 'deposit'}
                  />

                  {/* Cancellation policy */}
                  <CancellationPolicyDisplay
                    policyKey="moderate"
                    checkInDate={checkIn}
                  />
                </div>

                {/* Right column: Preferences, Terms & Pay CTA */}
                <div className="lg:col-span-3 space-y-6">
                  <StripeHealthBanner />

                  <PaymentStep
                    propertyId={property.id}
                    propertySlug={property.slug}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    nights={nights}
                    guests={guests}
                    adults={adults}
                    children={children}
                    guestInfo={guestInfo}
                    selectedAddons={selectedAddons}
                    priceBreakdown={priceBreakdown}
                    paymentType={paymentType}
                    holdId={holdId}
                    onPaymentSuccess={(result) => {
                      navigate(`/booking/confirm?ref=${result.bookingReference}`);
                    }}
                    onBack={() => setCurrentStep('details')}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </PageLayout>
  );
}
