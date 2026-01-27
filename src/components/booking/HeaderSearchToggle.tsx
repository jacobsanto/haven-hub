import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeaderSearchToggleProps {
  variant?: 'button' | 'compact';
}

export function HeaderSearchToggle({ variant = 'button' }: HeaderSearchToggleProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);
  const searchRef = useRef<HTMLDivElement>(null);

  // Hide on property detail pages where booking widget is visible
  const isPropertyPage = location.pathname.startsWith('/properties/') && location.pathname !== '/properties';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set('location', destination);
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    if (guests) params.set('guests', String(guests));
    
    navigate(`/properties?${params.toString()}`);
    setIsOpen(false);
  };

  if (isPropertyPage) return null;

  if (variant === 'button') {
    return (
      <div ref={searchRef} className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Find Your Stay</span>
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] bg-card border border-border rounded-2xl shadow-xl p-4 z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Search Properties</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {/* Destination */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Where to?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal h-10",
                          !checkIn && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "MMM d") : "Check in"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                          "justify-start text-left font-normal h-10",
                          !checkOut && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "MMM d") : "Check out"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                <div className="flex items-center gap-3 px-3 py-2 border rounded-md">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Guests</span>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                    >
                      -
                    </Button>
                    <span className="w-6 text-center font-medium">{guests}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Search Button */}
                <Button onClick={handleSearch} className="w-full rounded-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search Properties
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Compact variant for scrolled header
  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => navigate('/properties')}
      className="rounded-full gap-2"
    >
      <Search className="h-4 w-4" />
      <span>Book Now</span>
    </Button>
  );
}
