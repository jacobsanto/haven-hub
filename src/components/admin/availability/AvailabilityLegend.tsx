import { cn } from '@/lib/utils';

interface LegendItem {
  color: string;
  label: string;
  borderColor?: string;
}

const legendItems: LegendItem[] = [
  { color: 'bg-secondary', label: 'Available' },
  { color: 'bg-red-500/20', borderColor: 'border-red-500', label: 'Booked (Guest)' },
  { color: 'bg-orange-500/20', borderColor: 'border-orange-500', label: 'Owner Block (PMS)' },
  { color: 'bg-muted', label: 'Past Date' },
];

export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className={cn(
              'w-4 h-4 rounded',
              item.color,
              item.borderColor && `border-2 ${item.borderColor}`
            )}
          />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
