import { useIsMobile } from '@/hooks/use-mobile';
import { usePropertyBookingState } from '@/hooks/usePropertyBookingState';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Minus, Plus, Zap, Calendar, Users, Percent } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Property } from '@/types/database';

interface PropertyBookingPopupProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyBookingPopup({ property, open, onOpenChange }: PropertyBookingPopupProps) {
  const isMobile = useIsMobile();
  const { data: specialOffer } = useActiveSpecialOffer(property.id);
  const state = usePropertyBookingState(property, specialOffer);

  const content = (
    <div className="space-y-4">
      {/* Compact header */}
      <div className="flex items-center gap-3">
        <img
          src={property.hero_image_url || '/placeholder.svg'}
          alt={property.name}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-serif text-base font-medium truncate">{property.name}</h3>
          <p className="text-sm text-muted-foreground">{property.city}, {property.country}</p>
        </div>
      </div>

      {/* Special offer badge */}
      {specialOffer && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-full text-sm font-medium">
          <Percent className="h-4 w-4" />
          <span>{specialOffer.discount_percent}% off</span>
        </div>
      )}

      {/* Calendar */}
      <AvailabilityCalendar
        propertyId={property.id}
        selectedCheckIn={state.checkIn}
        selectedCheckOut={state.checkOut}
        onDateSelect={state.handleDateSelect}
        variant="compact"
        showPrices={false}
      />

      {/* Guest selector */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>Guests</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => state.handleGuestChange(-1)}
            disabled={state.guests <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-6 text-center text-sm font-medium">{state.guests}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => state.handleGuestChange(1)}
            disabled={state.guests >= property.max_guests}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Price breakdown */}
      <AnimatePresence mode="wait">
        {state.nights > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {state.basePriceFormatted.display} × {state.nights} night{state.nights > 1 ? 's' : ''}
                </span>
                <span>{state.baseTotalFormatted.display}</span>
              </div>
              {state.discountAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Special offer ({specialOffer?.discount_percent}%)</span>
                  <span>-{state.discountFormatted.display}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Total</span>
                <span>{state.totalFormatted.display}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <Button
        className="w-full gap-2"
        size="lg"
        disabled={!state.checkIn || !state.checkOut || state.createBookingPending}
        onClick={() => {
          if (property.instant_booking) {
            state.handleInstantBook();
          }
          // Non-instant would need a guest form — for now navigate to checkout too
        }}
      >
        {property.instant_booking ? (
          <>
            <Zap className="h-4 w-4" />
            Book &amp; Pay Now
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4" />
            Request Booking
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Book {property.name}</DrawerTitle>
            <DrawerDescription>Select dates and guests to book this property</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Book {property.name}</DialogTitle>
          <DialogDescription>Select dates and guests to book this property</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
