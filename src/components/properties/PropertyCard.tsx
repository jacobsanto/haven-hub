import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { useAmenityMap } from '@/hooks/useAmenities';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  index?: number;
}

// Fallback icons for amenities not in database
const fallbackIconMap: Record<string, string> = {
  wifi: 'Wifi', pool: 'Waves', spa: 'Sparkles', gym: 'Dumbbell',
  kitchen: 'ChefHat', 'air-conditioning': 'Wind', heating: 'Flame',
  parking: 'Car', 'beach-access': 'Umbrella', 'mountain-view': 'Mountain',
  'ocean-view': 'Ship', garden: 'Flower2', terrace: 'TreeDeciduous',
  balcony: 'Home', fireplace: 'Flame', 'hot-tub': 'Bath',
  sauna: 'Thermometer', 'pet-friendly': 'PawPrint', concierge: 'Bell',
};

function getIconComponent(iconName: string): LucideIcon {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return IconComponent || Sparkles;
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const amenityMap = useAmenityMap();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get amenity data (from DB or fallback)
  const getAmenityData = (slug: string) => {
    const dbAmenity = amenityMap[slug];
    if (dbAmenity) {
      return { name: dbAmenity.name, icon: dbAmenity.icon };
    }
    return {
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      icon: fallbackIconMap[slug] || 'Sparkles',
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/properties/${property.slug}`} className="group block">
        <div className="card-organic overflow-hidden hover-lift">
          {/* Image */}
          <div className="aspect-[4/3] overflow-hidden relative">
            {property.hero_image_url ? (
              <img
                src={property.hero_image_url}
                alt={property.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            {/* Price Tag */}
            <div className="absolute bottom-4 left-4">
              <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                {formatPrice(property.base_price)}{' '}
                <span className="text-muted-foreground text-xs">/ night</span>
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-primary transition-colors">
              {property.name}
            </h3>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {property.city}, {property.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Up to {property.max_guests} guests
              </span>
            </div>

            {/* Amenities Preview with Icons */}
            {property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {property.amenities.slice(0, 3).map((slug) => {
                  const amenity = getAmenityData(slug);
                  const Icon = getIconComponent(amenity.icon);
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground"
                    >
                      <Icon className="h-3 w-3" />
                      {amenity.name}
                    </span>
                  );
                })}
                {property.amenities.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                    +{property.amenities.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
