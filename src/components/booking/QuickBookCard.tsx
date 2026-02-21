import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Bed, Bath, Zap, Calendar, ArrowRight, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstantBookingBadge } from '@/components/properties/InstantBookingBadge';
import { useBooking } from '@/contexts/BookingContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import type { Property } from '@/types/database';

interface QuickBookCardProps {
  property: Property;
  index?: number;
}

export function QuickBookCard({ property, index = 0 }: QuickBookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { openBooking } = useBooking();
  const { formatPrice } = useCurrency();
  const { data: specialOffer } = useActiveSpecialOffer(property.id);

  const priceInfo = formatPrice(property.base_price);

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open unified booking dialog with this property pre-selected (direct booking mode)
    openBooking({ mode: 'direct', property });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <Link to={`/properties/${property.slug}`}>
        <div className="bg-white dark:bg-card rounded-2xl border border-[rgba(30,60,120,0.08)] overflow-hidden hover:-translate-y-[2px] hover:shadow-medium transition-[transform,box-shadow] [transition-duration:var(--duration-hover)] [transition-timing-function:var(--ease-lift)]" style={{ boxShadow: 'var(--shadow-soft)' }}>
          {/* Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={property.hero_image_url || '/placeholder.svg'}
              alt={property.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {property.instant_booking && <InstantBookingBadge size="sm" />}
              {specialOffer && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                  <Percent className="h-4 w-4" />
                  <span>{specialOffer.discount_percent}% off</span>
                </div>
              )}
            </div>

            {/* Property Type Badge */}
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3 text-xs capitalize bg-background/80 backdrop-blur-sm"
            >
              {property.property_type}
            </Badge>

            {/* Price on Image */}
            <div className="absolute bottom-3 left-3 text-white">
              <span className="text-2xl font-bold">{priceInfo.display}</span>
              <span className="text-sm opacity-80">/night</span>
            </div>

            {/* Quick Action Overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3"
                >
                  <Button
                    onClick={handleBookNow}
                    size="lg"
                    className="rounded-full gap-2"
                  >
                    {property.instant_booking ? (
                      <>
                        <Zap className="h-4 w-4" />
                        Instant Book
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        Book Now
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-serif text-lg font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {property.name}
              </h3>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
              <MapPin className="h-3.5 w-3.5" />
              <span>{property.city}, {property.country}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{property.max_guests}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-[rgba(30,60,120,0.08)]">
              <span className="text-xs text-muted-foreground">
                {property.instant_booking ? 'Instant confirmation' : 'Book direct & save'}
              </span>
              <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
