import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { PropertySelectorDialog } from './PropertySelectorDialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
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

type MobileStep = 'property' | 'dates';

export function FloatingBookButton() {
  const navigate = useNavigate();
  const [showSelector, setShowSelector] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState<MobileStep>('property');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { data: properties, isLoading } = useProperties();

  const selectedProperty = properties?.find(p => p.slug === selectedPropertySlug);
  const nights = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) 
    : 0;

  const handleOpenDrawer = useCallback(() => {
    triggerHaptic('light');
    setShowMobileDrawer(true);
  }, []);

  const handleDrawerChange = useCallback((open: boolean) => {
    if (!open) {
      triggerHaptic('light');
      // Reset state after close
      setTimeout(() => {
        setMobileStep('property');
        setSelectedPropertySlug(null);
        setDateRange(undefined);
      }, 200);
    }
    setShowMobileDrawer(open);
  }, []);

  const handleSelectProperty = useCallback((slug: string) => {
    triggerHaptic('medium');
    setSelectedPropertySlug(slug);
  }, []);

  const handleNextStep = useCallback(() => {
    if (mobileStep === 'property' && selectedPropertySlug) {
      triggerHaptic('light');
      setMobileStep('dates');
    }
  }, [mobileStep, selectedPropertySlug]);

  const handlePrevStep = useCallback(() => {
    if (mobileStep === 'dates') {
      triggerHaptic('light');
      setMobileStep('property');
    }
  }, [mobileStep]);

  const handleMobileProceed = useCallback(() => {
    if (selectedPropertySlug) {
      triggerHaptic('success');
      const params = new URLSearchParams({ property: selectedPropertySlug });
      if (dateRange?.from) {
        params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
      }
      setShowMobileDrawer(false);
      navigate(`/checkout?${params.toString()}`);
    }
  }, [selectedPropertySlug, dateRange, navigate]);

  const handleDateSelect = useCallback((range: DateRange | undefined) => {
    triggerHaptic('light');
    setDateRange(range);
  }, []);

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
                <CalendarIcon className="h-6 w-6" />
              </Button>
            </motion.div>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh] focus:outline-none">
            {/* Enhanced swipe handle indicator */}
            <div className="mx-auto mt-3 mb-2 flex flex-col items-center gap-1">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                Swipe down to close
              </span>
            </div>
            
            <DrawerHeader className="border-b border-border pb-4 pt-2">
              <DrawerTitle className="font-serif text-xl">
                {mobileStep === 'property' ? 'Choose Your Property' : 'Select Your Dates'}
              </DrawerTitle>
              {/* Step indicator */}
              <div className="flex items-center gap-2 pt-2">
                <div className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                  mobileStep === 'property' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                )}>
                  {mobileStep === 'dates' ? <Check className="h-3 w-3" /> : '1'}
                </div>
                <div className="h-0.5 w-8 bg-border" />
                <div className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                  mobileStep === 'dates' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  2
                </div>
              </div>
            </DrawerHeader>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {mobileStep === 'property' ? (
                    <motion.div
                      key="property"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ScrollArea className="flex-1 px-4 py-4" style={{ maxHeight: 'calc(90vh - 280px)' }}>
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
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dates"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 py-4 space-y-4"
                    >
                      {/* Selected property summary */}
                      {selectedProperty && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          {selectedProperty.hero_image_url ? (
                            <img
                              src={selectedProperty.hero_image_url}
                              alt={selectedProperty.name}
                              className="w-14 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-14 h-10 bg-muted rounded-lg" />
                          )}
                          <div>
                            <h4 className="font-serif font-medium text-sm">{selectedProperty.name}</h4>
                            <p className="text-xs text-muted-foreground">{selectedProperty.city}</p>
                          </div>
                        </div>
                      )}

                      {/* Mobile-optimized single month calendar */}
                      <div className="flex justify-center">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={handleDateSelect}
                          numberOfMonths={1}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border pointer-events-auto"
                        />
                      </div>

                      {/* Date summary */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Check-in</p>
                            <p className="font-medium text-sm">
                              {dateRange?.from ? format(dateRange.from, 'MMM d') : '—'}
                            </p>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Check-out</p>
                            <p className="font-medium text-sm">
                              {dateRange?.to ? format(dateRange.to, 'MMM d') : '—'}
                            </p>
                          </div>
                        </div>
                        {nights > 0 && (
                          <div className="px-3 py-1 bg-primary/10 rounded-full">
                            <p className="font-medium text-sm text-primary">{nights} night{nights > 1 ? 's' : ''}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 p-4 border-t border-border bg-background safe-area-inset-bottom">
                  {mobileStep === 'dates' ? (
                    <Button
                      variant="outline"
                      className="h-12 gap-2 active:scale-[0.98] transition-transform"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  ) : (
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
                  )}
                  
                  {mobileStep === 'property' ? (
                    <Button
                      className="flex-1 h-12 gap-2 active:scale-[0.98] transition-transform"
                      onClick={handleNextStep}
                      disabled={!selectedPropertySlug}
                    >
                      Select Dates
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 h-12 gap-2 active:scale-[0.98] transition-transform"
                      onClick={handleMobileProceed}
                      disabled={!dateRange?.from}
                    >
                      {dateRange?.from && dateRange?.to ? 'Book Now' : 'Skip & Continue'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
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
