import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Check, MapPin, Minus, Plus, Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { AddonsSelection } from '@/components/booking/AddonsSelection';
import { GuestForm } from '@/components/booking/GuestForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCreateCheckoutHold, useReleaseCheckoutHold, generateSessionId } from '@/hooks/useCheckoutFlow';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Property, SpecialOffer } from '@/types/database';
import { SelectedAddon, BookingGuestWithCounts } from '@/types/booking-engine';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type DialogStep = 1 | 2 | 3;

interface BookingFlowDialogProps {
  property: Property;
  specialOffer?: SpecialOffer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
  initialGuests?: number;
}

function StepperDots({ currentStep }: { currentStep: DialogStep }) {
  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {[1, 2, 3].map((step) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isFuture = step > currentStep;

        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                isCompleted && 'bg-primary border-primary text-primary-foreground',
                isCurrent && 'bg-primary border-primary text-primary-foreground',
                isFuture && 'bg-background border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={cn(
                  'w-10 sm:w-16 h-0.5 mx-1',
                  step < currentStep ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PropertyCard({
  property,
  checkIn,
  checkOut,
  nights,
}: {
  property: Property;
  checkIn?: Date | null;
  checkOut?: Date | null;
  nights?: number;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl border bg-card">
      {property.hero_image_url && (
        <img
          src={property.hero_image_url}
          alt={property.name}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-serif font-medium text-sm truncate">{property.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="h-3 w-3" />
          <span>{property.city}, {property.country}</span>
        </div>
        {checkIn && checkOut && nights && nights > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {format(checkIn, 'MMM d')} – {format(checkOut, 'MMM d')} · {nights} night{nights > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

export function BookingFlowDialog({
  property,
  specialOffer,
  open,
  onOpenChange,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: BookingFlowDialogProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { formatPrice } = useCurrency();

  const [step, setStep] = useState<DialogStep>(1);
  const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests || 2);
  const [adults, setAdults] = useState(Math.min(initialGuests || 2, 2));
  const [children, setChildren] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [sessionId] = useState(generateSessionId);

  const createHold = useCreateCheckoutHold();
  const releaseHold = useReleaseCheckoutHold();
  const holdCreationPending = useRef(false);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const estimatedTotal = nights * property.base_price;
  const discountAmount = specialOffer ? (estimatedTotal * specialOffer.discount_percent) / 100 : 0;
  const estimatedFinal = estimatedTotal - discountAmount;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setCheckIn(initialCheckIn);
      setCheckOut(initialCheckOut);
      setGuests(initialGuests || 2);
      setAdults(Math.min(initialGuests || 2, 2));
      setChildren(0);
      setSelectedAddons([]);
      setHoldId(null);
      holdCreationPending.current = false;
    }
  }, [open, initialCheckIn, initialCheckOut, initialGuests]);

  // Create hold when dates are selected
  useEffect(() => {
    if (checkIn && checkOut && property.id && !holdId && !holdCreationPending.current && !createHold.isPending) {
      holdCreationPending.current = true;
      createHold.mutate(
        {
          propertyId: property.id,
          checkIn: format(checkIn, 'yyyy-MM-dd'),
          checkOut: format(checkOut, 'yyyy-MM-dd'),
          sessionId,
          ttlMinutes: 10,
        },
        {
          onSuccess: (data) => {
            setHoldId(data.id);
            holdCreationPending.current = false;
          },
          onError: () => {
            holdCreationPending.current = false;
          },
        }
      );
    }
  }, [checkIn, checkOut, property.id, holdId, sessionId, createHold.isPending]);

  const handleDateSelect = useCallback((date: Date, type: 'checkIn' | 'checkOut') => {
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(undefined);
      if (holdId) {
        releaseHold.mutate(holdId);
        setHoldId(null);
        holdCreationPending.current = false;
      }
    } else {
      setCheckOut(date);
    }
  }, [holdId, releaseHold]);

  const handleNextFromDates = () => {
    if (!checkIn || !checkOut || nights < 2) {
      toast({ title: 'Please select dates', description: 'Minimum 2 nights required.', variant: 'destructive' });
      return;
    }
    setStep(2);
  };

  const handleNextFromGuests = () => {
    setStep(3);
  };

  const handleGuestFormSubmit = (data: BookingGuestWithCounts & { marketingConsent: boolean; termsAccepted: boolean }) => {
    // Store checkout state in sessionStorage
    sessionStorage.setItem('haven-hub-checkout-state', JSON.stringify({
      guestInfo: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        country: data.country,
        specialRequests: data.specialRequests,
      },
      selectedAddons: selectedAddons.map(sa => ({
        addon: sa.addon,
        quantity: sa.quantity,
        calculatedPrice: sa.calculatedPrice,
      })),
      adults: data.adults,
      children: data.children,
      holdId,
      sessionId,
    }));

    const params = new URLSearchParams({
      property: property.slug,
      checkIn: format(checkIn!, 'yyyy-MM-dd'),
      checkOut: format(checkOut!, 'yyyy-MM-dd'),
      guests: String(data.adults + data.children),
    });

    onOpenChange(false);
    navigate(`/checkout?${params.toString()}`);
  };

  const content = (
    <div className="flex flex-col max-h-[85vh] sm:max-h-[80vh]">
      <StepperDots currentStep={step} />

      <div className="px-5 pb-2">
        <PropertyCard
          property={property}
          checkIn={step >= 2 ? checkIn : undefined}
          checkOut={step >= 2 ? checkOut : undefined}
          nights={step >= 2 ? nights : undefined}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {/* Step 1: Select Your Dates */}
        {step === 1 && (
          <div className="space-y-4 mt-4">
            <h2 className="font-serif text-xl font-medium">Select Your Dates</h2>

            <AvailabilityCalendar
              propertyId={property.id}
              selectedCheckIn={checkIn}
              selectedCheckOut={checkOut}
              onDateSelect={handleDateSelect}
              minStay={2}
              variant="compact"
              showPrices={false}
            />

            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Check-in</div>
                <div className="text-sm font-medium mt-0.5">
                  {checkIn ? format(checkIn, 'MMM d') : '—'}
                </div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Check-out</div>
                <div className="text-sm font-medium mt-0.5">
                  {checkOut ? format(checkOut, 'MMM d') : '—'}
                </div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Duration</div>
                <div className="text-sm font-medium mt-0.5">
                  {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : '—'}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleNextFromDates}
                disabled={!checkIn || !checkOut || nights < 2}
              >
                Next: Guests
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Number of Guests */}
        {step === 2 && (
          <div className="space-y-6 mt-4">
            <div className="text-center">
              <h2 className="font-serif text-xl font-medium">How many guests?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Maximum {property.max_guests} guests
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 py-6">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => {
                  const newGuests = Math.max(1, guests - 1);
                  setGuests(newGuests);
                  setAdults(Math.min(adults, newGuests));
                }}
                disabled={guests <= 1}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <div className="text-4xl font-serif font-semibold">{guests}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  guest{guests !== 1 ? 's' : ''}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setGuests(Math.min(property.max_guests, guests + 1))}
                disabled={guests >= property.max_guests}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Estimated total */}
            {nights > 0 && (
              <div className="bg-secondary/50 rounded-xl p-4 text-center space-y-1">
                <div className="text-sm text-muted-foreground">Estimated Total</div>
                <div className="text-2xl font-serif font-semibold">
                  {formatPrice(estimatedFinal).display}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatPrice(property.base_price).display} × {nights} nights
                  {specialOffer && ` · ${specialOffer.discount_percent}% off`}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1" onClick={handleNextFromGuests}>
                Continue to Book
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Enhance Your Stay + Guest Info */}
        {step === 3 && (
          <div className="space-y-6 mt-4">
            <div>
              <h2 className="font-serif text-xl font-medium">Enhance Your Stay</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add extras and fill in your details.
              </p>
            </div>

            <AddonsSelection
              propertyId={property.id}
              nights={nights}
              guests={guests}
              selectedAddons={selectedAddons}
              onAddonsChange={setSelectedAddons}
            />

            <GuestForm
              hidePreferences
              onSubmit={handleGuestFormSubmit}
              defaultValues={{
                adults,
                children,
              }}
              maxGuests={property.max_guests}
              initialGuests={guests}
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button className="flex-1" type="submit" form="guest-form">
                Continue to Payment
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerTitle className="sr-only">Book {property.name}</DrawerTitle>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Book {property.name}</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
