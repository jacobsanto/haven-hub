import { useState, useCallback, useEffect } from 'react';
import { Compass, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import { useProperties } from '@/hooks/useProperties';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const triggerHaptic = (pattern: 'light' | 'medium' | 'success' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], success: [10, 50, 20] };
    navigator.vibrate(patterns[pattern]);
  }
};

export function FloatingBookButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { openBooking } = useBooking();
  const { data: properties } = useProperties();

  const propertyCount = properties?.length ?? 0;

  useEffect(() => {
    const threshold = window.innerHeight * 0.7;
    const onScroll = () => setIsVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = useCallback(() => {
    triggerHaptic('light');
    openBooking({ mode: 'search' });
  }, [openBooking]);

  return (
    <>
      {/* Desktop */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="fixed bottom-6 right-6 z-50 hidden lg:block"
          >
            <Button
              size="lg"
              onClick={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="h-14 rounded-full shadow-lg px-6 transition-all duration-300"
            >
              <Compass className="h-5 w-5 flex-shrink-0" />
              <span className="ml-2 whitespace-nowrap">Find a Stay</span>
              <AnimatePresence>
                {isHovered && propertyCount > 0 && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-1 whitespace-nowrap overflow-hidden text-primary-foreground/70 text-sm"
                  >
                    · {propertyCount} stays
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 lg:hidden"
          >
            <Button
              size="lg"
              className="h-12 rounded-full shadow-lg px-5 active:scale-95 transition-transform gap-2"
              onClick={handleClick}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">Search</span>
              {propertyCount > 0 && (
                <span className="text-primary-foreground/60 text-xs">
                  · {propertyCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
