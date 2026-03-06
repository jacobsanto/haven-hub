import { useState } from 'react';
import { Search, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useFeaturedDestinations } from '@/hooks/useDestinations';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export function HeroSearchForm() {
  const navigate = useNavigate();
  const { data: destinations } = useFeaturedDestinations();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('location', destination);
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    if (guests) params.set('guests', String(guests));
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Search card */}
      <div className="bg-foreground/10 backdrop-blur-lg rounded-full px-2 py-1.5 border border-primary-foreground/30">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch gap-1.5">
          {/* Check In */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-primary-foreground/15 text-xs text-left focus:outline-none focus:ring-1 focus:ring-foreground/20",
                  checkIn ? "text-primary-foreground" : "text-primary-foreground/70"
                )}>
                <Calendar className="w-4 h-4 shrink-0 text-primary-foreground" />
                {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Check In'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={checkIn}
                onSelect={(date) => {
                  setCheckIn(date);
                  if (date && checkOut && date >= checkOut) setCheckOut(undefined);
                }}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          {/* Check Out */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-primary-foreground/15 text-xs text-left focus:outline-none focus:ring-1 focus:ring-foreground/20",
                  checkOut ? "text-primary-foreground" : "text-primary-foreground/70"
                )}>
                <Calendar className="w-4 h-4 shrink-0 text-primary-foreground" />
                {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Check Out'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => date < (checkIn || new Date())}
                initialFocus
                className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>

          {/* Guests */}
          <div className="flex-1 relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground" />
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-foreground/5 text-primary-foreground text-xs focus:outline-none focus:ring-1 focus:ring-foreground/20 appearance-none">
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) =>
              <option key={n} value={n} className="text-foreground bg-card">{n} Guest{n > 1 ? 's' : ''}</option>
              )}
            </select>
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-accent text-accent-foreground font-medium text-xs hover:bg-accent/90 transition-colors whitespace-nowrap">
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>
      </div>

      {/* Popular destinations pills */}
      {/* Popular destinations hidden in compact mode */}
    </div>);

}