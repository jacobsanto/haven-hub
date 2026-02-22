import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { Property } from '@/types/database';

export type BookingMode = 'search' | 'direct';

interface BookingContextType {
  // Dialog state
  isOpen: boolean;
  openBooking: (options?: OpenBookingOptions) => void;
  closeBooking: () => void;
  
  // Booking mode
  mode: BookingMode;
  
  // Selected property (for direct booking)
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property | null) => void;
  
  // Date range
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  
  // Guest count
  guests: number;
  setGuests: (guests: number) => void;
  
  // Search params (for general search)
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  
  // Reset state
  reset: () => void;
}

interface OpenBookingOptions {
  mode?: BookingMode;
  property?: Property;
  dateRange?: DateRange;
  guests?: number;
  location?: string;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<BookingMode>('search');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [searchLocation, setSearchLocation] = useState('');

  const reset = useCallback(() => {
    setMode('search');
    setSelectedProperty(null);
    setDateRange(undefined);
    setGuests(2);
    setSearchLocation('');
  }, []);

  const openBooking = useCallback((options?: OpenBookingOptions) => {
    if (options?.mode) setMode(options.mode);
    if (options?.property) {
      setSelectedProperty(options.property);
      setMode('direct');
    }
    if (options?.dateRange) setDateRange(options.dateRange);
    if (options?.guests) setGuests(options.guests);
    if (options?.location) setSearchLocation(options.location);
    setIsOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setIsOpen(false);
    // Reset after animation
    setTimeout(reset, 300);
  }, [reset]);

  return (
    <BookingContext.Provider
      value={{
        isOpen,
        openBooking,
        closeBooking,
        mode,
        selectedProperty,
        setSelectedProperty,
        dateRange,
        setDateRange,
        guests,
        setGuests,
        searchLocation,
        setSearchLocation,
        reset,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
