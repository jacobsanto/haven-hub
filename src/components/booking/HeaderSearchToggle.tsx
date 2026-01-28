import { useLocation } from 'react-router-dom';
import { Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';

interface HeaderSearchToggleProps {
  variant?: 'button' | 'compact';
}

export function HeaderSearchToggle({ variant = 'button' }: HeaderSearchToggleProps) {
  const location = useLocation();
  const { openBooking } = useBooking();

  // Hide on property detail pages where booking widget is visible
  const isPropertyPage = location.pathname.startsWith('/properties/') && location.pathname !== '/properties';

  if (isPropertyPage) return null;

  const handleOpenBooking = () => {
    // Open unified booking dialog in search mode (general property search)
    openBooking({ mode: 'search' });
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenBooking}
        className="rounded-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Find Your Stay</span>
      </Button>
    );
  }

  // Compact variant
  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleOpenBooking}
      className="rounded-full gap-2"
    >
      <Calendar className="h-4 w-4" />
      <span>Book Now</span>
    </Button>
  );
}
