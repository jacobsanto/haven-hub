import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export function SearchBar({ variant = 'hero', className }: SearchBarProps) {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (guests) params.set('guests', guests.toString());
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));

    navigate(`/properties?${params.toString()}`);
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 bg-card border border-border rounded-full p-2', className)}>
        <div className="flex items-center gap-2 px-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Where to?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-sm w-32"
          />
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2 px-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-sm w-12"
          />
        </div>
        <Button
          onClick={handleSearch}
          size="icon"
          className="rounded-full bg-primary text-primary-foreground"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        'bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-organic-lg',
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Location */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Destination
          </label>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <Input
              type="text"
              placeholder="Where would you like to go?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-organic border-0 bg-muted/50"
            />
          </div>
        </div>

        {/* Check In */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Check In
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal border-0 bg-muted/50 rounded-xl',
                  !checkIn && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Add date'}
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
        </div>

        {/* Check Out */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Check Out
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal border-0 bg-muted/50 rounded-xl',
                  !checkOut && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Add date'}
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

        {/* Guests & Search */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Guests
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-xl px-3 py-2">
              <Users className="h-5 w-5 text-primary" />
              <Input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
              />
              <span className="text-sm text-muted-foreground">guests</span>
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
