import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Users, Zap, Clock, Star, Shield, CreditCard, Percent, Bed, Bath } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookingFlowDialog } from '@/components/booking/BookingFlowDialog';
import { useCreateBooking } from '@/hooks/useBookings';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Property, SpecialOffer } from '@/types/database';
import { cn } from '@/lib/utils';

interface BookingWidgetProps {
  property: Property;
  specialOffer?: SpecialOffer | null;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
  initialGuests?: number;
}

export function BookingWidget({ property, specialOffer, initialCheckIn, initialCheckOut, initialGuests }: BookingWidgetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const { formatPrice, selectedCurrency } = useCurrency();

  // Real-time availability subscription
  useRealtimeAvailability(property.id);

  const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests || 1);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Request-based flow state (only used when instant_booking is false)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [step, setStep] = useState<'dates' | 'details' | 'confirm'>('dates');

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const baseTotal = nights * property.base_price;
  const discountAmount = specialOffer ? baseTotal * specialOffer.discount_percent / 100 : 0;
  const totalPrice = baseTotal - discountAmount;

  // Format prices using currency context
  const basePriceFormatted = formatPrice(property.base_price);
  const baseTotalFormatted = formatPrice(baseTotal);
  const discountFormatted = formatPrice(discountAmount);
  const totalFormatted = formatPrice(totalPrice);

  const discountedNightly = specialOffer
    ? formatPrice(property.base_price * (1 - specialOffer.discount_percent / 100))
    : null;

  // Instant booking - open dialog flow
  const handleInstantBook = () => {
    setBookingDialogOpen(true);
  };

  // Request-based flow - continue through multi-step form
  const handleContinue = () => {
    if (step === 'dates') {
      if (!checkIn || !checkOut) {
        toast({
          title: 'Please select dates',
          description: 'Choose your check-in and check-out dates.',
          variant: 'destructive'
        });
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!guestName || !guestEmail) {
        toast({
          title: 'Please fill in your details',
          description: 'Name and email are required.',
          variant: 'destructive'
        });
        return;
      }
      setStep('confirm');
    }
  };

  // Request-based booking submission
  const handleRequestBooking = async () => {
    if (!checkIn || !checkOut) return;

    try {
      await createBooking.mutateAsync({
        propertyId: property.id,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        guests,
        basePrice: property.base_price
      });

      toast({
        title: 'Booking Request Submitted!',
        description: 'We will confirm your reservation shortly.'
      });

      navigate('/booking/confirm', {
        state: {
          propertyName: property.name,
          checkIn: format(checkIn, 'MMM d, yyyy'),
          checkOut: format(checkOut, 'MMM d, yyyy'),
          nights,
          totalPrice,
          isRequest: true
        }
      });
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Price breakdown shared between flows
  const PriceBreakdownBlock = () => {
    if (nights <= 0) return null;
    return (
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {basePriceFormatted.display} × {nights} night{nights > 1 ? 's' : ''}
          </span>
          <span className="font-medium">{baseTotalFormatted.display}</span>
        </div>
        {specialOffer && discountAmount > 0 && (
          <div className="flex justify-between text-sm text-accent-foreground">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              {specialOffer.title} (-{specialOffer.discount_percent}%)
            </span>
            <span className="font-medium">-{discountFormatted.display}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-xl font-medium font-serif text-foreground">{totalFormatted.display}</span>
        </div>
        {totalFormatted.isConverted && (
          <div className="text-xs text-muted-foreground text-right">
            {totalFormatted.original} · You pay in EUR
          </div>
        )}
      </div>
    );
  };

  // Trust indicators for below CTA
  const TrustIndicators = () => (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span>Best price guarantee</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span>Secure payment · No hidden fees</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span>Free cancellation up to 48h before</span>
      </div>
    </div>
  );

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden shadow-sm lg:sticky lg:top-24">
      {/* Special Offer Banner */}
      {specialOffer && (
        <div className="bg-accent/15 border-b border-accent/20 px-6 py-3 flex items-center gap-2">
          <Percent className="h-4 w-4 text-accent-foreground" />
          <span className="text-sm font-medium text-accent-foreground">
            {specialOffer.title} — Save {specialOffer.discount_percent}%
          </span>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* Price Header */}
        <div>
          <div className="flex items-baseline gap-2">
            {specialOffer && discountedNightly ? (
              <>
               <span className="text-2xl font-medium font-serif text-foreground">
                  {discountedNightly.display}
                </span>
                <span className="text-base text-muted-foreground line-through">
                  {basePriceFormatted.display}
                </span>
              </>
            ) : (
              <span className="text-2xl font-medium font-serif text-foreground">
                {basePriceFormatted.display}
              </span>
            )}
            <span className="text-sm text-muted-foreground">/night</span>
          </div>
          {basePriceFormatted.isConverted && (
            <p className="text-xs text-muted-foreground mt-1">
              {basePriceFormatted.original} · Prices shown in {selectedCurrency}
            </p>
          )}
        </div>

        {/* Property Quick Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            <span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>Up to {property.max_guests}</span>
          </div>
        </div>

        <Separator />

        {/* INSTANT BOOKING FLOW */}
        {property.instant_booking ? (
          <>
            <PriceBreakdownBlock />

            {/* Instant Book Button */}
            <Button onClick={handleInstantBook} size="lg" className="w-full btn-organic text-base gap-2">
              <Zap className="h-4 w-4 fill-current" />
              Book & Pay Now
            </Button>

            {property.instant_booking && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-primary">
                <Zap className="h-3 w-3 fill-current" />
                <span className="font-medium">Instant confirmation</span>
              </div>
            )}

            <TrustIndicators />
          </>
        ) : (
          /* REQUEST-BASED BOOKING FLOW */
          <>
            {step === 'details' && (
              <div className="space-y-4">
                <Input
                  placeholder="Full Name *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input-organic"
                />
                <Input
                  type="email"
                  placeholder="Email Address *"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="input-organic"
                />
                <Input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="input-organic"
                />
                <Button
                  variant="ghost"
                  onClick={() => setStep('dates')}
                  className="w-full text-sm"
                >
                  ← Back to dates
                </Button>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{checkIn && format(checkIn, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{checkOut && format(checkOut, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">{guests}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{guestName}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setStep('details')}
                  className="w-full text-sm"
                >
                  ← Edit details
                </Button>
              </div>
            )}

            <PriceBreakdownBlock />

            {/* Action Button */}
            {step === 'confirm' ? (
              <Button
                onClick={handleRequestBooking}
                disabled={createBooking.isPending}
                size="lg"
                className="w-full btn-organic text-base gap-2"
              >
                <Clock className="h-4 w-4" />
                {createBooking.isPending ? 'Submitting...' : 'Request Booking'}
              </Button>
            ) : (
              <Button onClick={handleContinue} size="lg" className="w-full btn-organic text-base">
                Continue
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              We'll confirm availability within 24 hours
            </p>

            <TrustIndicators />
          </>
        )}
      </div>

      {/* Booking Flow Dialog for instant booking */}
      <BookingFlowDialog
        property={property}
        specialOffer={specialOffer}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialGuests={guests}
      />
    </div>
  );
}
