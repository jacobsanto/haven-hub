import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { MapPin, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { useProperties } from '@/hooks/useProperties';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'property' | 'dates';

export function PropertySelectorDialog({ open, onOpenChange }: PropertySelectorDialogProps) {
  const navigate = useNavigate();
  const { data: properties, isLoading } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('property');
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);

  // Real-time availability subscription for selected property
  useRealtimeAvailability(selectedPropertyId || undefined);

  const selectedProperty = properties?.find(p => p.slug === selectedPropertySlug);
  const nights = checkIn && checkOut 
    ? differenceInDays(checkOut, checkIn) 
    : 0;

  const handleSelectProperty = (slug: string, id: string) => {
    setSelectedPropertySlug(slug);
    setSelectedPropertyId(id);
  };

  const handleNextStep = () => {
    if (step === 'property' && selectedPropertySlug) {
      setStep('dates');
    }
  };

  const handlePrevStep = () => {
    if (step === 'dates') {
      setStep('property');
    }
  };

  const handleDateSelect = (date: Date, type: 'checkIn' | 'checkOut') => {
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(undefined);
    } else {
      setCheckOut(date);
    }
  };

  const handleProceed = () => {
    if (selectedPropertySlug) {
      const params = new URLSearchParams({ property: selectedPropertySlug });
      if (checkIn) {
        params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
      }
      if (checkOut) {
        params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
      }
      onOpenChange(false);
      navigate(`/checkout?${params.toString()}`);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setStep('property');
      setSelectedPropertySlug(null);
      setSelectedPropertyId(null);
      setCheckIn(undefined);
      setCheckOut(undefined);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {step === 'property' ? 'Choose Your Property' : 'Select Your Dates'}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
              step === 'property' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
            )}>
              {step === 'dates' ? <Check className="h-3 w-3" /> : '1'}
            </div>
            <div className="h-0.5 w-8 bg-border" />
            <div className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors',
              step === 'dates' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              2
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {step === 'property' ? (
                <motion.div
                  key="property"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ScrollArea className="max-h-[50vh] pr-4">
                    <div className="space-y-3">
                      {properties?.map((property) => (
                        <button
                          key={property.id}
                          type="button"
                          onClick={() => handleSelectProperty(property.slug, property.id)}
                          className={cn(
                            'w-full flex gap-4 p-3 rounded-xl border-2 transition-all text-left',
                            selectedPropertySlug === property.slug
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          {property.hero_image_url ? (
                            <img
                              src={property.hero_image_url}
                              alt={property.name}
                              className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-24 h-20 bg-muted rounded-lg flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif font-medium truncate">{property.name}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{property.city}, {property.country}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{property.bedrooms} bed</span>
                              <span>•</span>
                              <span>{property.bathrooms} bath</span>
                              <span>•</span>
                              <span>Up to {property.max_guests} guests</span>
                            </div>
                            <div className="mt-2 text-sm font-medium text-primary">
                              From €{property.base_price}/night
                            </div>
                          </div>
                          {selectedPropertySlug === property.slug && (
                            <div className="self-center w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
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
                  {selectedPropertyId && (
                    <AvailabilityCalendar
                      propertyId={selectedPropertyId}
                      variant="compact"
                      showPrices={false}
                      selectedCheckIn={checkIn}
                      selectedCheckOut={checkOut}
                      onDateSelect={handleDateSelect}
                      minStay={2}
                    />
                  )}

                  {/* Date summary */}
                  <div className="flex items-center justify-between px-2 py-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Check-in</p>
                        <p className="font-medium text-sm">
                          {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Select date'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Check-out</p>
                        <p className="font-medium text-sm">
                          {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Select date'}
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
            </AnimatePresence>

            <div className="flex gap-3 pt-4 border-t">
              {step === 'dates' ? (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handlePrevStep}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              )}
              
              {step === 'property' ? (
                <Button
                  className="flex-1 gap-2"
                  onClick={handleNextStep}
                  disabled={!selectedPropertySlug}
                >
                  Select Dates
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="flex-1 gap-2"
                  onClick={handleProceed}
                  disabled={!checkIn}
                >
                  {checkIn && checkOut ? 'Continue to Book' : 'Skip Dates & Continue'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
