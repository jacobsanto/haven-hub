import {
  UtensilsCrossed,
  Umbrella,
  Landmark,
  ShoppingBag,
  Plane,
  Bus,
  TreePine,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { NearbyAttraction } from '@/types/database';
import { cn } from '@/lib/utils';

const CUSTOM_MAP_URL = 'https://www.google.com/maps/d/u/0/embed?mid=1S5lSiOv53CgAoE_ATDkpmI_h4tdoBgo&ehbc=2E312F';
const CUSTOM_MAP_LINK = 'https://www.google.com/maps/d/u/0/viewer?mid=1S5lSiOv53CgAoE_ATDkpmI_h4tdoBgo';

interface NeighborhoodInfoProps {
  description?: string | null;
  attractions: NearbyAttraction[];
  city: string;
  region?: string | null;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
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
  latitude,
  longitude,
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

      {/* Map */}
      <div className="border border-border/50 rounded-xl p-4 space-y-3">
        <div className="aspect-video rounded-lg overflow-hidden">
          {latitude && longitude ? (
            <iframe
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${city}`}
            />
          ) : (
            <iframe
              src={CUSTOM_MAP_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Properties map"
            />
          )}
        </div>
        <a
          href={CUSTOM_MAP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View full area map
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
