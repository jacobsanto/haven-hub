import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ArrowLeft, MapPin, Users, Calendar, Loader2, Check } from 'lucide-react';
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
  { key: 'dates', label: 'Dates' },
  { key: 'guests', label: 'Guests' },
  { key: 'details', label: 'Details' },
  { key: 'payment', label: 'Payment' },
] as const;

function StepIndicator() {
  return (
    <nav aria-label="Checkout steps">
      <ol className="flex items-center justify-center gap-0" role="list">
        {STEPS.map((step, index) => {
          const isPayment = index === 3;
          const isCompleted = index < 3;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 p-1">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isPayment && 'bg-primary border-primary text-primary-foreground',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'w-12 sm:w-20 h-0.5 mx-1 mb-5',
                    index < 3 ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
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

  // Read checkout state from sessionStorage (set by BookingFlowDialog)
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
        if (data.selectedAddons) {
          setSelectedAddons(data.selectedAddons);
        }
        if (data.adults != null) setAdults(data.adults);
        if (data.children != null) setChildren(data.children);
        if (data.holdId) setHoldId(data.holdId);
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.adults != null && data.children != null) {
          setGuests(data.adults + data.children);
        }
        sessionStorage.removeItem('haven-hub-checkout-state');
      }
    } catch (e) {
      console.error('Failed to read checkout state from sessionStorage:', e);
    }
  }, []);

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

  // Create hold if not already created by dialog
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

        {/* Progress steps - all completed except payment (current) */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <StepIndicator />
          </div>
        </div>

        {/* Main content - Step 4: Review & Pay only */}
        <div className="container mx-auto px-4 py-8">
          {checkIn && checkOut && guestInfo && priceBreakdown ? (
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

                {/* Coupon + Price breakdown */}
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
                  onBack={() => navigate(-1)}
                />
              </div>
            </div>
          ) : (
            /* Missing data - redirect user back */
            <div className="text-center py-16 space-y-4">
              <h2 className="font-serif text-xl">Missing booking details</h2>
              <p className="text-muted-foreground">
                Please start from a property page to begin your booking.
              </p>
              <Button asChild>
                <Link to="/properties">Browse Properties</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
