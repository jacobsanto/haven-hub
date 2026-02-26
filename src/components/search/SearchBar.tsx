import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, Calendar, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export function SearchBar({ variant = 'hero', className }: SearchBarProps) {
  const navigate = useNavigate();
  const { data: destinations, isLoading: destinationsLoading } = useActiveDestinations();

  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const selectedDestinationData = destinations?.find((d) => d.name === selectedDestination);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDestination) params.set('location', selectedDestination);
    if (guests) params.set('guests', guests.toString());
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    setMobileSheetOpen(false);
    navigate(`/properties?${params.toString()}`);
  };

  const handleClearDestination = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDestination('');
  };

  if (variant === 'compact') {
    return null;
  }

  // Shared destination picker content
  const destinationPicker = (
    <Command>
      <CommandInput placeholder="Search destinations..." />
      <CommandList>
        <CommandEmpty>No destinations found.</CommandEmpty>
        <CommandGroup heading="Available Destinations">
          <CommandItem
            value="all-destinations"
            onSelect={() => {
              setSelectedDestination('');
              setDestinationOpen(false);
            }}>
            <MapPin className="mr-2 h-4 w-4" />
            All Destinations
          </CommandItem>
          {destinationsLoading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            destinations?.map((destination) => (
              <CommandItem
                key={destination.id}
                value={destination.name}
                onSelect={() => {
                  setSelectedDestination(destination.name);
                  setDestinationOpen(false);
                }}>
                <MapPin className="mr-2 h-4 w-4" />
                <span className="flex-1">{destination.name}, {destination.country}</span>
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  // Mobile search fields rendered inside the sheet
  const mobileSearchFields = (
    <div className="flex flex-col gap-4 p-1">
      {/* Destination */}
      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Destination</label>
        <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left">
              <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
              <span className={cn("text-sm flex-1 truncate", !selectedDestination && "text-muted-foreground")}>
                {selectedDestinationData ? `${selectedDestinationData.name}, ${selectedDestinationData.country}` : 'All Destinations'}
              </span>
              {selectedDestination && (
                <X className="h-3.5 w-3.5 text-muted-foreground" onClick={handleClearDestination} />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-3rem)] p-0 bg-card border border-border z-[60]" align="start">
            {destinationPicker}
          </PopoverContent>
        </Popover>
      </div>

      {/* Dates row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Check In</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left">
                <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                <span className={cn("text-sm", !checkIn && "text-muted-foreground")}>
                  {checkIn ? format(checkIn, 'MMM d') : 'Add date'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card z-[60]" align="start">
              <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(date) => date < new Date()} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Check Out</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left">
                <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                <span className={cn("text-sm", !checkOut && "text-muted-foreground")}>
                  {checkOut ? format(checkOut, 'MMM d') : 'Add date'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card z-[60]" align="start">
              <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(date) => date < (checkIn || new Date())} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Guests */}
      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Guests</label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
          <Users className="h-4 w-4 text-accent flex-shrink-0" />
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            className="border-0 bg-transparent focus-visible:outline-none p-0 h-auto w-12 text-sm text-foreground"
          />
          <span className="text-sm text-muted-foreground">guests</span>
        </div>
      </div>

      {/* Search Button */}
      <Button onClick={handleSearch} variant="gold" size="lg" className="rounded-full w-full gap-2 mt-1">
        <Search className="h-4 w-4" />
        Search Villas
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile: Compact pill trigger */}
      <div className={cn("lg:hidden", className)}>
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full flex items-center gap-3 bg-card/95 backdrop-blur-sm border border-border/30 shadow-lg rounded-full px-4 py-3"
            >
              <Search className="h-4 w-4 text-accent flex-shrink-0" />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">
                  {selectedDestination || 'Where to?'}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {checkIn ? format(checkIn, 'MMM d') : 'Any dates'} · {guests} guest{guests !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-8 h-8 bg-primary/90 rounded-full flex items-center justify-center text-primary-foreground flex-shrink-0">
                <Search className="h-3.5 w-3.5" />
              </div>
            </motion.button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg font-serif">Find Your Stay</SheetTitle>
            </SheetHeader>
            {mobileSearchFields}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Full inline bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          'hidden lg:block bg-card/95 backdrop-blur-sm border border-border/30 shadow-lg rounded-full p-2',
          className
        )}>

        <div className="flex items-center">
          {/* Destination */}
          <div className="flex-1 px-4">
            <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
              <PopoverTrigger asChild>
                <button className="w-full text-left">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/60 mb-0.5">Destination</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className={cn("text-sm truncate", !selectedDestination && "text-muted-foreground")}>
                      {selectedDestinationData ? `${selectedDestinationData.name}, ${selectedDestinationData.country}` : 'All Destinations'}
                    </span>
                    {selectedDestination && (
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0" onClick={handleClearDestination} />
                    )}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 bg-card border border-border z-50" align="start">
                {destinationPicker}
              </PopoverContent>
            </Popover>
          </div>

          <div className="border-l w-px h-10 border-border/60" />

          {/* Check In */}
          <div className="flex-1 px-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-left">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/60 mb-0.5">Check In</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className={cn("text-sm", !checkIn && "text-muted-foreground")}>
                      {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Add date'}
                    </span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(date) => date < new Date()} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="border-l w-px h-10 border-border/60" />

          {/* Check Out */}
          <div className="flex-1 px-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-left">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/60 mb-0.5">Check Out</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className={cn("text-sm", !checkOut && "text-muted-foreground")}>
                      {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Add date'}
                    </span>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(date) => date < (checkIn || new Date())} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="border-l w-px h-10 border-border/60" />

          {/* Guests + Search */}
          <div className="flex items-center gap-2 pl-4 pr-2">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/60 mb-0.5">Guests</div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent flex-shrink-0" />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  className="border-0 bg-transparent focus-visible:outline-none p-0 h-auto w-12 text-sm"
                />
              </div>
            </div>
            <Button onClick={handleSearch} variant="gold" size="lg" className="rounded-full px-6 gap-2 whitespace-nowrap">
              <Search className="h-4 w-4" />
              Search Villas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}