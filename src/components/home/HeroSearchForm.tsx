import { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
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
    <div className="w-full max-w-2xl">
      {/* Search card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h3 className="text-white font-serif text-lg mb-4">Find Your Dream Destination</h3>
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Destination */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            





            
          </div>

          {/* Check In / Check Out / Guests row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Check In */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex-1 flex items-center gap-2 px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-sm text-left focus:outline-none focus:ring-2 focus:ring-white/30",
                    checkIn ? "text-white" : "text-white/50"
                  )}>
                  
                  <Calendar className="w-4 h-4 text-white/60 shrink-0" />
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
                    "flex-1 flex items-center gap-2 px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-sm text-left focus:outline-none focus:ring-2 focus:ring-white/30",
                    checkOut ? "text-white" : "text-white/50"
                  )}>
                  
                  <Calendar className="w-4 h-4 text-white/60 shrink-0" />
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
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none">
                
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) =>
                <option key={n} value={n} className="text-foreground bg-card">{n} Guest{n > 1 ? 's' : ''}</option>
                )}
              </select>
            </div>
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors">
            
            <Search className="w-4 h-4" />
            Search Properties
          </button>
        </form>
      </div>

      {/* Popular destinations pills */}
      {destinations && destinations.length > 0 &&
      <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-white/60 text-xs uppercase tracking-wider self-center mr-1">Popular:</span>
          {destinations.slice(0, 5).map((dest) =>
        <button
          key={dest.id}
          onClick={() => navigate(`/destinations/${dest.slug}`)}
          className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs hover:bg-white/20 transition-colors backdrop-blur-sm">
          
              {dest.name}
            </button>
        )}
        </div>
      }
    </div>);

}