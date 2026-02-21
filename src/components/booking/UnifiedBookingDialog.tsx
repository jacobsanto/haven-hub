import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Users,
  Search,
  Minus,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useProperties } from '@/hooks/useProperties';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { useBooking } from '@/contexts/BookingContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Haptic feedback utility
const triggerHaptic = (pattern: 'light' | 'medium' | 'success' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], success: [10, 50, 20] };
    navigator.vibrate(patterns[pattern]);
  }
};

type Step = 'where-when' | 'choose-property';

export function UnifiedBookingDialog() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { 
    isOpen, 
    closeBooking, 
    dateRange,
    setDateRange,
    guests,
    setGuests,
    searchLocation,
    setSearchLocation
  } = useBooking();

  const { data: properties, isLoading } = useProperties();
  const { data: destinations, isLoading: destinationsLoading } = useActiveDestinations();
  
  const [step, setStep] = useState<Step>('where-when');
  const [selectedDestinationName, setSelectedDestinationName] = useState(searchLocation);

  // Reset step when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('where-when');
      setSelectedDestinationName(searchLocation);
    }
  }, [isOpen, searchLocation]);

  // Filter properties based on selected destination
  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    if (!selectedDestinationName.trim()) return properties;
    const term = selectedDestinationName.toLowerCase();
    return properties.filter(p => 
      p.city.toLowerCase() === term ||
      p.country.toLowerCase().includes(term)
    );
  }, [properties, selectedDestinationName]);

  const nights = dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from) 
    : 0;

  const handleDateSelect = useCallback((range: DateRange | undefined) => {
    triggerHaptic('light');
    setDateRange(range);
  }, [setDateRange]);

  const handleGuestChange = useCallback((delta: number) => {
    triggerHaptic('light');
    setGuests(Math.max(1, Math.min(20, guests + delta)));
  }, [guests, setGuests]);

  const handleSelectDestination = useCallback((destinationName: string) => {
    triggerHaptic('light');
    setSelectedDestinationName(destinationName);
  }, []);

  const handleSearchProperties = useCallback(() => {
    triggerHaptic('light');
    setSearchLocation(selectedDestinationName);
    const params = new URLSearchParams();
    if (selectedDestinationName) params.set('location', selectedDestinationName);
    params.set('guests', String(guests));
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    closeBooking();
    navigate(`/properties?${params.toString()}`);
  }, [selectedDestinationName, guests, dateRange, setSearchLocation, closeBooking, navigate]);

  const handleBrowseProperties = useCallback(() => {
    triggerHaptic('light');
    setStep('choose-property');
  }, []);

  const handleSelectPropertyCard = useCallback((slug: string) => {
    triggerHaptic('medium');
    closeBooking();
    navigate(`/properties/${slug}`);
  }, [closeBooking, navigate]);

  const stepNumber = step === 'where-when' ? 1 : 2;
  const totalSteps = 2;

  const renderContent = () => (
    <>
      <AnimatePresence mode="wait">
        {/* Step 1 — Where & When */}
        {step === 'where-when' && (
          <motion.div
            key="where-when"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Destination cards — horizontal scroll with images */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Where to?</p>
              {destinationsLoading ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 w-36 rounded-xl flex-shrink-0" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                  {/* All Destinations chip */}
                  <button
                    type="button"
                    onClick={() => handleSelectDestination('')}
                    className={cn(
                      'relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all',
                      !selectedDestinationName
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-primary/40'
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
                    <div className="relative h-full flex flex-col items-center justify-center text-primary-foreground p-2">
                      <MapPin className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium leading-tight text-center">All</span>
                    </div>
                  </button>

                  {destinations?.map((destination) => (
                    <button
                      key={destination.id}
                      type="button"
                      onClick={() => handleSelectDestination(destination.name)}
                      className={cn(
                        'relative flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden border-2 transition-all',
                        selectedDestinationName === destination.name
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-primary/40'
                      )}
                    >
                      {destination.hero_image_url ? (
                        <img
                          src={destination.hero_image_url}
                          alt={destination.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="relative h-full flex flex-col justify-end p-2.5">
                        <p className="text-white text-sm font-medium leading-tight">{destination.name}</p>
                        <p className="text-white/70 text-[11px]">{destination.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">When?</p>
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={isMobile ? 1 : 2}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border pointer-events-auto"
                />
              </div>
            </div>

            {/* Guest selector */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Guests</span>
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
                  disabled={guests >= 20}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Date summary */}
            {dateRange?.from && (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
                <div className="flex items-center gap-3 text-sm">
                  <span>{format(dateRange.from, 'MMM d')}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{dateRange.to ? format(dateRange.to, 'MMM d') : '—'}</span>
                </div>
                {nights > 0 && (
                  <span className="text-sm font-medium text-primary">{nights} night{nights > 1 ? 's' : ''}</span>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2 — Choose Property */}
        {step === 'choose-property' && (
          <motion.div
            key="choose-property"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ScrollArea className={isMobile ? 'max-h-[50vh]' : 'max-h-[50vh]'}>
              <div className="space-y-3 pr-2">
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No properties found. Try adjusting your search.
                  </div>
                ) : (
                  filteredProperties.map((property) => (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => handleSelectPropertyCard(property.slug)}
                      className="w-full flex gap-4 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
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
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{property.bedrooms} bed</span>
                          <span>·</span>
                          <span>{property.max_guests} guests</span>
                        </div>
                        <div className="mt-1 text-sm font-medium text-primary">
                          From €{property.base_price}/night
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 self-center text-muted-foreground flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="flex gap-3 pt-4 border-t mt-4">
        {step === 'where-when' && (
          <>
            <Button variant="outline" onClick={closeBooking} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSearchProperties} 
              className="flex-1 gap-2"
            >
              <Search className="h-4 w-4" />
              Search Properties
            </Button>
            {filteredProperties.length > 0 && (
              <Button variant="outline" onClick={handleBrowseProperties} className="flex-1 gap-2">
                Browse
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}

        {step === 'choose-property' && (
          <Button variant="outline" onClick={() => setStep('where-when')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>
    </>
  );

  const getTitle = () => step === 'where-when' ? 'Find Your Perfect Stay' : 'Choose Your Property';

  // Step indicator — 2 simple dots
  const StepIndicator = () => (
    <div className="flex items-center gap-2 pt-2">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full transition-colors',
            s <= stepNumber ? 'bg-primary' : 'bg-muted'
          )} />
          {s < totalSteps && <div className="h-0.5 w-6 bg-border" />}
        </div>
      ))}
    </div>
  );

  // Render as Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && closeBooking()}>
        <DrawerContent className="max-h-[90vh] focus:outline-none">
          <div className="mx-auto mt-3 mb-2 flex flex-col items-center gap-1">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>
          
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="font-serif text-xl">{getTitle()}</DrawerTitle>
            <StepIndicator />
          </DrawerHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="px-4 py-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
              {renderContent()}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeBooking()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{getTitle()}</DialogTitle>
          <StepIndicator />
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          renderContent()
        )}
      </DialogContent>
    </Dialog>
  );
}
