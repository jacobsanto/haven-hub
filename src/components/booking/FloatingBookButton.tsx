import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import { motion } from 'framer-motion';

export function FloatingBookButton() {
  const location = useLocation();
  const { openBooking } = useBooking();

  // Hide on property detail pages — BookingWidget / MobileBookingCTA own that context
  const isPropertyPage = /^\/properties\/[^/]+$/.test(location.pathname);
  // Also hide on checkout / payment pages
  const isBookingFlow = location.pathname.startsWith('/checkout') || location.pathname.startsWith('/payment');

  const handleClick = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate([10]);
    openBooking({ mode: 'search' });
  }, [openBooking]);

  if (isPropertyPage || isBookingFlow) return null;

  return (
    <>
      {/* Desktop — pill button, bottom-right */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 hidden lg:block"
      >
        <Button
          size="lg"
          onClick={handleClick}
          className="h-12 rounded-full px-5 gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Search className="h-4 w-4" />
          <span className="font-medium">Find a Stay</span>
        </Button>
      </motion.div>

      {/* Mobile — pill button, bottom-center */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden"
      >
        <Button
          size="lg"
          className="h-12 rounded-full px-5 gap-2 shadow-lg active:scale-95 transition-transform"
          onClick={handleClick}
        >
          <Search className="h-4 w-4" />
          <span className="font-medium text-sm">Search</span>
        </Button>
      </motion.div>
    </>
  );
}
