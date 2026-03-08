
import { motion } from 'framer-motion';
import { MapPin, Users, Bed, Bath, Zap, ArrowRight, Star } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { useAmenityMap } from '@/hooks/useAmenities';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import { useBooking } from '@/contexts/BookingContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';

interface PropertyCardProps {
  property: Property;
  index?: number;
}

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
    openBooking({ mode: 'direct', property });
  };

  const getAmenityData = (slug: string) => {
    const dbAmenity = amenityMap[slug];
    if (dbAmenity) return { name: dbAmenity.name, icon: dbAmenity.icon };
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
      <div
        onClick={() => openBooking({ mode: 'direct', property })}
        className="group block cursor-pointer"
      >
        <div className="card-organic card-hover-lift overflow-hidden">
          {/* Image with accent reveal strip */}
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden relative">
              {property.hero_image_url ? (
                <img
                  src={property.hero_image_url}
                  alt={property.name}
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:-translate-y-1"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}

              {/* Instant Book overlay */}
              {property.instant_booking && (
                <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[4]">
                  <button
                    onClick={handleBookNow}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg backdrop-blur-sm scale-90 group-hover:scale-100 transition-all duration-300"
                  >
                    <Zap className="h-4 w-4 fill-current animate-pulse" />
                    Instant Book
                  </button>
                </div>
              )}

              {/* Badges - Top Left */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-[3]">
                {property.instant_booking && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium backdrop-blur-sm">
                    <Zap className="h-3 w-3 fill-current" />
                    Instant Book
                  </span>
                )}
                {activeOffer && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent-foreground rounded-full text-xs font-medium backdrop-blur-sm">
                    {activeOffer.discount_percent}% off
                  </span>
                )}
              </div>

              {/* Frosted location pill — bottom-left over image */}
              <div className="absolute bottom-4 left-4 z-[3]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-background/80 text-foreground shadow-sm">
                  <MapPin className="h-3 w-3 text-accent" />
                  {property.city}, {property.country}
                </span>
              </div>

              {/* Price Tag — bottom-right */}
              <div className="absolute bottom-4 right-4 z-[3]">
                <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                  {discountedPrice ? (
                    <>
                      <span className="line-through text-muted-foreground mr-1">{priceInfo.display}</span>
                      <span className="text-accent">{discountedPrice.display}</span>
                    </>
                  ) : (
                    priceInfo.display
                  )}{' '}
                  <span className="text-muted-foreground text-xs">/ night</span>
                </span>
              </div>
            </div>
            {/* Thin accent strip revealed on hover */}
            <div className="h-[3px] bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-primary transition-colors">
              {property.name}
            </h3>

            {/* Star rating row */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-xs font-medium text-foreground">5.0</span>
              <span className="text-xs text-muted-foreground">Excellent</span>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-accent" />
                {property.max_guests}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5 text-accent" />
                {property.bedrooms}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5 text-accent" />
                {property.bathrooms}
              </span>
            </div>

            {/* Highlights Preview */}
            {property.highlights && property.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {property.highlights.slice(0, 2).map((highlight, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
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

            {/* Amenities Preview */}
            {property.amenities.length > 0 && (!property.highlights || property.highlights.length === 0) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {property.amenities.slice(0, 3).map((slug) => {
                  const amenity = getAmenityData(slug);
                  const Icon = getIconComponent(amenity.icon);
                  return (
                    <span key={slug} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground">
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

            {/* Book Now — accent separator */}
            <div className="pt-3 border-t border-accent/20">
              <Button onClick={handleBookNow} className="w-full gap-2 group/btn" size="sm">
                Book Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
