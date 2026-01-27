import { motion } from 'framer-motion';
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
  // Group attractions by type
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
      <div className="card-organic p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
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
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-organic p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="text-primary font-medium">
                          {item.distance}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Placeholder */}
      <div className="card-organic p-4">
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
