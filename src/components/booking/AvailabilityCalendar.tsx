import { useState, useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AvailabilityCalendarDay } from '@/types/booking-engine';
import { useAvailabilityCalendar, usePropertyTimezone } from '@/hooks/useCheckoutFlow';
import { useIsMobile } from '@/hooks/use-mobile';

interface AvailabilityCalendarProps {
  propertyId: string;
  externalPropertyId?: string;
  selectedCheckIn?: Date | null;
  selectedCheckOut?: Date | null;
  onDateSelect: (date: Date, type: 'checkIn' | 'checkOut') => void;
  minStay?: number;
  className?: string;
  /** Variant: 'full' (checkout page) or 'compact' (dialog/search) */
  variant?: 'full' | 'compact';
  /** Show prices below dates (default: true for full, false for compact) */
  showPrices?: boolean;
  /** Override the number of months shown (default: 1 on mobile, 2 on desktop) */
  numberOfMonths?: number;
}

export function AvailabilityCalendar({
  propertyId,
  externalPropertyId,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  minStay = 2,
  className,
  variant = 'full',
  showPrices,
  numberOfMonths: numberOfMonthsOverride,
}: AvailabilityCalendarProps) {
  const isMobile = useIsMobile();
  const shouldShowPrices = showPrices ?? (variant === 'full');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  // Fetch property timezone
  const { data: timezone } = usePropertyTimezone(propertyId);
  const propertyTimezone = timezone || 'Europe/Athens';

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

  // Show 1 month on mobile, 2 on desktop — unless overridden
  const monthCount = numberOfMonthsOverride ?? (isMobile ? 1 : 2);
  
  const months = useMemo(() => {
    const result = [currentMonth];
    if (monthCount > 1) {
      result.push(addMonths(currentMonth, 1));
    }
    return result;
  }, [currentMonth, monthCount]);

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

  const getDayClasses = (date: Date, propertyTimezone: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = availabilityMap.get(dateStr);
    
    // Use property timezone for "today" comparison
    const todayInPropertyTz = startOfDay(toZonedTime(new Date(), propertyTimezone));
    const isPast = isBefore(date, todayInPropertyTz);
    const isUnavailable = !dayData?.available || isPast;

    const isCheckIn = selectedCheckIn && isSameDay(date, selectedCheckIn);
    const isCheckOut = selectedCheckOut && isSameDay(date, selectedCheckOut);
    const isInRange = selectedCheckIn && selectedCheckOut && 
      date > selectedCheckIn && date < selectedCheckOut;

    return cn(
      'relative h-10 w-10 p-0 font-normal flex items-center justify-center rounded-full text-sm transition-colors duration-150',
      isToday(date) && 'ring-1 ring-primary/60',
      isUnavailable && 'text-muted-foreground/40 line-through cursor-not-allowed',
      !isUnavailable && 'hover:bg-primary/10 cursor-pointer',
      isCheckIn && 'bg-primary/90 text-primary-foreground hover:bg-primary/90',
      isCheckOut && 'bg-primary/90 text-primary-foreground hover:bg-primary/90',
      isInRange && 'bg-primary/20 rounded-none',
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
                className={getDayClasses(day, propertyTimezone)}
                disabled={!dayData?.available || isBefore(day, startOfDay(toZonedTime(new Date(), propertyTimezone)))}
              >
                <span>{format(day, 'd')}</span>
                {shouldShowPrices && dayData?.price && dayData.available && (
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
      <div className={cn(
        'bg-white dark:bg-card rounded-xl border border-[rgba(30,60,120,0.08)]',
        variant === 'compact' ? 'p-2' : 'p-6',
        className
      )}>
        <div className={cn(variant === 'compact' ? 'h-64' : 'h-80', 'flex items-center justify-center')}>
          <div className="animate-pulse text-muted-foreground">Loading availability...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white dark:bg-card rounded-xl border border-[rgba(30,60,120,0.08)]',
      variant === 'compact' ? 'p-2' : 'p-6',
      className
    )}>
      <div className={cn(
        'flex items-center justify-between',
        variant === 'compact' ? 'mb-4' : 'mb-6'
      )}>
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {/* Legend - only show for full variant */}
        {variant === 'full' && (
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
        )}
        <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className={cn('flex', variant === 'compact' ? 'gap-4' : 'gap-8')}>
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
