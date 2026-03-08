import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Check, MapPin, Minus, Plus, Users, ArrowLeft, ArrowRight, Star, Calendar, Gift, Sparkles } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

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

const stepLabels: Record<DialogStep, { icon: typeof Calendar; label: string }> = {
  1: { icon: Calendar, label: 'Dates' },
  2: { icon: Users, label: 'Guests' },
  3: { icon: Gift, label: 'Details' },
};

function StepperBar({ currentStep }: { currentStep: DialogStep }) {
  return (
    <div className="flex items-center justify-center gap-0 py-5 px-6">
      {([1, 2, 3] as DialogStep[]).map((step) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isFuture = step > currentStep;
        const { icon: Icon, label } = stepLabels[step];

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  scale: isCurrent ? 1 : 0.9,
                  backgroundColor: isCompleted || isCurrent
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--muted))',
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  (isCompleted || isCurrent) && 'text-accent-foreground',
                  isFuture && 'text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </motion.div>
              <span className={cn(
                'text-[10px] font-medium tracking-wide uppercase',
                isCurrent ? 'text-accent' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
            {step < 3 && (
              <div className={cn(
                'w-12 sm:w-20 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300',
                step < currentStep ? 'bg-accent' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PropertySummaryCard({
  property,
  checkIn,
  checkOut,
  nights,
  estimatedTotal,
  formatPrice,
}: {
  property: Property;
  checkIn?: Date | null;
  checkOut?: Date | null;
  nights?: number;
  estimatedTotal?: number;
  formatPrice: (v: number) => { display: string };
}) {
  return (
    <div className="flex gap-3.5 p-3.5 rounded-xl border border-border/50 bg-secondary/30">
      {property.hero_image_url && (
        <img
          src={property.hero_image_url}
          alt={property.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-serif font-medium text-sm truncate text-foreground">{property.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="h-3 w-3 text-accent" />
          <span>{property.city}, {property.country}</span>
        </div>
        {checkIn && checkOut && nights && nights > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
            <Calendar className="h-3 w-3" />
            <span>{format(checkIn, 'MMM d')} – {format(checkOut, 'MMM d')}</span>
            <span className="text-accent font-medium">· {nights} night{nights > 1 ? 's' : ''}</span>
          </div>
        )}
        {estimatedTotal && estimatedTotal > 0 && (
          <p className="text-sm font-semibold text-foreground mt-1">{formatPrice(estimatedTotal).display}</p>
        )}
      </div>
    </div>
  );
}

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

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
          onSuccess: (data) => { setHoldId(data.id); holdCreationPending.current = false; },
          onError: () => { holdCreationPending.current = false; },
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

  const handleGuestFormSubmit = (data: BookingGuestWithCounts & { marketingConsent: boolean; termsAccepted: boolean }) => {
    sessionStorage.setItem('haven-hub-checkout-state', JSON.stringify({
      guestInfo: {
        firstName: data.firstName, lastName: data.lastName,
        email: data.email, phone: data.phone,
        country: data.country, specialRequests: data.specialRequests,
      },
      selectedAddons: selectedAddons.map(sa => ({
        addon: sa.addon, quantity: sa.quantity, calculatedPrice: sa.calculatedPrice,
      })),
      adults: data.adults, children: data.children, holdId, sessionId,
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
      {/* Stepper */}
      <StepperBar currentStep={step} />

      {/* Property summary card */}
      <div className="px-5 pb-3">
        <PropertySummaryCard
          property={property}
          checkIn={step >= 2 ? checkIn : undefined}
          checkOut={step >= 2 ? checkOut : undefined}
          nights={step >= 2 ? nights : undefined}
          estimatedTotal={step >= 2 ? estimatedFinal : undefined}
          formatPrice={formatPrice}
        />
      </div>

      {/* Step content with animation */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <AnimatePresence mode="wait">
          {/* Step 1: Dates */}
          {step === 1 && (
            <motion.div
              key="step-dates"
              variants={stepVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-4 mt-4"
            >
              <h2 className="font-serif text-xl font-medium text-foreground">Select Your Dates</h2>

              <AvailabilityCalendar
                propertyId={property.id}
                selectedCheckIn={checkIn}
                selectedCheckOut={checkOut}
                onDateSelect={handleDateSelect}
                minStay={2}
                variant="compact"
                showPrices={false}
              />

              {/* Summary grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Check-in', value: checkIn ? format(checkIn, 'MMM d') : '—' },
                  { label: 'Check-out', value: checkOut ? format(checkOut, 'MMM d') : '—' },
                  { label: 'Duration', value: nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : '—' },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/50 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</div>
                    <div className="text-sm font-medium mt-0.5 text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleNextFromDates}
                  disabled={!checkIn || !checkOut || nights < 2}
                >
                  Next: Guests
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Guests */}
          {step === 2 && (
            <motion.div
              key="step-guests"
              variants={stepVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6 mt-4"
            >
              <div className="text-center">
                <h2 className="font-serif text-xl font-medium text-foreground">How many guests?</h2>
                <p className="text-sm text-muted-foreground mt-1">Maximum {property.max_guests} guests</p>
              </div>

              <div className="flex items-center justify-center gap-6 py-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 hover:border-accent"
                  onClick={() => {
                    const newGuests = Math.max(1, guests - 1);
                    setGuests(newGuests);
                    setAdults(Math.min(adults, newGuests));
                  }}
                  disabled={guests <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <motion.div
                  key={guests}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="text-5xl font-serif font-semibold text-foreground">{guests}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    guest{guests !== 1 ? 's' : ''}
                  </div>
                </motion.div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 hover:border-accent"
                  onClick={() => setGuests(Math.min(property.max_guests, guests + 1))}
                  disabled={guests >= property.max_guests}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {/* Estimated total */}
              {nights > 0 && (
                <div className="bg-secondary/50 rounded-xl p-5 text-center space-y-1.5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Estimated Total</div>
                  <div className="text-3xl font-serif font-semibold text-foreground">
                    {formatPrice(estimatedFinal).display}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(property.base_price).display} × {nights} nights
                    {specialOffer && (
                      <span className="text-accent ml-1">· {specialOffer.discount_percent}% off</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                  Continue to Book
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Addons + Guest Details */}
          {step === 3 && (
            <motion.div
              key="step-details"
              variants={stepVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6 mt-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-serif text-xl font-medium text-foreground">Enhance Your Stay</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Add extras and fill in your details.</p>
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
                defaultValues={{ adults, children }}
                maxGuests={property.max_guests}
                initialGuests={guests}
              />

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1 gap-2" type="submit" form="guest-form">
                  Continue to Payment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
