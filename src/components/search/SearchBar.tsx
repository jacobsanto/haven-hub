import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, Calendar, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
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

  const selectedDestinationData = destinations?.find((d) => d.name === selectedDestination);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDestination) params.set('location', selectedDestination);
    if (guests) params.set('guests', guests.toString());
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));

    navigate(`/properties?${params.toString()}`);
  };

  const handleClearDestination = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDestination('');
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 bg-card border border-border rounded-full p-2', className)}>
        <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={destinationOpen}
              className="flex items-center gap-2 px-3 h-auto py-1">

              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className={cn(
                "text-sm truncate max-w-24",
                !selectedDestination && "text-muted-foreground"
              )}>
                {selectedDestination || 'All'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0 bg-card border border-border z-50" align="start">
            <Command>
              <CommandInput placeholder="Search villages..." />
              <CommandList>
                <CommandEmpty>No destinations found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => {
                      setSelectedDestination('');
                      setDestinationOpen(false);
                    }}>

                    <MapPin className="mr-2 h-4 w-4" />
                    All Destinations
                  </CommandItem>
                  {destinationsLoading ?
                  <div className="p-2 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div> :

                  destinations?.map((destination) =>
                  <CommandItem
                    key={destination.id}
                    value={destination.name}
                    onSelect={() => {
                      setSelectedDestination(destination.name);
                      setDestinationOpen(false);
                    }}>

                        <MapPin className="mr-2 h-4 w-4" />
                        {destination.name}, {destination.country}
                      </CommandItem>
                  )
                  }
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2 px-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            className="border-0 bg-transparent focus-visible:outline-none p-0 h-auto text-sm w-8" />

        </div>
        <Button
          onClick={handleSearch}
          size="icon"
          className="rounded-full bg-primary text-primary-foreground">

          <Search className="h-4 w-4" />
        </Button>
      </div>);

  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn("bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-organic-lg px-[26px] mx-[159px] my-[56px] py-[21px]",

      className
      )}>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Destination Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Destination
          </label>
          <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={destinationOpen}
                className={cn(
                  'w-full justify-between text-left font-normal border-0 bg-muted/50 rounded-xl h-11',
                  !selectedDestination && 'text-muted-foreground'
                )}>

                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="truncate">
                    {selectedDestinationData ?
                    `${selectedDestinationData.name}, ${selectedDestinationData.country}` :
                    'All Destinations'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {selectedDestination &&
                  <X
                    className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={handleClearDestination} />

                  }
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 bg-card border border-border z-50" align="start">
              <Command>
                <CommandInput placeholder="Search villages..." />
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
                    {destinationsLoading ?
                    <div className="p-2 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div> :

                    destinations?.map((destination) =>
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
                    )
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
                )}>

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
                className="pointer-events-auto" />

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
                )}>

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
                className="pointer-events-auto" />

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
              <input
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="border-0 bg-transparent focus-visible:outline-none p-0 h-auto flex-1" />

              <span className="text-sm text-muted-foreground">guests</span>
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6">

              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>);

}