import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ArrowLeft, MapPin, Users, Calendar, Loader2, Check, Star, Shield, Gift, CreditCard, Lock } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
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

const STEPS = [
  { key: 'dates', label: 'Dates & Guests', icon: Calendar },
  { key: 'addons', label: 'Add-ons', icon: Gift },
  { key: 'details', label: 'Guest Details', icon: Users },
  { key: 'payment', label: 'Payment', icon: CreditCard },
] as const;

function StepIndicator() {
  return (
    <nav aria-label="Checkout steps">
      <ol className="flex items-center justify-center gap-0" role="list">
        {STEPS.map((step, index) => {
          const isPayment = index === 3;
          const isCompleted = index < 3;
          const Icon = step.icon;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-2 p-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-400',
                    isCompleted && 'bg-emerald-500 border-2 border-emerald-500 text-background',
                    isPayment && 'bg-accent border-2 border-accent text-background shadow-[0_0_20px_hsl(var(--accent)/0.2)]',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-[0.08em] font-medium whitespace-nowrap transition-colors',
                    isCompleted && 'text-emerald-500',
                    isPayment && 'text-accent font-bold',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className="relative w-12 sm:w-20 h-0.5 mx-1 mb-6 bg-muted rounded overflow-hidden">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded transition-[width] duration-600',
                      isCompleted ? 'w-full bg-emerald-500' : 'w-1/2 bg-accent'
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
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

  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPromo | null>(null);
  const [guestInfo, setGuestInfo] = useState<BookingGuestWithCounts | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [holdId, setHoldId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [adults, setAdults] = useState(Math.min(initialGuests, 2));
  const [children, setChildren] = useState(0);
  const [guests, setGuests] = useState(initialGuests);

  const checkIn = initialCheckIn ? parseISO(initialCheckIn) : null;
  const checkOut = initialCheckOut ? parseISO(initialCheckOut) : null;

  const createHold = useCreateCheckoutHold();
  const releaseHold = useReleaseCheckoutHold();
  useRealtimeAvailability(property?.id);

  // Read sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('haven-hub-checkout-state');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.guestInfo) {
          setGuestInfo({
            firstName: data.guestInfo.firstName,
            lastName: data.guestInfo.lastName,
            email: data.guestInfo.email,
            phone: data.guestInfo.phone,
            country: data.guestInfo.country,
            specialRequests: data.guestInfo.specialRequests,
            adults: data.adults ?? 2,
            children: data.children ?? 0,
            marketingConsent: false,
            termsAccepted: false,
          });
        }
        if (data.selectedAddons) setSelectedAddons(data.selectedAddons);
        if (data.adults != null) setAdults(data.adults);
        if (data.children != null) setChildren(data.children);
        if (data.holdId) setHoldId(data.holdId);
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.adults != null && data.children != null) setGuests(data.adults + data.children);
        sessionStorage.removeItem('haven-hub-checkout-state');
      }
    } catch (e) {
      console.error('Failed to read checkout state:', e);
    }
  }, []);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return differenceInDays(checkOut, checkIn);
  }, [checkIn, checkOut]);

  const nightlyRate = property?.base_price || 500;

  const priceBreakdown: PriceBreakdown | null = useMemo(() => {
    if (!nights || nights <= 0 || !feesTaxes) return null;
    return calculatePriceBreakdown(
      nightlyRate, nights, guests, selectedAddons, feesTaxes,
      appliedCoupon || undefined,
      paymentType === 'deposit' ? 30 : undefined
    );
  }, [nightlyRate, nights, guests, selectedAddons, feesTaxes, appliedCoupon, paymentType]);

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
            holdCreationPending.current = false;
            toast({ title: 'Dates reserved', description: 'Your dates are held for 10 minutes while you complete checkout.' });
          },
          onError: () => {
            holdCreationPending.current = false;
            toast({ title: 'Could not reserve dates', description: 'These dates may no longer be available.', variant: 'destructive' });
          },
        }
      );
    }
  }, [checkIn, checkOut, property?.id, holdId, sessionId, createHold.isPending]);

  if (propertyLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </PageLayout>
    );
  }

  if (!property) {
    return (
      <PageLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
          <h1 className="font-serif text-2xl text-foreground">Property not found</h1>
          <Button asChild variant="gold" className="rounded-full">
            <Link to="/properties">Browse Properties</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-muted">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="font-serif text-lg font-medium text-foreground">{property.name}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{property.city}, {property.country}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Secure Booking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-5">
            <StepIndicator />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {checkIn && checkOut && guestInfo && priceBreakdown ? (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-2 space-y-6">
                {/* Villa Preview Card */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden sticky top-[180px]">
                  {property.hero_image_url && (
                    <div className="relative">
                      <img src={property.hero_image_url} alt={property.name} className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-1">
                      <MapPin className="h-2.5 w-2.5 inline mr-1" />{property.city}
                    </p>
                    <h3 className="font-serif text-lg font-medium text-foreground">{property.name}</h3>
                  </div>

                  {/* Dates */}
                  <div className="border-t border-border px-5 py-4 flex justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Check-in</p>
                      <p className="text-sm font-semibold text-foreground">{format(checkIn, 'MMM d, yyyy')}</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Check-out</p>
                      <p className="text-sm font-semibold text-foreground">{format(checkOut, 'MMM d, yyyy')}</p>
                    </div>
                  </div>

                  {/* Guest summary */}
                  <div className="border-t border-border px-5 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {adults} adult{adults !== 1 ? 's' : ''}
                      {children > 0 && `, ${children} child${children !== 1 ? 'ren' : ''}`}
                      {' · '}{nights} night{nights > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Price breakdown */}
                  <div className="border-t border-border px-5 py-5">
                    <CouponInput
                      propertyId={property.id}
                      nights={nights}
                      bookingValue={priceBreakdown.subtotal}
                      appliedCoupon={appliedCoupon}
                      onCouponApply={setAppliedCoupon}
                    />
                    <div className="mt-4">
                      <PriceBreakdownDisplay
                        breakdown={priceBreakdown}
                        showDeposit={paymentType === 'deposit'}
                      />
                    </div>
                  </div>

                  {/* Cancellation policy */}
                  <div className="border-t border-border px-5 py-4">
                    <CancellationPolicyDisplay policyKey="moderate" checkInDate={checkIn} />
                  </div>
                </div>
              </div>

              {/* Right Column: Payment */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-serif font-medium text-foreground mb-1">
                    Review & <em className="italic text-accent">Pay</em>
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">Complete your booking securely</p>

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
                    onBack={() => navigate(-1)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <h2 className="font-serif text-xl text-foreground">Missing booking details</h2>
              <p className="text-muted-foreground">Please start from a property page to begin your booking.</p>
              <Button asChild variant="gold" className="rounded-full">
                <Link to="/properties">Browse Properties</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
