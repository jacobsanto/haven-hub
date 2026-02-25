import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, Calendar, ChevronDown, X, ArrowRight } from 'lucide-react';
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
    return;

















































































  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        'bg-card/95 backdrop-blur-sm border border-border/30 shadow-lg rounded-2xl lg:rounded-full p-3 lg:p-2',
        className
      )}>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0">
        {/* Destination */}
        <div className="flex-1 lg:px-4">
          <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-full text-left"
              >
                <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/60 mb-0.5">Destination</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className={cn("text-sm truncate", !selectedDestination && "text-muted-foreground")}>
                    {selectedDestinationData
                      ? `${selectedDestinationData.name}, ${selectedDestinationData.country}`
                      : 'All Destinations'}
                  </span>
                  {selectedDestination && (
                    <X
                      className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                      onClick={handleClearDestination}
                    />
                  )}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 bg-card border border-border z-50" align="start">
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
            </PopoverContent>
          </Popover>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 lg:border-t-0 lg:border-l lg:w-px lg:h-10 lg:border-border/60" />

        {/* Check In */}
        <div className="flex-1 lg:px-4">
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

        {/* Divider */}
        <div className="border-t border-border/40 lg:border-t-0 lg:border-l lg:w-px lg:h-10 lg:border-border/60" />

        {/* Check Out */}
        <div className="flex-1 lg:px-4">
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

        {/* Divider */}
        <div className="border-t border-border/40 lg:border-t-0 lg:border-l lg:w-px lg:h-10 lg:border-border/60" />

        {/* Guests + Search */}
        <div className="flex items-center gap-2 lg:pl-4 lg:pr-2">
          <div className="flex-1 lg:flex-initial">
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
          <Button
            onClick={handleSearch}
            variant="gold"
            size="lg"
            className="rounded-full px-6 gap-2 whitespace-nowrap"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search Villas</span>
            <ArrowRight className="h-4 w-4 hidden sm:inline" />
          </Button>
        </div>
      </div>
    </motion.div>);

}