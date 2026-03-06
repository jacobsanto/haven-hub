import { useState } from 'react';
import { Search, Calendar, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export function SearchBarOverlay() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const [destination, setDestination] = useState('');

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
    <section className="relative z-10 px-4 md:px-[5%] bg-background">
      <form
        onSubmit={handleSearch}
        className="max-w-[900px] mx-auto -mt-9 relative bg-card border border-border rounded-[14px] p-1.5 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-px"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
      >
        {/* Destination */}
        <div className="p-3.5 md:border-r md:border-border">
          <p className="font-sans text-[10px] tracking-[0.12em] text-accent uppercase mb-1.5">Destination</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={14} />
            <input
              placeholder="Where to?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent border-none outline-none font-sans text-[13px] text-foreground w-full placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Check In */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="p-3.5 md:border-r md:border-border cursor-pointer">
              <p className="font-sans text-[10px] tracking-[0.12em] text-accent uppercase mb-1.5">Check In</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} />
                <span className={cn('font-sans text-[13px]', checkIn ? 'text-foreground' : 'text-muted-foreground')}>
                  {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Add date'}
                </span>
              </div>
            </div>
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
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Check Out */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="p-3.5 md:border-r md:border-border cursor-pointer">
              <p className="font-sans text-[10px] tracking-[0.12em] text-accent uppercase mb-1.5">Check Out</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} />
                <span className={cn('font-sans text-[13px]', checkOut ? 'text-foreground' : 'text-muted-foreground')}>
                  {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Add date'}
                </span>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={checkOut}
              onSelect={setCheckOut}
              disabled={(date) => date < (checkIn || new Date())}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Guests */}
        <div className="p-3.5">
          <p className="font-sans text-[10px] tracking-[0.12em] text-accent uppercase mb-1.5">Guests</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users size={14} />
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="bg-transparent border-none outline-none font-sans text-[13px] text-foreground appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                <option key={n} value={n} className="text-foreground bg-card">
                  {n} guest{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-accent border-none rounded-[10px] px-6 cursor-pointer transition-colors hover:bg-accent/80 text-accent-foreground font-sans text-[13px] font-bold tracking-[0.05em] py-3 md:py-0"
        >
          <Search size={16} /> Search
        </button>
      </form>
    </section>
  );
}
