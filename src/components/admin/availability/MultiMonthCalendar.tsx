import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { AvailabilityCalendarGrid, BookingContext } from './AvailabilityCalendarGrid';

interface MultiMonthCalendarProps {
  baseMonth: Date;
  blockedDates: Set<string>;
  bookingsByDate: Map<string, BookingContext>;
  onToggleDate: (date: Date) => void;
  isToggling: boolean;
  selectedDates?: Set<string>;
  onSelectDate?: (date: Date, shiftKey: boolean) => void;
}

export function MultiMonthCalendar({
  baseMonth,
  blockedDates,
  bookingsByDate,
  onToggleDate,
  isToggling,
  selectedDates,
  onSelectDate,
}: MultiMonthCalendarProps) {
  // Generate 3 months starting from baseMonth
  const months = [
    baseMonth,
    addMonths(baseMonth, 1),
    addMonths(baseMonth, 2),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {months.map((month) => {
        const days = eachDayOfInterval({
          start: startOfMonth(month),
          end: endOfMonth(month),
        });
        const firstDayOfMonth = startOfMonth(month).getDay();

        return (
          <div key={format(month, 'yyyy-MM')} className="card-organic p-4">
            <h3 className="text-lg font-serif font-medium mb-4 text-center">
              {format(month, 'MMMM yyyy')}
            </h3>
            <AvailabilityCalendarGrid
              days={days}
              firstDayOfMonth={firstDayOfMonth}
              blockedDates={blockedDates}
              bookingsByDate={bookingsByDate}
              onToggleDate={onToggleDate}
              isToggling={isToggling}
              compact
              selectedDates={selectedDates}
              onSelectDate={onSelectDate}
            />
          </div>
        );
      })}
    </div>
  );
}
