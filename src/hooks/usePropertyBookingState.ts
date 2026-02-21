import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { useCreateBooking } from '@/hooks/useBookings';
import { useRealtimeAvailability } from '@/hooks/useRealtimeAvailability';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { Property, SpecialOffer } from '@/types/database';

export interface PropertyBookingState {
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  guests: number;
  nights: number;
  baseTotal: number;
  discountAmount: number;
  totalPrice: number;
  basePriceFormatted: ReturnType<ReturnType<typeof useCurrency>['formatPrice']>;
  baseTotalFormatted: ReturnType<ReturnType<typeof useCurrency>['formatPrice']>;
  discountFormatted: ReturnType<ReturnType<typeof useCurrency>['formatPrice']>;
  totalFormatted: ReturnType<ReturnType<typeof useCurrency>['formatPrice']>;
  nightlyRate: number;
  handleDateSelect: (date: Date, type: 'checkIn' | 'checkOut') => void;
  setGuests: (guests: number) => void;
  handleGuestChange: (delta: number) => void;
  handleInstantBook: () => void;
  handleRequestBooking: (guestName: string, guestEmail: string, guestPhone: string) => Promise<void>;
  createBookingPending: boolean;
  checkInOpen: boolean;
  setCheckInOpen: (open: boolean) => void;
  checkOutOpen: boolean;
  setCheckOutOpen: (open: boolean) => void;
}

export function usePropertyBookingState(
  property: Property,
  specialOffer?: SpecialOffer | null
): PropertyBookingState {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createBooking = useCreateBooking();
  const { formatPrice } = useCurrency();

  // Real-time availability subscription
  useRealtimeAvailability(property.id);

  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const baseTotal = nights * property.base_price;
  const discountAmount = specialOffer ? (baseTotal * specialOffer.discount_percent) / 100 : 0;
  const totalPrice = baseTotal - discountAmount;
  const nightlyRate = specialOffer
    ? property.base_price * (1 - specialOffer.discount_percent / 100)
    : property.base_price;

  const basePriceFormatted = formatPrice(property.base_price);
  const baseTotalFormatted = formatPrice(baseTotal);
  const discountFormatted = formatPrice(discountAmount);
  const totalFormatted = formatPrice(totalPrice);

  const handleDateSelect = useCallback((date: Date, type: 'checkIn' | 'checkOut') => {
    if (type === 'checkIn') {
      setCheckIn(date);
      setCheckOut(undefined);
      setCheckInOpen(false);
      setTimeout(() => setCheckOutOpen(true), 100);
    } else {
      setCheckOut(date);
      setCheckOutOpen(false);
    }
  }, []);

  const handleGuestChange = useCallback((delta: number) => {
    setGuests(prev => Math.max(1, Math.min(property.max_guests, prev + delta)));
  }, [property.max_guests]);

  const handleInstantBook = useCallback(() => {
    if (!checkIn || !checkOut) {
      toast({
        title: 'Please select dates',
        description: 'Choose your check-in and check-out dates.',
        variant: 'destructive',
      });
      return;
    }

    const params = new URLSearchParams({
      property: property.slug,
      guests: String(guests),
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
    });

    navigate(`/checkout?${params.toString()}`);
  }, [checkIn, checkOut, guests, property.slug, navigate, toast]);

  const handleRequestBooking = useCallback(async (
    guestName: string,
    guestEmail: string,
    guestPhone: string
  ) => {
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
          isRequest: true,
        },
      });
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  }, [checkIn, checkOut, guests, property, nights, totalPrice, createBooking, navigate, toast]);

  return {
    checkIn,
    checkOut,
    guests,
    nights,
    baseTotal,
    discountAmount,
    totalPrice,
    basePriceFormatted,
    baseTotalFormatted,
    discountFormatted,
    totalFormatted,
    nightlyRate,
    handleDateSelect,
    setGuests,
    handleGuestChange,
    handleInstantBook,
    handleRequestBooking,
    createBookingPending: createBooking.isPending,
    checkInOpen,
    setCheckInOpen,
    checkOutOpen,
    setCheckOutOpen,
  };
}
