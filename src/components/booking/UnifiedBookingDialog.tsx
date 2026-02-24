import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Check, 
  Users,
  Search,
  Minus,
  Plus,
  X,
  ChevronDown
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { useProperties } from '@/hooks/useProperties';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { useCheckAvailability } from '@/hooks/useAvailability';
import { useBooking } from '@/contexts/BookingContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Property } from '@/types/database';

// Haptic feedback utility
const triggerHaptic = (pattern: 'light' | 'medium' | 'success' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], success: [10, 50, 20] };
    navigator.vibrate(patterns[pattern]);
  }
};

type Step = 'search' | 'property' | 'dates' | 'guests';

export function UnifiedBookingDialog() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { 
    isOpen, 
    closeBooking, 
    mode, 
    selectedProperty, 
    setSelectedProperty,
    dateRange,
    setDateRange,
    guests,
    setGuests,
    searchLocation,
    setSearchLocation
  } = useBooking();

  const { data: properties, isLoading } = useProperties();
  const { data: destinations, isLoading: destinationsLoading } = useActiveDestinations();
  
  // Real-time availability subscription for selected property
  useRealtimeAvailability(selectedProperty?.id);
  
  // Determine initial step based on mode
  const getInitialStep = (): Step => {
    if (mode === 'direct' && selectedProperty) return 'dates';
    return 'search';
  };

  const [step, setStep] = useState<Step>(getInitialStep);
  const [selectedDestinationName, setSelectedDestinationName] = useState(searchLocation);

  // Reset step when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep(getInitialStep());
      setSelectedDestinationName(searchLocation);
    }
  }, [isOpen, mode, selectedProperty, searchLocation]);

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

  // Check availability for selected property (optional enhancement)
  const checkInStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
  const checkOutStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
  const { data: availability } = useCheckAvailability(
    selectedProperty?.id || '', 
    checkInStr,
    checkOutStr
  );

  const nights = dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from) 
    : 0;

  const handleSelectProperty = useCallback((property: Property) => {
    triggerHaptic('medium');
    setSelectedProperty(property);
    setStep('dates');
  }, [setSelectedProperty]);

  const handleDateSelect = useCallback((range: DateRange | undefined) => {
    triggerHaptic('light');
    setDateRange(range);
  }, [setDateRange]);

  const handleGuestChange = useCallback((delta: number) => {
    triggerHaptic('light');
    const maxGuests = selectedProperty?.max_guests || 20;
    setGuests(Math.max(1, Math.min(maxGuests, guests + delta)));
  }, [guests, setGuests, selectedProperty]);

  const handleNextStep = useCallback(() => {
    triggerHaptic('light');
    if (step === 'search' && filteredProperties.length > 0) {
      setStep('property');
    } else if (step === 'property' && selectedProperty) {
      setStep('dates');
    } else if (step === 'dates' && dateRange?.from) {
      setStep('guests');
    }
  }, [step, filteredProperties, selectedProperty, dateRange]);

  const handlePrevStep = useCallback(() => {
    triggerHaptic('light');
    if (step === 'guests') {
      setStep('dates');
    } else if (step === 'dates') {
      if (mode === 'direct') {
        // Can't go back from dates in direct mode
        return;
      }
      setStep('property');
    } else if (step === 'property') {
      setStep('search');
    }
  }, [step, mode]);

  const handleProceed = useCallback(() => {
    if (!selectedProperty) return;
    
    triggerHaptic('success');
    const params = new URLSearchParams({ property: selectedProperty.slug });
    params.set('guests', String(guests));
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    
    closeBooking();
    navigate(`/checkout?${params.toString()}`);
  }, [selectedProperty, guests, dateRange, closeBooking, navigate]);

  const handleSearchProperties = useCallback(() => {
    triggerHaptic('light');
    setSearchLocation(selectedDestinationName);
    
    // Navigate to properties page with search params
    const params = new URLSearchParams();
    if (selectedDestinationName) params.set('location', selectedDestinationName);
    params.set('guests', String(guests));
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    
    closeBooking();
    navigate(`/properties?${params.toString()}`);
  }, [selectedDestinationName, guests, dateRange, setSearchLocation, closeBooking, navigate]);

  const handleSelectDestination = useCallback((destinationName: string) => {
    triggerHaptic('light');
    setSelectedDestinationName(destinationName);
  }, []);

  // Get step info for progress indicator
  const getStepNumber = () => {
    if (mode === 'direct') {
      if (step === 'dates') return 1;
      if (step === 'guests') return 2;
    }
    if (step === 'search') return 1;
    if (step === 'property') return 2;
    if (step === 'dates') return 3;
    if (step === 'guests') return 4;
    return 1;
  };

  const totalSteps = mode === 'direct' ? 2 : 4;

  const renderContent = () => (
    <>
      <AnimatePresence mode="wait">
        {/* Search Step - General search mode only */}
        {step === 'search' && mode === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Destination Dropdown */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Where are you going?</p>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left bg-card"
                  >
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className={cn(
                      "text-sm flex-1",
                      selectedDestinationName ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {selectedDestinationName || 'All Destinations'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card border border-border z-[60]" align="start">
                  <Command>
                    <CommandInput placeholder="Search destinations..." />
                    <CommandList>
                      <CommandEmpty>No destinations found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-destinations"
                          onSelect={() => handleSelectDestination('')}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          All Destinations
                          {!selectedDestinationName && <Check className="ml-auto h-4 w-4 text-primary" />}
                        </CommandItem>
                        {destinationsLoading ? (
                          <div className="p-2 space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                          </div>
                        ) : (
                          destinations?.map((d) => (
                            <CommandItem
                              key={d.id}
                              value={d.name}
                              onSelect={() => handleSelectDestination(d.name)}
                            >
                              <MapPin className="mr-2 h-4 w-4" />
                              {d.name}, {d.country}
                              {selectedDestinationName === d.name && <Check className="ml-auto h-4 w-4 text-primary" />}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

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

            {/* Summary */}
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

        {/* Property Selection Step */}
        {step === 'property' && (
          <motion.div
            key="property"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ScrollArea className={isMobile ? "h-[50vh]" : "h-[40vh]"}>
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
                      onClick={() => handleSelectProperty(property)}
                      className={cn(
                        'w-full flex gap-4 p-3 rounded-xl border-2 transition-all text-left',
                        selectedProperty?.id === property.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
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
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{property.bedrooms} bed</span>
                          <span>•</span>
                          <span>{property.max_guests} guests</span>
                        </div>
                        <div className="mt-1 text-sm font-medium text-primary">
                          From €{property.base_price}/night
                        </div>
                      </div>
                      {selectedProperty?.id === property.id && (
                        <div className="self-center w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Date Selection Step - with real availability */}
        {step === 'dates' && (
          <motion.div
            key="dates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Selected property summary */}
            {selectedProperty && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                {selectedProperty.hero_image_url ? (
                  <img
                    src={selectedProperty.hero_image_url}
                    alt={selectedProperty.name}
                    className="w-16 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-12 bg-muted rounded-lg" />
                )}
                <div>
                  <h4 className="font-serif font-medium text-sm">{selectedProperty.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedProperty.city}, {selectedProperty.country}</p>
                </div>
              </div>
            )}

            {/* Real-time availability calendar */}
            {selectedProperty ? (
              <AvailabilityCalendar
                propertyId={selectedProperty.id}
                variant="compact"
                showPrices={false}
                selectedCheckIn={dateRange?.from}
                selectedCheckOut={dateRange?.to}
                onDateSelect={(date, type) => {
                  if (type === 'checkIn') {
                    handleDateSelect({ from: date, to: undefined });
                  } else {
                    handleDateSelect({ from: dateRange?.from, to: date });
                  }
                }}
                minStay={2}
              />
            ) : (
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
            )}

            {/* Date summary */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Check-in</p>
                  <p className="font-medium text-sm">
                    {dateRange?.from ? format(dateRange.from, 'MMM d, yyyy') : 'Select date'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Check-out</p>
                  <p className="font-medium text-sm">
                    {dateRange?.to ? format(dateRange.to, 'MMM d, yyyy') : 'Select date'}
                  </p>
                </div>
              </div>
              {nights > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium text-sm text-primary">{nights} night{nights > 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Guest Selection Step */}
        {step === 'guests' && (
          <motion.div
            key="guests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Summary */}
            {selectedProperty && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                {selectedProperty.hero_image_url ? (
                  <img
                    src={selectedProperty.hero_image_url}
                    alt={selectedProperty.name}
                    className="w-16 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-12 bg-muted rounded-lg" />
                )}
                <div className="flex-1">
                  <h4 className="font-serif font-medium text-sm">{selectedProperty.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {dateRange?.from && dateRange?.to && (
                      <>
                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')} · {nights} night{nights > 1 ? 's' : ''}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Guest selector */}
            <div className="p-6 bg-muted/30 rounded-2xl space-y-4">
              <div className="text-center">
                <h3 className="font-serif text-lg font-medium">How many guests?</h3>
                <p className="text-sm text-muted-foreground">
                  Maximum {selectedProperty?.max_guests || 20} guests
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => handleGuestChange(-1)}
                  disabled={guests <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="text-4xl font-bold w-16 text-center">{guests}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => handleGuestChange(1)}
                  disabled={guests >= (selectedProperty?.max_guests || 20)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Price estimate */}
            {selectedProperty && nights > 0 && (
              <div className="p-4 bg-primary/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated total</span>
                  <span className="text-xl font-bold">
                    €{(selectedProperty.base_price * nights).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  €{selectedProperty.base_price}/night × {nights} nights
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="flex gap-3 pt-4 border-t mt-4">
        {step !== 'search' && step !== 'dates' && (
          <Button variant="outline" onClick={handlePrevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        {step === 'dates' && mode === 'search' && (
          <Button variant="outline" onClick={handlePrevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        
        {step === 'search' && (
          <>
            <Button variant="outline" onClick={closeBooking} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSearchProperties} 
              className="flex-1 gap-2"
              disabled={!dateRange?.from}
            >
              <Search className="h-4 w-4" />
              Search All Properties
            </Button>
            {filteredProperties.length > 0 && (
              <Button onClick={handleNextStep} className="flex-1 gap-2">
                Browse Properties
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}

        {step === 'property' && (
          <Button
            onClick={() => setStep('dates')}
            disabled={!selectedProperty}
            className="flex-1 gap-2"
          >
            Select Dates
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        {step === 'dates' && (
          <>
            {mode === 'direct' && (
              <Button variant="outline" onClick={closeBooking}>
                Cancel
              </Button>
            )}
            <Button
              onClick={() => setStep('guests')}
              disabled={!dateRange?.from}
              className="flex-1 gap-2"
            >
              {dateRange?.from && dateRange?.to ? 'Select Guests' : 'Skip Dates'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {step === 'guests' && (
          <Button onClick={handleProceed} className="flex-1 gap-2">
            Continue to Book
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );

  const getTitle = () => {
    switch (step) {
      case 'search': return 'Find Your Perfect Stay';
      case 'property': return 'Choose Your Property';
      case 'dates': return 'Select Your Dates';
      case 'guests': return 'Number of Guests';
      default: return 'Book Your Stay';
    }
  };

  // Render as Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && closeBooking()}>
        <DrawerContent className="max-h-[90vh] focus:outline-none">
          <div className="mx-auto mt-3 mb-2 flex flex-col items-center gap-1">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Swipe down to close
            </span>
          </div>
          
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="font-serif text-xl">{getTitle()}</DrawerTitle>
            {/* Step indicator */}
            <div className="flex items-center gap-2 pt-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                    i + 1 < getStepNumber() ? 'bg-primary/20 text-primary' :
                    i + 1 === getStepNumber() ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {i + 1 < getStepNumber() ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  {i < totalSteps - 1 && <div className="h-0.5 w-4 bg-border" />}
                </div>
              ))}
            </div>
          </DrawerHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="px-4 py-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
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
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
                  i + 1 < getStepNumber() ? 'bg-primary/20 text-primary' :
                  i + 1 === getStepNumber() ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                )}>
                  {i + 1 < getStepNumber() ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                {i < totalSteps - 1 && <div className="h-0.5 w-8 bg-border" />}
              </div>
            ))}
          </div>
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
