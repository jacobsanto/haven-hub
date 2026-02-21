import { useState, useCallback } from 'react';
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
    const patterns = {
      light: [10],
      medium: [20],
      success: [10, 50, 20],
    };
    navigator.vibrate(patterns[pattern]);
  }
};

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

  const nights = checkIn && checkOut 
    ? differenceInDays(checkOut, checkIn) 
    : 0;

  const totalPrice = nights > 0
    ? (discountedPrice ?? property.base_price) * nights
    : null;

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

  // Date range summary text
  const dateLabel = checkIn && checkOut
    ? `${format(checkIn, 'MMM d')} – ${format(checkOut, 'MMM d')}`
    : 'Select dates';

  return (
    <>
      {/* Sticky Bottom CTA Bar — mobile only */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-inset-bottom bg-white dark:bg-card border-t border-[rgba(30,60,120,0.08)]"
        style={{ boxShadow: '0 -4px 20px rgba(30,60,120,0.06)' }}
      >
        {/* Expandable breakdown panel */}
        <div
          className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
          style={{
            maxHeight: expanded ? '70vh' : '0px',
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="border-b border-[rgba(30,60,120,0.08)] p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Date Picker */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dates</h4>
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
                <div className="text-sm text-muted-foreground text-center mt-2">
                  {nights} night{nights > 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Guest Selector */}
            <div className="flex items-center justify-between px-3 py-2 border border-[rgba(30,60,120,0.08)] rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Guests</span>
                <span className="text-xs text-muted-foreground">(max {property.max_guests})</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-[rgba(30,60,120,0.08)]"
                  onClick={() => handleGuestChange(-1)}
                  disabled={guests <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-6 text-center">{guests}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-[rgba(30,60,120,0.08)]"
                  onClick={() => handleGuestChange(1)}
                  disabled={guests >= property.max_guests}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price breakdown when dates selected */}
            {nights > 0 && totalPrice !== null && (
              <div className="space-y-2 pt-2 border-t border-[rgba(30,60,120,0.08)]">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(discountedPrice ?? property.base_price).display} × {nights} nights</span>
                  <span>{formatPrice(totalPrice).display}</span>
                </div>
                {specialOffer && discountedPrice && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>{specialOffer.discount_percent}% off applied</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">{formatPrice(totalPrice).display}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact summary bar */}
        <div className="p-4 flex items-center justify-between gap-3">
          {/* Price + date summary */}
          <div className="flex-1 min-w-0" onClick={toggleExpanded} role="button" tabIndex={0}>
            <div className="flex items-baseline gap-2">
              {specialOffer && discountedPrice ? (
                <>
                  <span className="text-xl font-bold text-foreground">
                    {formatPrice(discountedPrice).display}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {priceDisplay}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-foreground">{priceDisplay}</span>
              )}
              <span className="text-sm text-muted-foreground">/night</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">{dateLabel}</span>
              {specialOffer && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-medium">
                  <Percent className="h-2.5 w-2.5" />
                  {specialOffer.discount_percent}%
                </span>
              )}
              <ChevronUp
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
            </div>
          </div>

          {/* Primary CTA */}
          {property.instant_booking ? (
            <Button
              size="lg"
              onClick={expanded ? handleQuickBook : toggleExpanded}
              className="min-h-[48px] px-6 rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft hover:-translate-y-[2px] hover:shadow-medium transition-[transform,box-shadow] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]"
            >
              <Zap className="h-4 w-4 fill-current" />
              {expanded ? 'Book Now' : 'Book'}
            </Button>
          ) : (
            <Sheet open={open} onOpenChange={handleSheetChange}>
              <SheetTrigger asChild>
                <Button 
                  size="lg" 
                  onClick={expanded ? handleOpenSheet : toggleExpanded}
                  className="min-h-[48px] px-6 rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft hover:-translate-y-[2px] hover:shadow-medium transition-[transform,box-shadow] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {expanded ? 'Check Dates' : 'Book'}
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
                <div className="p-6">
                  <BookingWidget property={property} specialOffer={specialOffer} />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
      
      {/* Spacer to prevent content from being hidden behind the CTA */}
      <div className="h-24 lg:hidden" />
    </>
  );
}
