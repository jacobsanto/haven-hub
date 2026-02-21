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

  return;






















































































































































































}