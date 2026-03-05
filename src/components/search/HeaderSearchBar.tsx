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

  return;















































































































































































}