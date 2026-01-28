import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertySelectorDialog } from './PropertySelectorDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingBookButton() {
  const [showSelector, setShowSelector] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 hidden lg:block"
      >
        <Button
          size="lg"
          onClick={() => setShowSelector(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'h-14 rounded-full shadow-lg transition-all duration-300',
            isHovered ? 'px-6' : 'w-14 px-0'
          )}
        >
          <Calendar className="h-5 w-5 flex-shrink-0" />
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

      <PropertySelectorDialog
        open={showSelector}
        onOpenChange={setShowSelector}
      />
    </>
  );
}
