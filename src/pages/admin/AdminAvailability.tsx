import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminProperties } from '@/hooks/useProperties';
import { 
  usePropertyAvailability, 
  usePropertyBookingsForCalendar,
  useAvailabilitySyncHealth,
  useToggleAvailability 
} from '@/hooks/useAvailability';
import { useRealtimeAvailabilityGlobal } from '@/hooks/useRealtimeAvailability';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AvailabilityHealthCard,
  AvailabilityLegend,
  SyncStatusBadge,
  AvailabilityCalendarGrid,
  BookingContext,
} from '@/components/admin/availability';

export default function AdminAvailability() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  const { data: properties } = useAdminProperties();
  const { data: syncHealth } = useAvailabilitySyncHealth();
  
  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  
  const { data: availability } = usePropertyAvailability(selectedPropertyId, startDate, endDate);
  const { data: bookings } = usePropertyBookingsForCalendar(selectedPropertyId, startDate, endDate);
  
  const toggleAvailability = useToggleAvailability();
  const { toast } = useToast();

  // Enable real-time updates for availability changes
  useRealtimeAvailabilityGlobal();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const blockedDates = useMemo(() => 
    new Set(availability?.filter((a) => !a.available).map((a) => a.date) || []),
    [availability]
  );

  // Build a map of dates to booking context
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingContext>();
    
    bookings?.forEach((booking) => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      
      // For each date from check-in to check-out (exclusive)
      let current = new Date(checkIn);
      while (current < checkOut) {
        const dateStr = format(current, 'yyyy-MM-dd');
        map.set(dateStr, {
          date: dateStr,
          guestName: booking.guest_name,
          source: booking.source || 'direct',
          bookingId: booking.id,
        });
        current.setDate(current.getDate() + 1);
      }
    });
    
    return map;
  }, [bookings]);

  const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();

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

  // Get sync info for selected property
  const getPropertySyncInfo = () => {
    if (!selectedPropertyId || !syncHealth?.mappings) return null;
    return syncHealth.mappings.find(m => m.property_id === selectedPropertyId);
  };

  const propertySyncInfo = getPropertySyncInfo();

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
          </div>

          {/* Health Dashboard */}
          {syncHealth && (
            <AvailabilityHealthCard
              totalProperties={syncHealth.totalProperties}
              propertiesWithSync={syncHealth.propertiesWithSync}
              propertiesWithErrors={syncHealth.propertiesWithErrors}
              lastSyncTime={syncHealth.lastSyncTime}
            />
          )}

          {/* Property Selector with Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-full sm:w-[300px] input-organic">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent className="bg-card max-h-[300px]">
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <span>{property.name}</span>
                      <Badge 
                        variant={property.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {property.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {propertySyncInfo && (
              <SyncStatusBadge
                lastSyncAt={propertySyncInfo.last_availability_sync_at}
                syncStatus={syncHealth?.lastSyncStatus as 'idle' | 'syncing' | 'error' | 'success' || 'idle'}
              />
            )}
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
            <div className="mb-6">
              <AvailabilityLegend />
            </div>

            {!selectedPropertyId ? (
              <div className="py-12 text-center text-muted-foreground">
                Select a property to manage its availability
              </div>
            ) : (
              <AvailabilityCalendarGrid
                days={days}
                firstDayOfMonth={firstDayOfMonth}
                blockedDates={blockedDates}
                bookingsByDate={bookingsByDate}
                onToggleDate={handleToggleDate}
                isToggling={toggleAvailability.isPending}
              />
            )}
          </div>

          {/* Instructions */}
          <div className="card-organic p-6 bg-secondary/30">
            <h3 className="font-medium mb-2">How to use</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Select a property from the dropdown above</li>
              <li>• <span className="inline-block w-3 h-3 rounded bg-red-500/20 border border-red-500 mr-1"></span> Red dates have guest bookings - hover to see guest name</li>
              <li>• <span className="inline-block w-3 h-3 rounded bg-orange-500/20 border border-orange-500 mr-1"></span> Orange dates are PMS/owner blocks without a booking</li>
              <li>• Click any available date to manually block it</li>
              <li>• Past dates cannot be modified</li>
            </ul>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
