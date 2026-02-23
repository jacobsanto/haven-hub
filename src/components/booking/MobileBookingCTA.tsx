import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Zap, Percent, Users, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { BookingWidget } from './BookingWidget';
import { BookingFlowDialog } from '@/components/booking/BookingFlowDialog';
import { Property, SpecialOffer } from '@/types/database';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { useCurrency } from '@/hooks/useCurrency';
import { motion, AnimatePresence } from 'framer-motion';
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
  initialCheckIn?: Date;
  initialCheckOut?: Date;
  initialGuests?: number;
}

export function MobileBookingCTA({ property, priceDisplay, specialOffer, initialCheckIn, initialCheckOut, initialGuests }: MobileBookingCTAProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState(initialGuests || 2);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const { formatPrice } = useCurrency();

  // Real-time availability subscription
  useRealtimeAvailability(property.id);

  const discountedPrice = specialOffer 
    ? property.base_price * (1 - specialOffer.discount_percent / 100)
    : null;

  const nights = checkIn && checkOut 
    ? differenceInDays(checkOut, checkIn) 
    : 0;

  // Use CurrencyContext for price formatting

  const handleOpenSheet = useCallback(() => {
    triggerHaptic('light');
    setOpen(true);
  }, []);

  const handleSheetChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      triggerHaptic('light');
    }
    setOpen(isOpen);
  }, []);

  const handleQuickBook = useCallback(() => {
    triggerHaptic('success');
    setBookingDialogOpen(true);
  }, []);

  const handleGuestChange = useCallback((delta: number) => {
    triggerHaptic('light');
    setGuests(prev => Math.max(1, Math.min(property.max_guests, prev + delta)));
  }, [property.max_guests]);

  const toggleGuestSelector = useCallback(() => {
    triggerHaptic('light');
    setShowGuestSelector(prev => !prev);
    if (!showGuestSelector) setShowDatePicker(false);
  }, [showGuestSelector]);

  const toggleDatePicker = useCallback(() => {
    triggerHaptic('light');
    setShowDatePicker(prev => !prev);
    if (!showDatePicker) setShowGuestSelector(false);
  }, [showDatePicker]);

  const handleDateSelect = useCallback((date: Date, type: 'checkIn' | 'checkOut') => {
    triggerHaptic('light');
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(undefined);
    } else {
      setCheckOut(date);
    }
  }, []);

  return (
    <>
      {/* Floating CTA Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 lg:hidden safe-area-inset-bottom"
      >
        {/* Guest Selector Panel */}
        <AnimatePresence>
          {showGuestSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-b border-border overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Guests</span>
                  <span className="text-xs text-muted-foreground">(max {property.max_guests})</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange(-1)}
                    disabled={guests <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold w-6 text-center">{guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleGuestChange(1)}
                    disabled={guests >= property.max_guests}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Picker Panel - Now uses AvailabilityCalendar */}
        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-b border-border overflow-hidden"
            >
              <div className="p-3 flex flex-col items-center">
                <AvailabilityCalendar
                  propertyId={property.id}
                  variant="compact"
                  showPrices={false}
                  selectedCheckIn={checkIn}
                  selectedCheckOut={checkOut}
                  onDateSelect={handleDateSelect}
                  minStay={2}
                />
                {nights > 0 && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {nights} night{nights > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 flex items-center justify-between gap-3">
          {/* Price Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              {specialOffer && discountedPrice ? (
                <>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(discountedPrice).display}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {priceDisplay}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold">{priceDisplay}</span>
              )}
              <span className="text-sm text-muted-foreground">/night</span>
            </div>
            
            {/* Special offer badge */}
            <AnimatePresence>
              {specialOffer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 mt-1"
                >
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs font-medium">
                    <Percent className="h-3 w-3" />
                    {specialOffer.discount_percent}% off
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instant booking indicator */}
            {property.instant_booking && !specialOffer && (
              <div className="flex items-center gap-1 text-xs text-primary mt-1">
                <Zap className="h-3 w-3 fill-current" />
                <span>Instant confirmation</span>
              </div>
            )}
          </div>

          {/* Date Picker Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDatePicker}
            className={cn(
              "h-10 px-3 rounded-xl gap-1.5 shrink-0",
              showDatePicker && "ring-2 ring-primary"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="text-xs">
              {checkIn && checkOut 
                ? `${format(checkIn, 'MMM d')} - ${format(checkOut, 'MMM d')}`
                : 'Dates'
              }
            </span>
          </Button>

          {/* Guest Selector Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleGuestSelector}
            className={cn(
              "h-10 px-3 rounded-xl gap-1.5 shrink-0",
              showGuestSelector && "ring-2 ring-primary"
            )}
          >
            <Users className="h-4 w-4" />
            <span>{guests}</span>
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {property.instant_booking ? (
              <Button
                size="lg"
                onClick={handleQuickBook}
                className="min-h-[48px] px-6 rounded-xl gap-2 active:scale-[0.98] transition-transform"
              >
                <Zap className="h-4 w-4 fill-current" />
                Book Now
              </Button>
            ) : (
              <Sheet open={open} onOpenChange={handleSheetChange}>
                <SheetTrigger asChild>
                  <Button 
                    size="lg" 
                    onClick={handleOpenSheet}
                    className="min-h-[48px] px-6 rounded-xl gap-2 active:scale-[0.98] transition-transform"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Check Dates
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="bottom" 
                  className="h-[90vh] rounded-t-3xl p-0 overflow-auto focus:outline-none"
                >
                  {/* Swipe handle */}
                  <div className="sticky top-0 bg-background pt-3 pb-2 z-10">
                    <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                  </div>
                  <SheetHeader className="px-6 pb-4 border-b border-border">
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
      </motion.div>
      
      {/* Spacer to prevent content from being hidden behind the CTA */}
      <div className="h-28 lg:hidden" />

      {/* Booking Flow Dialog */}
      <BookingFlowDialog
        property={property}
        specialOffer={specialOffer}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialGuests={guests}
      />
    </>
  );
}
