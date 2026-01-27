import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAmenityMap, Amenity } from '@/hooks/useAmenities';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Fallback icon and label maps for amenities not in the database
const fallbackIconMap: Record<string, string> = {
  wifi: 'Wifi',
  pool: 'Waves',
  spa: 'Sparkles',
  gym: 'Dumbbell',
  kitchen: 'ChefHat',
  'air-conditioning': 'Wind',
  heating: 'Flame',
  parking: 'Car',
  'beach-access': 'Umbrella',
  'mountain-view': 'Mountain',
  'ocean-view': 'Ship',
  garden: 'Flower2',
  terrace: 'TreeDeciduous',
  balcony: 'Home',
  fireplace: 'Flame',
  'hot-tub': 'Bath',
  sauna: 'Thermometer',
  'pet-friendly': 'PawPrint',
  laundry: 'WashingMachine',
  concierge: 'Bell',
  'room-service': 'UtensilsCrossed',
  restaurant: 'UtensilsCrossed',
  bar: 'Wine',
  'kids-friendly': 'Baby',
  'wheelchair-accessible': 'Accessibility',
};

const fallbackLabelMap: Record<string, string> = {
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

// Helper to get icon component by name
function getIconComponent(iconName: string): LucideIcon {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return IconComponent || Sparkles;
}

interface AmenityListProps {
  amenities: string[];
  variant?: 'grid' | 'list' | 'compact';
  showDescriptions?: boolean;
  className?: string;
}

export function AmenityList({ 
  amenities, 
  variant = 'grid', 
  showDescriptions = false,
  className 
}: AmenityListProps) {
  const amenityMap = useAmenityMap();

  // Enrich amenities with database data or fallbacks
  const enrichedAmenities = useMemo(() => {
    return amenities.map((slug) => {
      const dbAmenity = amenityMap[slug];
      if (dbAmenity) {
        return {
          slug,
          name: dbAmenity.name,
          description: dbAmenity.description,
          icon: dbAmenity.icon,
          category: dbAmenity.category,
        };
      }
      // Fallback for amenities not in database
      return {
        slug,
        name: fallbackLabelMap[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: null,
        icon: fallbackIconMap[slug] || 'Sparkles',
        category: 'General',
      };
    });
  }, [amenities, amenityMap]);

  // Group by category for grid variant
  const groupedAmenities = useMemo(() => {
    if (variant !== 'grid' || !showDescriptions) return null;
    
    return enrichedAmenities.reduce((acc, amenity) => {
      const category = amenity.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(amenity);
      return acc;
    }, {} as Record<string, typeof enrichedAmenities>);
  }, [enrichedAmenities, variant, showDescriptions]);

  if (amenities.length === 0) return null;

  // Compact variant - badges with icons
  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {enrichedAmenities.map((amenity) => {
          const Icon = getIconComponent(amenity.icon);
          return (
            <Tooltip key={amenity.slug}>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-secondary rounded-full text-secondary-foreground cursor-default">
                  <Icon className="h-3.5 w-3.5" />
                  {amenity.name}
                </span>
              </TooltipTrigger>
              {amenity.description && (
                <TooltipContent side="top" className="max-w-xs bg-popover">
                  <p className="text-sm">{amenity.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // List variant - vertical list with icons
  if (variant === 'list') {
    return (
      <ul className={cn('space-y-3', className)}>
        {enrichedAmenities.map((amenity) => {
          const Icon = getIconComponent(amenity.icon);
          return (
            <li key={amenity.slug} className="flex items-start gap-3 text-foreground">
              <span className="text-primary mt-0.5">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <span className="font-medium">{amenity.name}</span>
                {showDescriptions && amenity.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {amenity.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  // Grid variant - with optional category grouping
  if (groupedAmenities && showDescriptions) {
    let globalIndex = 0;
    return (
      <div className={cn('space-y-6', className)}>
        {Object.entries(groupedAmenities)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryAmenities]) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                {category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryAmenities.map((amenity) => {
                  const Icon = getIconComponent(amenity.icon);
                  const currentIndex = globalIndex++;
                  return (
                    <motion.div
                      key={amenity.slug}
                      className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl transition-colors hover:bg-secondary/50"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: currentIndex * 0.03 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                    >
                      <motion.span 
                        className="text-primary mt-0.5"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{amenity.name}</p>
                        {amenity.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {amenity.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
      </div>
    );
  }

  // Default grid variant
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
      {enrichedAmenities.map((amenity, index) => {
        const Icon = getIconComponent(amenity.icon);
        return (
          <Tooltip key={amenity.slug}>
            <TooltipTrigger asChild>
              <motion.div 
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl cursor-default transition-colors hover:bg-secondary/50"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <motion.span 
                  className="text-primary"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
                <span className="text-sm">{amenity.name}</span>
              </motion.div>
            </TooltipTrigger>
            {amenity.description && (
              <TooltipContent side="top" className="max-w-xs bg-popover">
                <p className="text-sm">{amenity.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </div>
  );
}
