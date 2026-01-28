import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Loader2, ArrowRight, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertySelectorDialog } from './PropertySelectorDialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProperties } from '@/hooks/useProperties';
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
  const navigate = useNavigate();
  const [showSelector, setShowSelector] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);
  
  const { data: properties, isLoading } = useProperties();

  const handleOpenDrawer = useCallback(() => {
    triggerHaptic('light');
    setShowMobileDrawer(true);
  }, []);

  const handleDrawerChange = useCallback((open: boolean) => {
    if (!open) {
      triggerHaptic('light');
    }
    setShowMobileDrawer(open);
  }, []);

  const handleSelectProperty = useCallback((slug: string) => {
    triggerHaptic('medium');
    setSelectedPropertySlug(slug);
  }, []);

  const handleMobileProceed = useCallback(() => {
    if (selectedPropertySlug) {
      triggerHaptic('success');
      setShowMobileDrawer(false);
      navigate(`/checkout?property=${selectedPropertySlug}`);
    }
  }, [selectedPropertySlug, navigate]);

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

      {/* Mobile Floating Button with Drawer */}
      <div className="fixed bottom-4 right-4 z-50 lg:hidden">
        <Drawer 
          open={showMobileDrawer} 
          onOpenChange={handleDrawerChange}
          shouldScaleBackground
        >
          <DrawerTrigger asChild>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            >
              <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg active:scale-95 transition-transform"
                onClick={handleOpenDrawer}
              >
                <Calendar className="h-6 w-6" />
              </Button>
            </motion.div>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh] focus:outline-none">
            {/* Enhanced swipe handle indicator */}
            <div className="mx-auto mt-3 mb-2 flex flex-col items-center gap-1">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                Swipe down to close
              </span>
            </div>
            
            <DrawerHeader className="border-b border-border pb-4 pt-2">
              <DrawerTitle className="font-serif text-xl">Choose Your Property</DrawerTitle>
            </DrawerHeader>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 px-4 py-4" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                  <div className="space-y-3">
                    {properties?.map((property) => (
                      <motion.button
                        key={property.id}
                        type="button"
                        onClick={() => handleSelectProperty(property.slug)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'w-full flex gap-3 p-3 rounded-xl border-2 transition-all text-left',
                          selectedPropertySlug === property.slug
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border active:border-primary/50 active:bg-muted/50'
                        )}
                      >
                        {property.hero_image_url ? (
                          <img
                            src={property.hero_image_url}
                            alt={property.name}
                            className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-16 bg-muted rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-medium text-sm truncate">{property.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{property.city}, {property.country}</span>
                          </div>
                          <div className="mt-1.5 text-sm font-medium text-primary">
                            From €{property.base_price}/night
                          </div>
                        </div>
                        {/* Selection indicator */}
                        <AnimatePresence>
                          {selectedPropertySlug === property.slug && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="self-center w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                            >
                              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-3 p-4 border-t border-border bg-background safe-area-inset-bottom">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 active:scale-[0.98] transition-transform"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowMobileDrawer(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-12 gap-2 active:scale-[0.98] transition-transform"
                    onClick={handleMobileProceed}
                    disabled={!selectedPropertySlug}
                  >
                    Book Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop Dialog */}
      <PropertySelectorDialog
        open={showSelector}
        onOpenChange={setShowSelector}
      />
    </>
  );
}
