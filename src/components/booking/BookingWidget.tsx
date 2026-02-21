import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Users, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { Property, SpecialOffer } from '@/types/database';
import { PropertyBookingState } from '@/hooks/usePropertyBookingState';
import { cn } from '@/lib/utils';

// Animated total: fade-only on value change
function AnimatedTotal({ display }: { display: string }) {
  const prevRef = useRef(display);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (display !== prevRef.current) {
      setVisible(false);
      const t = setTimeout(() => {
        prevRef.current = display;
        setVisible(true);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [display]);

  return (
    <span
      className="text-xl font-bold text-foreground"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
    >
      {visible ? display : prevRef.current}
    </span>
  );
}

interface BookingWidgetProps {
  property: Property;
  specialOffer?: SpecialOffer | null;
  bookingState: PropertyBookingState;
}

export function BookingWidget({ property, specialOffer, bookingState }: BookingWidgetProps) {
  const {
    checkIn,
    checkOut,
    guests,
    nights,
    basePriceFormatted,
    baseTotalFormatted,
    discountFormatted,
    totalFormatted,
    discountAmount,
    handleDateSelect,
    setGuests,
    handleInstantBook,
    handleRequestBooking,
    createBookingPending,
    checkInOpen,
    setCheckInOpen,
    checkOutOpen,
    setCheckOutOpen,
  } = bookingState;

  // Request-based flow state (only used when instant_booking is false)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [step, setStep] = useState<'dates' | 'details' | 'confirm'>('dates');

  // Request-based flow - continue through multi-step form
  const handleContinue = () => {
    if (step === 'dates') {
      if (!checkIn || !checkOut) {
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!guestName || !guestEmail) {
        return;
      }
      setStep('confirm');
    }
  };

  const ctaClassName = "w-full rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft hover:-translate-y-[2px] hover:shadow-medium transition-[transform,box-shadow] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]";

  // Shared date/guest picker component with real availability
  const DateGuestPicker = () => (
    <div className="space-y-3">
      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-2">
        <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal border-[rgba(30,60,120,0.08)]',
                !checkIn && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {checkIn ? format(checkIn, 'MMM d') : 'Check in'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-card" align="start" sideOffset={4}>
            <AvailabilityCalendar
              propertyId={property.id}
              variant="compact"
              showPrices={false}
              selectedCheckIn={checkIn}
              selectedCheckOut={checkOut}
              onDateSelect={handleDateSelect}
              minStay={2}
            />
          </PopoverContent>
        </Popover>

        <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal border-[rgba(30,60,120,0.08)]',
                !checkOut && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {checkOut ? format(checkOut, 'MMM d') : 'Check out'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-card" align="start" sideOffset={4}>
            <AvailabilityCalendar
              propertyId={property.id}
              variant="compact"
              showPrices={false}
              selectedCheckIn={checkIn}
              selectedCheckOut={checkOut}
              onDateSelect={handleDateSelect}
              minStay={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Guests */}
      <div className="flex items-center justify-between px-3 py-2 border border-[rgba(30,60,120,0.08)] rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Guests</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-[rgba(30,60,120,0.08)]"
            onClick={() => setGuests(Math.max(1, guests - 1))}
            aria-label="Decrease guests"
          >
            -
          </Button>
          <span className="w-8 text-center">{guests}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-[rgba(30,60,120,0.08)]"
            onClick={() => setGuests(Math.min(property.max_guests, guests + 1))}
            aria-label="Increase guests"
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );

  // Price breakdown shared between instant & request flows
  const PriceSummary = () => (
    nights > 0 ? (
      <div className="space-y-3 pt-4 border-t border-[rgba(30,60,120,0.08)]">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {basePriceFormatted.display} × {nights} nights
          </span>
          <span>{baseTotalFormatted.display}</span>
        </div>
        {specialOffer && discountAmount > 0 && (
          <div className="flex justify-between text-xs text-emerald-600">
            <span>
              {specialOffer.title} (-{specialOffer.discount_percent}%)
            </span>
            <span>-{discountFormatted.display}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <AnimatedTotal display={totalFormatted.display} />
        </div>
        {totalFormatted.isConverted && (
          <div className="text-xs text-muted-foreground text-right">
            {totalFormatted.original} · You pay in EUR
          </div>
        )}
      </div>
    ) : null
  );

  return (
    <div
      className="bg-white dark:bg-card rounded-2xl border border-[rgba(30,60,120,0.08)] p-5 space-y-4 lg:sticky lg:top-24"
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      {/* Price Header */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-serif font-semibold">
          {basePriceFormatted.display}
        </span>
        <span className="text-muted-foreground">/ night</span>
      </div>

      {/* INSTANT BOOKING FLOW */}
      {property.instant_booking ? (
        <>
          <DateGuestPicker />
          <PriceSummary />

          {/* Instant Book Button */}
          <Button onClick={handleInstantBook} className={ctaClassName}>
            <Zap className="h-4 w-4" />
            Book & Pay Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment processing
          </p>
        </>
      ) : (
        /* REQUEST-BASED BOOKING FLOW */
        <>
          {step === 'dates' && <DateGuestPicker />}

          {step === 'details' && (
            <div className="space-y-3">
              <Input
                placeholder="Full Name *"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="border-[rgba(30,60,120,0.08)]"
              />
              <Input
                type="email"
                placeholder="Email Address *"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="border-[rgba(30,60,120,0.08)]"
              />
              <Input
                type="tel"
                placeholder="Phone Number (optional)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="border-[rgba(30,60,120,0.08)]"
              />
              <Button
                variant="ghost"
                onClick={() => setStep('dates')}
                className="w-full"
              >
                ← Back to dates
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 border border-[rgba(30,60,120,0.08)]">
                <div className="flex justify-between text-sm">
                  <span>Check-in</span>
                  <span className="font-medium">{checkIn && format(checkIn, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Check-out</span>
                  <span className="font-medium">{checkOut && format(checkOut, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Guests</span>
                  <span className="font-medium">{guests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Guest Name</span>
                  <span className="font-medium">{guestName}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setStep('details')}
                className="w-full"
              >
                ← Edit details
              </Button>
            </div>
          )}

          <PriceSummary />

          {/* Action Button */}
          {step === 'confirm' ? (
            <Button
              onClick={() => handleRequestBooking(guestName, guestEmail, guestPhone)}
              disabled={createBookingPending}
              className={ctaClassName}
            >
              <Clock className="h-4 w-4" />
              {createBookingPending ? 'Submitting...' : 'Request Booking'}
            </Button>
          ) : (
            <Button onClick={handleContinue} className={ctaClassName}>
              Continue
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            We'll confirm availability first
          </p>
        </>
      )}
    </div>
  );
}
