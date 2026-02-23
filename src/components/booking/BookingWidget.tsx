import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Users, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { BookingFlowDialog } from '@/components/booking/BookingFlowDialog';
import { useCreateBooking } from '@/hooks/useBookings';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Property, SpecialOffer } from '@/types/database';
import { cn } from '@/lib/utils';

interface BookingWidgetProps {
  property: Property;
  specialOffer?: SpecialOffer | null;
  initialCheckIn?: Date;
  initialCheckOut?: Date;
  initialGuests?: number;
}

export function BookingWidget({ property, specialOffer, initialCheckIn, initialCheckOut, initialGuests }: BookingWidgetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const { formatPrice, selectedCurrency } = useCurrency();

  // Real-time availability subscription
  useRealtimeAvailability(property.id);

  const [checkIn, setCheckIn] = useState<Date | undefined>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests || 1);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Request-based flow state (only used when instant_booking is false)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [step, setStep] = useState<'dates' | 'details' | 'confirm'>('dates');

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const baseTotal = nights * property.base_price;
  const discountAmount = specialOffer ? baseTotal * specialOffer.discount_percent / 100 : 0;
  const totalPrice = baseTotal - discountAmount;

  // Format prices using currency context
  const basePriceFormatted = formatPrice(property.base_price);
  const baseTotalFormatted = formatPrice(baseTotal);
  const discountFormatted = formatPrice(discountAmount);
  const totalFormatted = formatPrice(totalPrice);

  // Handle date selection from AvailabilityCalendar
  const handleDateSelect = (date: Date, type: 'checkIn' | 'checkOut') => {
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(undefined);
      setCheckInOpen(false);
      // Auto-open checkout picker after selecting check-in
      setTimeout(() => setCheckOutOpen(true), 100);
    } else {
      setCheckOut(date);
      setCheckOutOpen(false);
    }
  };

  // Instant booking - open dialog flow
  const handleInstantBook = () => {
    setBookingDialogOpen(true);
  };

  // Request-based flow - continue through multi-step form
  const handleContinue = () => {
    if (step === 'dates') {
      if (!checkIn || !checkOut) {
        toast({
          title: 'Please select dates',
          description: 'Choose your check-in and check-out dates.',
          variant: 'destructive'
        });
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!guestName || !guestEmail) {
        toast({
          title: 'Please fill in your details',
          description: 'Name and email are required.',
          variant: 'destructive'
        });
        return;
      }
      setStep('confirm');
    }
  };

  // Request-based booking submission
  const handleRequestBooking = async () => {
    if (!checkIn || !checkOut) return;

    try {
      await createBooking.mutateAsync({
        propertyId: property.id,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        guests,
        basePrice: property.base_price
      });

      toast({
        title: 'Booking Request Submitted!',
        description: 'We will confirm your reservation shortly.'
      });

      navigate('/booking/confirm', {
        state: {
          propertyName: property.name,
          checkIn: format(checkIn, 'MMM d, yyyy'),
          checkOut: format(checkOut, 'MMM d, yyyy'),
          nights,
          totalPrice,
          isRequest: true
        }
      });
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Shared date/guest picker component with real availability
  const DateGuestPicker = () => { return null; };























































































  return (
    <div className="border border-border/50 rounded-xl p-6 space-y-6 shadow-sm lg:sticky lg:top-24">
      {/* Price Header */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-serif text-foreground">
          {basePriceFormatted.display}
        </span>
        <span className="text-sm text-muted-foreground">/night</span>
      </div>





      {/* INSTANT BOOKING FLOW */}
      {property.instant_booking ?
      <>
          <DateGuestPicker />
          
          {/* Price Breakdown */}
          {nights > 0 &&
        <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span>
                  {basePriceFormatted.display} × {nights} nights
                </span>
                <span>{baseTotalFormatted.display}</span>
              </div>
              {specialOffer && discountAmount > 0 &&
          <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>
                    {specialOffer.title} (-{specialOffer.discount_percent}%)
                  </span>
                  <span>-{discountFormatted.display}</span>
                </div>
          }
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{totalFormatted.display}</span>
              </div>
              {totalFormatted.isConverted &&
          <div className="text-xs text-muted-foreground text-right">
                  {totalFormatted.original} · You pay in EUR
                </div>
          }
            </div>
        }

          {/* Instant Book Button */}
          <Button onClick={handleInstantBook} className="w-full btn-organic">
            <Zap className="h-4 w-4" />
            Book & Pay Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment processing
          </p>
        </> : (

      /* REQUEST-BASED BOOKING FLOW */
      <>
          {step === 'dates' && <DateGuestPicker />}

          {step === 'details' &&
        <div className="space-y-4">
              <Input
            placeholder="Full Name *"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="input-organic" />

              <Input
            type="email"
            placeholder="Email Address *"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="input-organic" />

              <Input
            type="tel"
            placeholder="Phone Number (optional)"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="input-organic" />

              <Button
            variant="ghost"
            onClick={() => setStep('dates')}
            className="w-full">

                ← Back to dates
              </Button>
            </div>
        }

          {step === 'confirm' &&
        <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Check-in</span>
                  <span className="font-medium">{checkIn && format(checkIn, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Check-out</span>
                  <span className="font-medium">{checkOut && format(checkOut, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Guests</span>
                  <span className="font-medium">{guests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Guest Name</span>
                  <span className="font-medium">{guestName}</span>
                </div>
              </div>
              <Button
            variant="ghost"
            onClick={() => setStep('details')}
            className="w-full">

                ← Edit details
              </Button>
            </div>
        }

          {/* Price Breakdown */}
          {nights > 0 &&
        <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span>
                  {basePriceFormatted.display} × {nights} nights
                </span>
                <span>{baseTotalFormatted.display}</span>
              </div>
              {specialOffer && discountAmount > 0 &&
          <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>
                    {specialOffer.title} (-{specialOffer.discount_percent}%)
                  </span>
                  <span>-{discountFormatted.display}</span>
                </div>
          }
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{totalFormatted.display}</span>
              </div>
              {totalFormatted.isConverted &&
          <div className="text-xs text-muted-foreground text-right">
                  {totalFormatted.original} · You pay in EUR
                </div>
          }
            </div>
        }

          {/* Action Button */}
          {step === 'confirm' ?
        <Button
          onClick={handleRequestBooking}
          disabled={createBooking.isPending}
          className="w-full btn-organic">

              <Clock className="h-4 w-4" />
              {createBooking.isPending ? 'Submitting...' : 'Request Booking'}
            </Button> :

        <Button onClick={handleContinue} className="w-full btn-organic">
              Continue
            </Button>
        }

          <p className="text-xs text-center text-muted-foreground">
            We'll confirm availability first
          </p>
        </>)
      }

      {/* Booking Flow Dialog for instant booking */}
      <BookingFlowDialog
        property={property}
        specialOffer={specialOffer}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialGuests={guests} />

    </div>);

}