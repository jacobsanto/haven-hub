import { Users, Bed, Bath, Home, Maximize } from 'lucide-react';
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

  // Add area_sqm if available
  if (property.area_sqm) {
    stats.push({
      icon: Maximize,
      value: `${property.area_sqm}`,
      label: 'm²',
    });
  }

  const hasArea = !!property.area_sqm;

  return (
    <div className="relative -mt-12 z-10 mx-4 md:mx-0">
      <div className="bg-background border border-border/50 rounded-xl p-4 md:p-6">
        <div className={`grid grid-cols-2 ${hasArea ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-6 md:gap-8`}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-foreground/60 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-semibold text-foreground truncate">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
