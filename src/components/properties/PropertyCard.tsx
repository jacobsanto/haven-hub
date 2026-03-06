import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Bed, Bath, Zap, ArrowRight, Heart } from 'lucide-react';
import { Property } from '@/types/database';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import { useBooking } from '@/contexts/BookingContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';

interface PropertyCardProps {
  property: Property;
  index?: number;
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const { data: activeOffer } = useActiveSpecialOffer(property.id);
  const { openBooking } = useBooking();
  const { formatPrice } = useCurrency();

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openBooking({ mode: 'direct', property });
  };

  const priceInfo = formatPrice(property.base_price);
  const discountedPrice = activeOffer
    ? formatPrice(property.base_price * (1 - activeOffer.discount_percent / 100))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      <Link to={`/properties/${property.slug}`} className="group block">
        <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
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

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

            {/* Badges - Top Left */}
            <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
              {property.instant_booking && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/15 text-accent rounded text-[10px] font-bold tracking-[0.1em] uppercase backdrop-blur-sm">
                  <Zap className="h-3 w-3 fill-current" />
                  Instant
                </span>
              )}
              {activeOffer && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-destructive text-destructive-foreground rounded text-[10px] font-bold tracking-[0.1em] uppercase">
                  {activeOffer.discount_percent}% off
                </span>
              )}
            </div>

            {/* Heart - Top Right */}
            <button
              className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-background/20 backdrop-blur-sm border border-border/30 flex items-center justify-center text-foreground/70 hover:text-accent hover:border-accent/50 transition-all"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Heart className="h-4 w-4" />
            </button>

            {/* Price tag - Bottom */}
            <div className="absolute bottom-3.5 left-3.5">
              <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold inline-flex items-baseline gap-1.5">
                {discountedPrice ? (
                  <>
                    <span className="line-through text-muted-foreground text-xs">{priceInfo.display}</span>
                    <span className="text-accent">{discountedPrice.display}</span>
                  </>
                ) : (
                  <span className="text-foreground">{priceInfo.display}</span>
                )}
                <span className="text-muted-foreground text-xs font-normal">/ night</span>
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            {/* Location */}
            <div className="flex items-center gap-1 text-xs text-accent tracking-wide">
              <MapPin className="h-3 w-3" />
              <span>{property.city}, {property.country}</span>
            </div>

            {/* Name */}
            <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-1">
              {property.name}
            </h3>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{property.max_guests}</span>
              <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.bedrooms}</span>
              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms}</span>
            </div>

            {/* Tags */}
            {property.highlights && property.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {property.highlights.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Book CTA */}
            <div className="pt-3 border-t border-border">
              <Button
                onClick={handleBookNow}
                className="w-full gap-2 group/btn"
                size="sm"
              >
                Book Now
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
