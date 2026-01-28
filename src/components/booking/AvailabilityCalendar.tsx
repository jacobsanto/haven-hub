import { useState, useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AvailabilityCalendarDay } from '@/types/booking-engine';
import { useAvailabilityCalendar } from '@/hooks/useCheckoutFlow';

interface AvailabilityCalendarProps {
  propertyId: string;
  externalPropertyId?: string;
  selectedCheckIn?: Date | null;
  selectedCheckOut?: Date | null;
  onDateSelect: (date: Date, type: 'checkIn' | 'checkOut') => void;
  minStay?: number;
  className?: string;
}

export function AvailabilityCalendar({
  propertyId,
  externalPropertyId,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  minStay = 2,
  className,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  // Fetch 3 months of availability
  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(addMonths(currentMonth, 2)), 'yyyy-MM-dd');

  const { data: availabilityData, isLoading } = useAvailabilityCalendar(
    propertyId,
    startDate,
    endDate,
    externalPropertyId
  );

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityCalendarDay>();
    availabilityData?.forEach(day => map.set(day.date, day));
    return map;
  }, [availabilityData]);

  const months = useMemo(() => {
    return [currentMonth, addMonths(currentMonth, 1)];
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(prev => addMonths(prev, -1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = availabilityMap.get(dateStr);

    // Don't allow selecting unavailable dates
    if (!dayData?.available || isBefore(date, startOfDay(new Date()))) {
      return;
    }

    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      // Start new selection
      onDateSelect(date, 'checkIn');
      setSelectingCheckOut(true);
    } else if (selectingCheckOut) {
      // Check if valid check-out date
      if (isBefore(date, selectedCheckIn) || isSameDay(date, selectedCheckIn)) {
        // Reset and start over with new check-in
        onDateSelect(date, 'checkIn');
      } else {
        // Check minimum stay
        const nights = Math.ceil((date.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24));
        if (nights < minStay) {
          return; // Don't allow if less than min stay
        }
        onDateSelect(date, 'checkOut');
        setSelectingCheckOut(false);
      }
    }
  };

  const getDayClasses = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = availabilityMap.get(dateStr);
    const isPast = isBefore(date, startOfDay(new Date()));
    const isUnavailable = !dayData?.available || isPast;

    const isCheckIn = selectedCheckIn && isSameDay(date, selectedCheckIn);
    const isCheckOut = selectedCheckOut && isSameDay(date, selectedCheckOut);
    const isInRange = selectedCheckIn && selectedCheckOut && 
      date > selectedCheckIn && date < selectedCheckOut;

    return cn(
      'relative h-10 w-10 p-0 font-normal flex items-center justify-center rounded-full text-sm transition-colors',
      isToday(date) && 'ring-1 ring-primary',
      isUnavailable && 'text-muted-foreground/40 line-through cursor-not-allowed',
      !isUnavailable && 'hover:bg-secondary cursor-pointer',
      isCheckIn && 'bg-primary text-primary-foreground hover:bg-primary',
      isCheckOut && 'bg-primary text-primary-foreground hover:bg-primary',
      isInRange && 'bg-secondary',
    );
  };

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();

    // Create padding for days before month starts
    const paddingDays = Array(startDay).fill(null);

    return (
      <div key={month.toISOString()} className="flex-1">
        <div className="text-center font-serif text-lg font-medium mb-4">
          {format(month, 'MMMM yyyy')}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="h-10" />
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayData = availabilityMap.get(dateStr);
            
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateClick(day)}
                className={getDayClasses(day)}
                disabled={!dayData?.available || isBefore(day, startOfDay(new Date()))}
              >
                <span>{format(day, 'd')}</span>
                {dayData?.price && dayData.available && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">
                    €{dayData.price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn('bg-card rounded-xl border p-6', className)}>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading availability...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-xl border p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-secondary" />
            <span>In Range</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-muted-foreground/20 line-through text-xs">X</span>
            <span>Unavailable</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex gap-8">
        {months.map(month => renderMonth(month))}
      </div>

      {selectedCheckIn && !selectedCheckOut && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Select check-out date (minimum {minStay} nights)
        </div>
      )}
    </div>
  );
}
