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
  compact?: boolean;
  selectedDates?: Set<string>;
  onSelectDate?: (date: Date, shiftKey: boolean) => void;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityCalendarGrid({
  days,
  firstDayOfMonth,
  blockedDates,
  bookingsByDate,
  onToggleDate,
  isToggling,
  compact = false,
  selectedDates,
  onSelectDate,
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

  const handleClick = (date: Date, event: React.MouseEvent) => {
    const isPast = isBefore(date, new Date()) && !isToday(date);
    if (isPast) return;

    // If shift is held and we have a selection handler, trigger selection
    if (event.shiftKey && onSelectDate) {
      onSelectDate(date, true);
    } else if (onSelectDate && !event.shiftKey) {
      // Regular click with selection enabled - toggle selection
      onSelectDate(date, false);
    } else {
      // No selection handler - toggle availability
      onToggleDate(date);
    }
  };

  return (
    <TooltipProvider>
      <div>
        {/* Week Days Header */}
        <div className={cn('grid grid-cols-7 gap-1', !compact && 'gap-2')}>
          {weekDays.map((day) => (
            <div
              key={day}
              className={cn(
                'text-center font-medium text-muted-foreground',
                compact ? 'text-xs py-1' : 'text-sm py-2'
              )}
            >
              {compact ? day.charAt(0) : day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={cn('grid grid-cols-7', compact ? 'gap-1' : 'gap-2')}>
          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className={compact ? 'aspect-square' : 'aspect-square'} />
          ))}

          {/* Calendar Days */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isPast = isBefore(day, new Date()) && !isToday(day);
            const isSelected = selectedDates?.has(dateStr);

            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleClick(day, e)}
                    disabled={isPast || isToggling}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg font-medium transition-all',
                      compact ? 'text-xs' : 'text-sm',
                      getDateStyles(day, dateStr),
                      isToday(day) && 'ring-2 ring-primary ring-offset-2',
                      isSelected && 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-xs">
                    <p className="font-medium mb-1">{format(day, 'EEEE, MMMM d')}</p>
                    {getTooltipContent(dateStr, day)}
                    {onSelectDate && !isPast && (
                      <p className="text-muted-foreground mt-1 italic">
                        Shift+Click to select range
                      </p>
                    )}
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
