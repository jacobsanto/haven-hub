import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Zap, ArrowRight, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { BookingWidget } from './BookingWidget';
import { Property, SpecialOffer } from '@/types/database';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  const discountedPrice = specialOffer 
    ? property.base_price * (1 - specialOffer.discount_percent / 100)
    : null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

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
    navigate(`/checkout?property=${property.slug}`);
  }, [navigate, property.slug]);

  return (
    <>
      {/* Floating CTA Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4 z-50 lg:hidden safe-area-inset-bottom"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Price Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              {specialOffer && discountedPrice ? (
                <>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(discountedPrice)}
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                    <Percent className="h-3 w-3" />
                    {specialOffer.discount_percent}% off
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instant booking indicator */}
            {property.instant_booking && !specialOffer && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                <Zap className="h-3 w-3 fill-current" />
                <span>Instant confirmation</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {property.instant_booking ? (
              <>
                {/* Quick book for instant booking properties */}
                <Button
                  size="lg"
                  onClick={handleQuickBook}
                  className="min-h-[48px] px-6 rounded-xl gap-2 active:scale-[0.98] transition-transform"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  Book Now
                </Button>
              </>
            ) : (
              <Sheet open={open} onOpenChange={handleSheetChange}>
                <SheetTrigger asChild>
                  <Button 
                    size="lg" 
                    onClick={handleOpenSheet}
                    className="min-h-[48px] px-6 rounded-xl gap-2 active:scale-[0.98] transition-transform"
                  >
                    <Calendar className="h-4 w-4" />
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
    </>
  );
}
