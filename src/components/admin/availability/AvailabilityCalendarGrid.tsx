import { format, isBefore, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface BookingContext {
  date: string;
  guestName?: string;
  source?: string;
  bookingId?: string;
}

interface AvailabilityCalendarGridProps {
  days: Date[];
  firstDayOfMonth: number;
  blockedDates: Set<string>;
  bookingsByDate: Map<string, BookingContext>;
  onToggleDate: (date: Date) => void;
  isToggling: boolean;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityCalendarGrid({
  days,
  firstDayOfMonth,
  blockedDates,
  bookingsByDate,
  onToggleDate,
  isToggling,
}: AvailabilityCalendarGridProps) {
  const getDateStatus = (dateStr: string) => {
    const isBlocked = blockedDates.has(dateStr);
    const booking = bookingsByDate.get(dateStr);
    
    if (booking?.guestName) {
      return 'booked'; // Has guest - real booking
    }
    if (isBlocked) {
      return 'owner-block'; // Blocked without guest - PMS/owner block
    }
    return 'available';
  };

  const getDateStyles = (date: Date, dateStr: string) => {
    const isPast = isBefore(date, new Date()) && !isToday(date);
    const status = getDateStatus(dateStr);

    if (isPast) {
      return 'bg-muted text-muted-foreground cursor-not-allowed';
    }

    switch (status) {
      case 'booked':
        return 'bg-red-500/20 border-2 border-red-500 text-red-700 hover:bg-red-500/30';
      case 'owner-block':
        return 'bg-orange-500/20 border-2 border-orange-500 text-orange-700 hover:bg-orange-500/30';
      default:
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    }
  };

  const getTooltipContent = (dateStr: string, date: Date) => {
    const booking = bookingsByDate.get(dateStr);
    const status = getDateStatus(dateStr);

    if (booking?.guestName) {
      return (
        <div className="space-y-1">
          <p className="font-medium">{booking.guestName}</p>
          {booking.source && (
            <p className="text-xs text-muted-foreground">
              via {booking.source}
            </p>
          )}
        </div>
      );
    }

    if (status === 'owner-block') {
      return <p>Owner/PMS Block</p>;
    }

    return <p>Available - Click to block</p>;
  };

  return (
    <TooltipProvider>
      <div>
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isPast = isBefore(day, new Date()) && !isToday(day);

            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isPast && onToggleDate(day)}
                    disabled={isPast || isToggling}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                      getDateStyles(day, dateStr),
                      isToday(day) && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-xs">
                    <p className="font-medium mb-1">{format(day, 'EEEE, MMMM d')}</p>
                    {getTooltipContent(dateStr, day)}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
