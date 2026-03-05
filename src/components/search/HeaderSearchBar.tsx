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
{ label: 'Infants', description: 'Under 2', key: 'infants', min: 0, max: 5 }];


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
    <div className="relative flex items-center w-full max-w-xl">
      <div
        className={cn(
          "flex items-center w-full rounded-full border border-border bg-background/80 backdrop-blur-sm shadow-sm transition-all",
          activeSegment && "ring-2 ring-primary/20"
        )}
      >
        {/* Where */}
        <Popover open={activeSegment === 'where'} onOpenChange={(open) => setActiveSegment(open ? 'where' : null)}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm rounded-l-full transition-colors hover:bg-accent/50",
                activeSegment === 'where' && "bg-accent"
              )}
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className={cn("truncate max-w-[100px]", !selectedDestination && "text-muted-foreground")}>
                {selectedDestination || 'Where'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search destinations..." />
              <CommandList>
                <CommandEmpty>No destinations found.</CommandEmpty>
                <CommandGroup>
                  {isLoading ? (
                    <div className="p-2 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    destinations?.map((dest) => (
                      <CommandItem
                        key={dest.id}
                        onSelect={() => handleSelectDestination(dest.name)}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        {dest.name}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border" />

        {/* Check In */}
        <Popover open={activeSegment === 'checkin'} onOpenChange={(open) => setActiveSegment(open ? 'checkin' : null)}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                activeSegment === 'checkin' && "bg-accent"
              )}
            >
              <span className={cn("truncate", !checkIn && "text-muted-foreground")}>
                {checkIn ? format(checkIn, 'MMM d') : 'Check in'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={handleSelectCheckIn}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border" />

        {/* Check Out */}
        <Popover open={activeSegment === 'checkout'} onOpenChange={(open) => setActiveSegment(open ? 'checkout' : null)}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                activeSegment === 'checkout' && "bg-accent"
              )}
            >
              <span className={cn("truncate", !checkOut && "text-muted-foreground")}>
                {checkOut ? format(checkOut, 'MMM d') : 'Check out'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={handleSelectCheckOut}
              disabled={(date) => date < (checkIn || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border" />

        {/* Guests */}
        <Popover open={activeSegment === 'guests'} onOpenChange={(open) => setActiveSegment(open ? 'guests' : null)}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                activeSegment === 'guests' && "bg-accent"
              )}
            >
              <span className={cn(!totalGuests && "text-muted-foreground")}>
                {totalGuests ? `${totalGuests} guest${totalGuests > 1 ? 's' : ''}` : 'Guests'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-4">
              {GUEST_CATEGORIES.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setters[cat.key](Math.max(cat.min, values[cat.key] - 1))}
                      disabled={values[cat.key] <= cat.min}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{values[cat.key]}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setters[cat.key](Math.min(cat.max, values[cat.key] + 1))}
                      disabled={values[cat.key] >= cat.max}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <Button
          variant="gold"
          size="icon"
          className="rounded-full h-9 w-9 mr-1 ml-auto flex-shrink-0"
          onClick={handleSearch}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}