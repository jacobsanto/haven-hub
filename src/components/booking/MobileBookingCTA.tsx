import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Zap, Percent, Users, Minus, Plus, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { BookingWidget } from './BookingWidget';
import { Property, SpecialOffer } from '@/types/database';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

// Haptic feedback utility
const triggerHaptic = (pattern: 'light' | 'medium' | 'success' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], success: [10, 50, 20] };
    navigator.vibrate(patterns[pattern]);
  }
};

// Fade-only animated total for mobile
function MobileAnimatedTotal({ display }: { display: string }) {
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

interface MobileBookingCTAProps {
  property: Property;
  priceDisplay: string;
  specialOffer?: SpecialOffer | null;
}

export function MobileBookingCTA({ property, priceDisplay, specialOffer }: MobileBookingCTAProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const { formatPrice } = useCurrency();

  // Real-time availability subscription
  useRealtimeAvailability(property.id);

  const discountedPrice = specialOffer
    ? property.base_price * (1 - specialOffer.discount_percent / 100)
    : null;

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const nightlyRate = discountedPrice ?? property.base_price;
  const totalPrice = nights > 0 ? nightlyRate * nights : null;

  const handleOpenSheet = useCallback(() => {
    triggerHaptic('light');
    setOpen(true);
  }, []);

  const handleSheetChange = useCallback((isOpen: boolean) => {
    if (!isOpen) triggerHaptic('light');
    setOpen(isOpen);
  }, []);

  const handleQuickBook = useCallback(() => {
    triggerHaptic('success');
    const params = new URLSearchParams({ property: property.slug, guests: String(guests) });
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    navigate(`/checkout?${params.toString()}`);
  }, [navigate, property.slug, guests, checkIn, checkOut]);

  const handleGuestChange = useCallback((delta: number) => {
    triggerHaptic('light');
    setGuests(prev => Math.max(1, Math.min(property.max_guests, prev + delta)));
  }, [property.max_guests]);

  const handleDateSelect = useCallback((date: Date, type: 'checkIn' | 'checkOut') => {
    triggerHaptic('light');
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(undefined);
    } else {
      setCheckOut(date);
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    triggerHaptic('light');
    setExpanded(prev => !prev);
  }, []);

  const dateLabel = checkIn && checkOut
    ? `${format(checkIn, 'MMM d')} – ${format(checkOut, 'MMM d')}`
    : 'Select dates';

  const ctaClassName = "min-h-[48px] px-6 rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft hover:-translate-y-[2px] hover:shadow-medium transition-[transform,box-shadow] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]";

  return (
    <>
      {/* Sticky Bottom Bar — mobile only */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-inset-bottom bg-white dark:bg-card border-t border-[rgba(30,60,120,0.08)]"
        style={{ boxShadow: '0 -2px 12px rgba(30,60,120,0.05)' }}
      >
        {/* Expandable panel: 4 vertical sections */}
        <div
          className="overflow-hidden"
          style={{
            maxHeight: expanded ? '75vh' : '0px',
            opacity: expanded ? 1 : 0,
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
          }}
        >
          <div className="max-h-[75vh] overflow-y-auto">
            {/* Section 1: Date Selection */}
            <div className="px-4 pt-4 pb-3">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Dates</h4>
              <div className="flex justify-center">
                <AvailabilityCalendar
                  propertyId={property.id}
                  variant="compact"
                  showPrices={false}
                  selectedCheckIn={checkIn}
                  selectedCheckOut={checkOut}
                  onDateSelect={handleDateSelect}
                  minStay={2}
                />
              </div>
              {nights > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {nights} night{nights > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Section 2: Guest Selection */}
            <div className="px-4 py-3 border-t border-[rgba(30,60,120,0.08)]">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Guests</h4>
              <div className="flex items-center justify-between px-3 py-2 border border-[rgba(30,60,120,0.08)] rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{guests} guest{guests > 1 ? 's' : ''}</span>
                  <span className="text-[11px] text-muted-foreground">(max {property.max_guests})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-[rgba(30,60,120,0.08)]"
                    onClick={() => handleGuestChange(-1)}
                    disabled={guests <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center font-semibold">{guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-[rgba(30,60,120,0.08)]"
                    onClick={() => handleGuestChange(1)}
                    disabled={guests >= property.max_guests}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 3: Price Breakdown */}
            {nights > 0 && totalPrice !== null && (
              <div className="px-4 py-3 border-t border-[rgba(30,60,120,0.08)]">
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Price</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatPrice(nightlyRate).display} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span>{formatPrice(totalPrice).display}</span>
                  </div>
                  {specialOffer && discountedPrice && (
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>{specialOffer.discount_percent}% off applied</span>
                    </div>
                  )}
                  {/* Divider above total */}
                  <div className="border-t border-[rgba(30,60,120,0.08)] pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">Total</span>
                      <MobileAnimatedTotal display={formatPrice(totalPrice).display} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Full-width CTA inside expanded panel */}
            <div className="px-4 pt-2 pb-4">
              {property.instant_booking ? (
                <Button size="lg" onClick={handleQuickBook} className={cn(ctaClassName, 'w-full')}>
                  <Zap className="h-4 w-4 fill-current" />
                  Book Now
                </Button>
              ) : (
                <Sheet open={open} onOpenChange={handleSheetChange}>
                  <SheetTrigger asChild>
                    <Button size="lg" onClick={handleOpenSheet} className={cn(ctaClassName, 'w-full')}>
                      <CalendarIcon className="h-4 w-4" />
                      Check Availability
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="h-[90vh] rounded-t-3xl p-0 overflow-auto focus:outline-none bg-white dark:bg-card"
                  >
                    <div className="sticky top-0 bg-white dark:bg-card pt-3 pb-2 z-10">
                      <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                    </div>
                    <SheetHeader className="px-6 pb-4 border-b border-[rgba(30,60,120,0.08)]">
                      <SheetTitle className="font-serif text-xl text-left">
                        Book {property.name}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="p-5">
                      <BookingWidget property={property} specialOffer={specialOffer} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>

        {/* Compact summary bar (always visible) */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Price + date summary — tappable to expand */}
          <div className="flex-1 min-w-0" onClick={toggleExpanded} role="button" tabIndex={0}>
            <div className="flex items-baseline gap-1.5">
              {specialOffer && discountedPrice ? (
                <>
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(discountedPrice).display}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    {priceDisplay}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-foreground">{priceDisplay}</span>
              )}
              <span className="text-xs text-muted-foreground">/night</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] text-muted-foreground">{dateLabel}</span>
              {specialOffer && (
                <span className="inline-flex items-center gap-0.5 px-1 py-px bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-medium">
                  <Percent className="h-2.5 w-2.5" />
                  {specialOffer.discount_percent}%
                </span>
              )}
              <ChevronUp
                className={cn(
                  "h-3 w-3 text-muted-foreground",
                  "transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
            </div>
          </div>

          {/* Compact CTA (collapsed state) */}
          {!expanded && (
            <Button
              size="lg"
              onClick={toggleExpanded}
              className={ctaClassName}
            >
              {property.instant_booking && <Zap className="h-4 w-4 fill-current" />}
              Book
            </Button>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
