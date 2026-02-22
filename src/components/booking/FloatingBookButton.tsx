import { useState, useCallback } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Haptic feedback utility using Web Vibration API
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

export function FloatingBookButton() {
  const [isHovered, setIsHovered] = useState(false);
  const { openBooking } = useBooking();

  const handleClick = useCallback(() => {
    triggerHaptic('light');
    // Open unified booking dialog in search mode (browse all properties)
    openBooking({ mode: 'search' });
  }, [openBooking]);

  return (
    <>
      {/* Desktop Floating Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 hidden lg:block"
      >
        <Button
          size="lg"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'h-14 rounded-full shadow-lg transition-all duration-300',
            isHovered ? 'px-6' : 'w-14 px-0'
          )}
        >
          <CalendarIcon className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-2 whitespace-nowrap overflow-hidden"
              >
                Book Now
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Mobile Floating Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-4 right-4 z-50 lg:hidden"
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg active:scale-95 transition-transform"
          onClick={handleClick}
        >
          <CalendarIcon className="h-6 w-6" />
        </Button>
      </motion.div>
    </>
  );
}
