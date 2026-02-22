import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { cn } from '@/lib/utils';

type Segment = 'where' | 'checkin' | 'checkout' | 'guests' | null;

interface GuestCategory {
  label: string;
  description: string;
  key: 'adults' | 'children' | 'infants';
  min: number;
  max: number;
}

const GUEST_CATEGORIES: GuestCategory[] = [
  { label: 'Adults', description: 'Ages 13+', key: 'adults', min: 1, max: 16 },
  { label: 'Children', description: 'Ages 2–12', key: 'children', min: 0, max: 10 },
  { label: 'Infants', description: 'Under 2', key: 'infants', min: 0, max: 5 },
];

export function HeaderSearchBar() {
  const navigate = useNavigate();
  const { data: destinations, isLoading } = useActiveDestinations();

  const [selectedDestination, setSelectedDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [activeSegment, setActiveSegment] = useState<Segment>(null);

  const totalGuests = adults + children;
  const guestLabel = totalGuests === 1 ? '1 guest' : `${totalGuests} guests`;
  if (infants > 0) {
    // display handled inline below
  }

  const setters = { adults: setAdults, children: setChildren, infants: setInfants };
  const values = { adults, children, infants };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDestination) params.set('location', selectedDestination);
    if (totalGuests) params.set('guests', totalGuests.toString());
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    navigate(`/properties?${params.toString()}`);
  };

  const handleSelectDestination = (name: string) => {
    setSelectedDestination(name);
    setActiveSegment('checkin');
  };

  const handleSelectCheckIn = (date: Date | undefined) => {
    setCheckIn(date);
    if (date) setActiveSegment('checkout');
  };

  const handleSelectCheckOut = (date: Date | undefined) => {
    setCheckOut(date);
    if (date) setActiveSegment(null);
  };

  return (
    <div className="hidden lg:flex items-center bg-card border border-border rounded-full shadow-sm p-1">
      {/* WHERE */}
      <Popover open={activeSegment === 'where'} onOpenChange={(open) => setActiveSegment(open ? 'where' : null)}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'px-4 py-1.5 text-left transition-colors rounded-full',
              activeSegment === 'where' ? 'bg-muted' : 'hover:bg-muted/50'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Where</div>
            <div className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {selectedDestination || 'Any destination'}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0 bg-card border border-border z-[60]" align="start">
          <Command>
            <CommandInput placeholder="Search destinations..." />
            <CommandList>
              <CommandEmpty>No destinations found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-destinations"
                  onSelect={() => handleSelectDestination('')}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  All Destinations
                </CommandItem>
                {isLoading ? (
                  <div className="p-2 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  destinations?.map((d) => (
                    <CommandItem
                      key={d.id}
                      value={d.name}
                      onSelect={() => handleSelectDestination(d.name)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {d.name}, {d.country}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="w-px h-8 bg-border/50" />

      {/* CHECK IN */}
      <Popover open={activeSegment === 'checkin'} onOpenChange={(open) => setActiveSegment(open ? 'checkin' : null)}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'px-4 py-1.5 text-left transition-colors rounded-full',
              activeSegment === 'checkin' ? 'bg-muted' : 'hover:bg-muted/50'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Check in</div>
            <div className="text-sm font-medium text-foreground">
              {checkIn ? format(checkIn, 'MMM d') : 'Add date'}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card z-[60]" align="start">
          <Calendar
            mode="single"
            selected={checkIn}
            onSelect={handleSelectCheckIn}
            disabled={(date) => date < new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <div className="w-px h-8 bg-border/50" />

      {/* CHECK OUT */}
      <Popover open={activeSegment === 'checkout'} onOpenChange={(open) => setActiveSegment(open ? 'checkout' : null)}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'px-4 py-1.5 text-left transition-colors rounded-full',
              activeSegment === 'checkout' ? 'bg-muted' : 'hover:bg-muted/50'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Check out</div>
            <div className="text-sm font-medium text-foreground">
              {checkOut ? format(checkOut, 'MMM d') : 'Add date'}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card z-[60]" align="start">
          <Calendar
            mode="single"
            selected={checkOut}
            onSelect={handleSelectCheckOut}
            disabled={(date) => date < (checkIn || new Date())}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <div className="w-px h-8 bg-border/50" />

      {/* GUESTS */}
      <Popover open={activeSegment === 'guests'} onOpenChange={(open) => setActiveSegment(open ? 'guests' : null)}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'px-4 py-1.5 text-left transition-colors rounded-full',
              activeSegment === 'guests' ? 'bg-muted' : 'hover:bg-muted/50'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Guests</div>
            <div className="text-sm font-medium text-foreground">
              {guestLabel}{infants > 0 ? `, ${infants} infant${infants > 1 ? 's' : ''}` : ''}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4 bg-card z-[60]" align="end">
          <div className="space-y-4">
            {GUEST_CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">{cat.label}</div>
                  <div className="text-xs text-muted-foreground">{cat.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setters[cat.key](Math.max(cat.min, values[cat.key] - 1))}
                    disabled={values[cat.key] <= cat.min}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-medium w-4 text-center">{values[cat.key]}</span>
                  <button
                    onClick={() => setters[cat.key](Math.min(cat.max, values[cat.key] + 1))}
                    disabled={values[cat.key] >= cat.max}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              size="sm"
              className="w-full rounded-full"
              onClick={() => setActiveSegment(null)}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* SEARCH BUTTON */}
      <button
        onClick={handleSearch}
        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors ml-1 flex-shrink-0"
        aria-label="Search properties"
      >
        <Search className="h-4 w-4" />
      </button>
    </div>
  );
}
