import { X, Lock, Unlock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBulkUpdateAvailability } from '@/hooks/useAvailability';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsBarProps {
  propertyId: string;
  selectedDates: Set<string>;
  onClearSelection: () => void;
  bookedDates: Set<string>;
}

export function BulkActionsBar({
  propertyId,
  selectedDates,
  onClearSelection,
  bookedDates,
}: BulkActionsBarProps) {
  const bulkUpdate = useBulkUpdateAvailability();
  const { toast } = useToast();

  // Filter out booked dates from selection (they can't be modified)
  const modifiableDates = Array.from(selectedDates).filter(
    (date) => !bookedDates.has(date)
  );

  const handleBlock = async () => {
    if (modifiableDates.length === 0) {
      toast({
        title: 'No Dates to Block',
        description: 'Selected dates are already booked or blocked.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await bulkUpdate.mutateAsync({
        propertyId,
        dates: modifiableDates,
        available: false,
      });
      toast({
        title: 'Dates Blocked',
        description: `${modifiableDates.length} date(s) have been blocked.`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to block dates.',
        variant: 'destructive',
      });
    }
  };

  const handleUnblock = async () => {
    if (modifiableDates.length === 0) {
      toast({
        title: 'No Dates to Unblock',
        description: 'Selected dates cannot be unblocked.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await bulkUpdate.mutateAsync({
        propertyId,
        dates: modifiableDates,
        available: true,
      });
      toast({
        title: 'Dates Unblocked',
        description: `${modifiableDates.length} date(s) have been unblocked.`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unblock dates.',
        variant: 'destructive',
      });
    }
  };

  if (selectedDates.size === 0) return null;

  const skippedCount = selectedDates.size - modifiableDates.length;

  return (
    <div className="card-organic p-4 bg-primary/5 border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {selectedDates.size} date{selectedDates.size !== 1 ? 's' : ''} selected
          </span>
          {skippedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({skippedCount} booked - cannot modify)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBlock}
            disabled={bulkUpdate.isPending || modifiableDates.length === 0}
          >
            <Lock className="h-3 w-3 mr-1" />
            Block Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnblock}
            disabled={bulkUpdate.isPending || modifiableDates.length === 0}
          >
            <Unlock className="h-3 w-3 mr-1" />
            Unblock Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={bulkUpdate.isPending}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
