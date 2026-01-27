import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useCreateBooking } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { Property } from '@/types/database';
import { cn } from '@/lib/utils';

interface BookingWidgetProps {
  property: Property;
}

export function BookingWidget({ property }: BookingWidgetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createBooking = useCreateBooking();

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [step, setStep] = useState<'dates' | 'details' | 'confirm'>('dates');

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * property.base_price;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleContinue = () => {
    if (step === 'dates') {
      if (!checkIn || !checkOut) {
        toast({
          title: 'Please select dates',
          description: 'Choose your check-in and check-out dates.',
          variant: 'destructive',
        });
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!guestName || !guestEmail) {
        toast({
          title: 'Please fill in your details',
          description: 'Name and email are required.',
          variant: 'destructive',
        });
        return;
      }
      setStep('confirm');
    }
  };

  const handleBooking = async () => {
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
        basePrice: property.base_price,
      });

      toast({
        title: 'Booking Request Submitted!',
        description: 'We will confirm your reservation shortly.',
      });

      navigate('/booking/confirm', {
        state: {
          propertyName: property.name,
          checkIn: format(checkIn, 'MMM d, yyyy'),
          checkOut: format(checkOut, 'MMM d, yyyy'),
          nights,
          totalPrice,
        },
      });
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="card-organic p-6 space-y-6 lg:sticky lg:top-24">
      {/* Price Header */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-serif font-semibold">
          {formatPrice(property.base_price)}
        </span>
        <span className="text-muted-foreground">/ night</span>
      </div>

      {step === 'dates' && (
        <div className="space-y-4">
          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !checkIn && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {checkIn ? format(checkIn, 'MMM d') : 'Check in'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <CalendarComponent
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !checkOut && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {checkOut ? format(checkOut, 'MMM d') : 'Check out'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <CalendarComponent
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) => date < (checkIn || new Date())}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Guests</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setGuests(Math.max(1, guests - 1))}
              >
                -
              </Button>
              <span className="w-8 text-center">{guests}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setGuests(Math.min(property.max_guests, guests + 1))}
              >
                +
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4">
          <Input
            placeholder="Full Name *"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="input-organic"
          />
          <Input
            type="email"
            placeholder="Email Address *"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="input-organic"
          />
          <Input
            type="tel"
            placeholder="Phone Number (optional)"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="input-organic"
          />
          <Button
            variant="ghost"
            onClick={() => setStep('dates')}
            className="w-full"
          >
            ← Back to dates
          </Button>
        </div>
      )}

      {step === 'confirm' && (
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
            className="w-full"
          >
            ← Edit details
          </Button>
        </div>
      )}

      {/* Price Breakdown */}
      {nights > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span>
              {formatPrice(property.base_price)} × {nights} nights
            </span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      {step === 'confirm' ? (
        <Button
          onClick={handleBooking}
          disabled={createBooking.isPending}
          className="w-full btn-organic"
        >
          {createBooking.isPending ? 'Submitting...' : 'Request Booking'}
        </Button>
      ) : (
        <Button onClick={handleContinue} className="w-full btn-organic">
          Continue
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        You won't be charged yet. We'll confirm availability first.
      </p>
    </div>
  );
}
