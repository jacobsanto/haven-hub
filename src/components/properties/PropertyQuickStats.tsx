import { Users, Bed, Bath, Home } from 'lucide-react';
import { Property } from '@/types/database';

interface PropertyQuickStatsProps {
  property: Property;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa',
  apartment: 'Apartment',
  estate: 'Estate',
  cottage: 'Cottage',
  penthouse: 'Penthouse',
};

export function PropertyQuickStats({ property }: PropertyQuickStatsProps) {
  const stats = [
    {
      icon: Home,
      value: PROPERTY_TYPE_LABELS[property.property_type] || property.property_type,
      label: 'Type',
    },
    {
      icon: Bed,
      value: property.bedrooms,
      label: property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms',
    },
    {
      icon: Bath,
      value: property.bathrooms,
      label: property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms',
    },
    {
      icon: Users,
      value: property.max_guests,
      label: 'Guests',
    },
  ];

  return (
    <div className="mt-8 mx-4 md:mx-0">
      <div className="flex flex-wrap items-center divide-x divide-border/50">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-5 py-2 first:pl-0">
            <stat.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-lg font-semibold text-accent">{stat.value}</span>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
