import { useBooking } from '@/contexts/BookingContext';
import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Users, Zap, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { useAmenityMap } from '@/hooks/useAmenities';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';

interface SearchResultCardProps {
  property: Property;
  index?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

const fallbackIconMap: Record<string, string> = {
  wifi: 'Wifi', pool: 'Waves', spa: 'Sparkles', gym: 'Dumbbell',
  kitchen: 'ChefHat', 'air-conditioning': 'Wind', parking: 'Car',
  'beach-access': 'Umbrella', 'ocean-view': 'Ship', garden: 'Flower2',
};

function getIconComponent(iconName: string): LucideIcon {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return IconComponent || Sparkles;
}

function buildQueryString(checkIn?: string, checkOut?: string, guests?: number): string {
  const params = new URLSearchParams();
  if (checkIn) params.set('checkIn', checkIn);
  if (checkOut) params.set('checkOut', checkOut);
  if (guests) params.set('guests', String(guests));
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function SearchResultCard({ property, index = 0, nights, checkIn, checkOut, guests }: SearchResultCardProps) {
  const amenityMap = useAmenityMap();
  const { data: activeOffer } = useActiveSpecialOffer(property.id);
  const { formatPrice } = useCurrency();
  const { openBooking } = useBooking();

  const getAmenityData = (slug: string) => {
    const dbAmenity = amenityMap[slug];
    if (dbAmenity) return { name: dbAmenity.name, icon: dbAmenity.icon };
    return {
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      icon: fallbackIconMap[slug] || 'Sparkles',
    };
  };

  const nightlyRate = activeOffer
    ? property.base_price * (1 - activeOffer.discount_percent / 100)
    : property.base_price;

  const totalPrice = nights ? nightlyRate * nights : nightlyRate;
  const priceDisplay = formatPrice(totalPrice);
  const nightlyDisplay = formatPrice(nightlyRate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <div onClick={() => openBooking({ mode: 'direct', property })} className="group block cursor-pointer">
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-shadow duration-300 flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-[280px] lg:w-[320px] flex-shrink-0 aspect-[4/3] md:aspect-auto md:min-h-[220px]">
            <img
              src={property.hero_image_url || '/placeholder.svg'}
              alt={property.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {property.instant_booking && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100/90 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-semibold backdrop-blur-sm">
                  <Zap className="h-3 w-3 fill-current" />
                  Instant Book
                </span>
              )}
              {activeOffer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100/90 dark:bg-green-900/80 text-green-700 dark:text-green-300 rounded-full text-[11px] font-semibold backdrop-blur-sm">
                  {activeOffer.discount_percent}% off
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between min-w-0">
            <div>
              {/* Title & Location */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-serif text-lg md:text-xl font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {property.name}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-xs flex-shrink-0">
                  <Bed className="h-3.5 w-3.5" />
                  <span>{property.bedrooms}</span>
                  <Bath className="h-3.5 w-3.5 ml-2" />
                  <span>{property.bathrooms}</span>
                  <Users className="h-3.5 w-3.5 ml-2" />
                  <span>{property.max_guests}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-accent text-sm mb-4">
                <MapPin className="h-3.5 w-3.5" />
                <span>{property.city}, {property.country}</span>
              </div>

              {/* Amenities */}
              {property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {property.amenities.slice(0, 4).map((slug) => {
                    const amenity = getAmenityData(slug);
                    const Icon = getIconComponent(amenity.icon);
                    return (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 bg-secondary/60 rounded-full text-secondary-foreground/80"
                      >
                        <Icon className="h-3 w-3" />
                        {amenity.name}
                      </span>
                    );
                  })}
                  {property.amenities.length > 4 && (
                    <span className="text-[11px] px-2 py-1 bg-muted/60 rounded-full text-muted-foreground">
                      +{property.amenities.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex items-end justify-between pt-3 border-t border-border/50">
              <div>
                {nights ? (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                      Total for {nights} night{nights > 1 ? 's' : ''}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-foreground">
                      {priceDisplay.display}
                      <span className="text-xs font-normal text-muted-foreground ml-1">inc. taxes</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                      From
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-foreground">
                      {nightlyDisplay.display}
                      <span className="text-xs font-normal text-muted-foreground ml-1">/ night</span>
                    </p>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5 flex-shrink-0 border-foreground/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                View Details
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
