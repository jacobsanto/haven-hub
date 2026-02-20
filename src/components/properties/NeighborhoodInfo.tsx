import {
  UtensilsCrossed,
  Umbrella,
  Landmark,
  ShoppingBag,
  Plane,
  Bus,
  TreePine,
  MapPin,
} from 'lucide-react';
import { NearbyAttraction } from '@/types/database';
import { cn } from '@/lib/utils';

interface NeighborhoodInfoProps {
  description?: string | null;
  attractions: NearbyAttraction[];
  city: string;
  region?: string | null;
  country: string;
  className?: string;
}

const attractionIcons: Record<string, React.FC<{ className?: string }>> = {
  restaurant: UtensilsCrossed,
  beach: Umbrella,
  attraction: Landmark,
  shopping: ShoppingBag,
  airport: Plane,
  transport: Bus,
  nature: TreePine,
};

const attractionLabels: Record<string, string> = {
  restaurant: 'Dining',
  beach: 'Beach',
  attraction: 'Attraction',
  shopping: 'Shopping',
  airport: 'Airport',
  transport: 'Transport',
  nature: 'Nature',
};

export function NeighborhoodInfo({
  description,
  attractions,
  city,
  region,
  country,
  className,
}: NeighborhoodInfoProps) {
  const groupedAttractions = attractions.reduce((acc, attraction) => {
    const type = attraction.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(attraction);
    return acc;
  }, {} as Record<string, NearbyAttraction[]>);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Location Header */}
      <div className="border border-border/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <MapPin className="h-5 w-5 text-foreground/60 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium">{city}</h3>
            {region && <p className="text-muted-foreground">{region}</p>}
            <p className="text-muted-foreground">{country}</p>
          </div>
        </div>

        {description && (
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Nearby Attractions */}
      {attractions.length > 0 && (
        <div>
          <h4 className="font-medium mb-4">What's Nearby</h4>
          <div className="space-y-4">
            {Object.entries(groupedAttractions).map(([type, items]) => {
              const Icon = attractionIcons[type] || Landmark;
              const label = attractionLabels[type] || type;

              return (
                <div key={type} className="border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-foreground/60" />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-foreground font-medium">
                          {item.distance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Placeholder */}
      <div className="border border-border/50 rounded-xl p-4">
        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Map view coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
