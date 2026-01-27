import {
  Wifi,
  Waves,
  Sparkles,
  Dumbbell,
  ChefHat,
  Wind,
  Flame,
  Car,
  Umbrella,
  Mountain,
  Ship,
  Flower2,
  TreeDeciduous,
  Home,
  Bath,
  Thermometer,
  PawPrint,
  Bell,
  UtensilsCrossed,
  Wine,
  Baby,
  Accessibility,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  wifi: Wifi,
  pool: Waves,
  spa: Sparkles,
  gym: Dumbbell,
  kitchen: ChefHat,
  'air-conditioning': Wind,
  heating: Flame,
  parking: Car,
  'beach-access': Umbrella,
  'mountain-view': Mountain,
  'ocean-view': Ship,
  garden: Flower2,
  terrace: TreeDeciduous,
  balcony: Home,
  fireplace: Flame,
  'hot-tub': Bath,
  sauna: Thermometer,
  'pet-friendly': PawPrint,
  laundry: Waves,
  concierge: Bell,
  'room-service': UtensilsCrossed,
  restaurant: UtensilsCrossed,
  bar: Wine,
  'kids-friendly': Baby,
  'wheelchair-accessible': Accessibility,
};

const labelMap: Record<string, string> = {
  wifi: 'WiFi',
  pool: 'Swimming Pool',
  spa: 'Spa & Wellness',
  gym: 'Fitness Center',
  kitchen: 'Full Kitchen',
  'air-conditioning': 'Air Conditioning',
  heating: 'Central Heating',
  parking: 'Free Parking',
  'beach-access': 'Beach Access',
  'mountain-view': 'Mountain View',
  'ocean-view': 'Ocean View',
  garden: 'Private Garden',
  terrace: 'Terrace',
  balcony: 'Balcony',
  fireplace: 'Fireplace',
  'hot-tub': 'Hot Tub',
  sauna: 'Sauna',
  'pet-friendly': 'Pet Friendly',
  laundry: 'Laundry',
  concierge: '24/7 Concierge',
  'room-service': 'Room Service',
  restaurant: 'On-site Restaurant',
  bar: 'Bar & Lounge',
  'kids-friendly': 'Kids Friendly',
  'wheelchair-accessible': 'Wheelchair Accessible',
};

interface AmenityListProps {
  amenities: string[];
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
}

export function AmenityList({ amenities, variant = 'grid', className }: AmenityListProps) {
  if (amenities.length === 0) return null;

  const getIcon = (amenity: string) => {
    const Icon = iconMap[amenity];
    return Icon ? <Icon className="h-5 w-5" /> : null;
  };

  const getLabel = (amenity: string) => {
    return labelMap[amenity] || amenity.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {amenities.map((amenity) => (
          <span
            key={amenity}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-secondary rounded-full text-secondary-foreground"
          >
            {getIcon(amenity)}
            {getLabel(amenity)}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <ul className={cn('space-y-3', className)}>
        {amenities.map((amenity) => (
          <li key={amenity} className="flex items-center gap-3 text-foreground">
            <span className="text-primary">{getIcon(amenity)}</span>
            <span>{getLabel(amenity)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
      {amenities.map((amenity) => (
        <div
          key={amenity}
          className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl"
        >
          <span className="text-primary">{getIcon(amenity)}</span>
          <span className="text-sm">{getLabel(amenity)}</span>
        </div>
      ))}
    </div>
  );
}
