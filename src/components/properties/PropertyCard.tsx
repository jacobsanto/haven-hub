import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Bed, Bath, Zap, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { useAmenityMap } from '@/hooks/useAmenities';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import { useBooking } from '@/contexts/BookingContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
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
  const { data: activeOffer } = useActiveSpecialOffer(property.id);
  const { openBooking } = useBooking();
  const { formatPrice } = useCurrency();

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open unified booking dialog with this property pre-selected
    openBooking({ mode: 'direct', property });
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

  const priceInfo = formatPrice(property.base_price);
  const discountedPrice = activeOffer 
    ? formatPrice(property.base_price * (1 - activeOffer.discount_percent / 100))
    : null;

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
            
            {/* Badges - Top Left */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {property.instant_booking && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium backdrop-blur-sm">
                  <Zap className="h-3 w-3 fill-current" />
                  Instant Book
                </span>
              )}
              {activeOffer && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-300 rounded-full text-xs font-medium backdrop-blur-sm">
                  {activeOffer.discount_percent}% off
                </span>
              )}
            </div>

            {/* Price Tag */}
            <div className="absolute bottom-4 left-4">
              <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                {discountedPrice ? (
                  <>
                    <span className="line-through text-muted-foreground mr-1">
                      {priceInfo.display}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      {discountedPrice.display}
                    </span>
                  </>
                ) : (
                  priceInfo.display
                )}{' '}
                <span className="text-muted-foreground text-xs">/ night</span>
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-primary transition-colors">
              {property.name}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {property.city}, {property.country}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {property.max_guests}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                {property.bedrooms}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                {property.bathrooms}
              </span>
            </div>

            {/* Highlights Preview */}
            {property.highlights && property.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {property.highlights.slice(0, 2).map((highlight, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                  >
                    {highlight}
                  </span>
                ))}
                {property.highlights.length > 2 && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                    +{property.highlights.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Amenities Preview with Icons */}
            {property.amenities.length > 0 && (!property.highlights || property.highlights.length === 0) && (
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

            {/* Book Now Button */}
            <div className="pt-3 border-t border-border">
              <Button
                onClick={handleBookNow}
                className="w-full gap-2 group/btn"
                size="sm"
              >
                Book Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
