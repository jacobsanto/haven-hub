import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminProperties } from '@/hooks/useProperties';
import { usePropertyAvailability, useToggleAvailability } from '@/hooks/useAvailability';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminAvailability() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  const { data: properties } = useAdminProperties();
  const { data: availability } = usePropertyAvailability(
    selectedPropertyId,
    format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
    format(endOfMonth(currentMonth), 'yyyy-MM-dd')
  );
  const toggleAvailability = useToggleAvailability();
  const { toast } = useToast();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const blockedDates = new Set(
    availability?.filter((a) => !a.available).map((a) => a.date) || []
  );

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToggleDate = async (date: Date) => {
    if (!selectedPropertyId) {
      toast({
        title: 'Select a Property',
        description: 'Please select a property first.',
        variant: 'destructive',
      });
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const isCurrentlyBlocked = blockedDates.has(dateStr);

    try {
      await toggleAvailability.mutateAsync({
        propertyId: selectedPropertyId,
        date: dateStr,
        available: isCurrentlyBlocked, // Toggle to opposite
      });
      toast({
        title: isCurrentlyBlocked ? 'Date Unblocked' : 'Date Blocked',
        description: `${format(date, 'MMM d, yyyy')} has been ${
          isCurrentlyBlocked ? 'made available' : 'blocked'
        }.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update availability.',
        variant: 'destructive',
      });
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-medium">Availability</h1>
              <p className="text-muted-foreground">
                Manage property availability and block dates
              </p>
            </div>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-[250px] input-organic">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar */}
          <div className="card-organic p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-serif font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-secondary" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/20 border-2 border-destructive" />
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted" />
                <span>Past</span>
              </div>
            </div>

            {!selectedPropertyId ? (
              <div className="py-12 text-center text-muted-foreground">
                Select a property to manage its availability
              </div>
            ) : (
              <>
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
                    const isBlocked = blockedDates.has(dateStr);
                    const isPast = isBefore(day, new Date()) && !isToday(day);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isPast && handleToggleDate(day)}
                        disabled={isPast || toggleAvailability.isPending}
                        className={cn(
                          'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                          isPast
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : isBlocked
                            ? 'bg-destructive/20 border-2 border-destructive text-destructive hover:bg-destructive/30'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                          isToday(day) && 'ring-2 ring-primary ring-offset-2'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="card-organic p-6 bg-secondary/30">
            <h3 className="font-medium mb-2">How to use</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Select a property from the dropdown above</li>
              <li>• Click on any date to toggle its availability</li>
              <li>• Blocked dates will not be available for booking</li>
              <li>• Past dates cannot be modified</li>
            </ul>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
