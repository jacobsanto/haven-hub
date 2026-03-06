import { forwardRef } from 'react';

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Bed, Bath, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import type { Property } from '@/types/database';

interface QuickBookCardProps {
  property: Property;
  index?: number;
}

export const QuickBookCard = forwardRef<HTMLDivElement, QuickBookCardProps>(function QuickBookCard({ property, index = 0 }, ref) {
  const { openBooking } = useBooking();
  const { formatPrice } = useCurrency();
  const { data: specialOffer } = useActiveSpecialOffer(property.id);

  const priceInfo = formatPrice(property.base_price);

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openBooking({ mode: 'direct', property });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group"
    >
      <div onClick={() => openBooking({ mode: 'direct', property })} className="cursor-pointer">
        <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={property.hero_image_url || '/placeholder.svg'}
              alt={property.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {specialOffer && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                {specialOffer.discount_percent}% off
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Rating + Price Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-accent font-bold text-lg">{priceInfo.display}<span className="text-xs font-normal text-muted-foreground">/night</span></span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 text-destructive" />
              <span>{property.city}, {property.country}</span>
            </div>

            {/* Name */}
            <h3 className="font-serif text-lg font-medium text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
              {property.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
              {property.description || `A beautiful ${property.property_type} in ${property.city} with ${property.bedrooms} bedrooms and stunning views.`}
            </p>

            {/* Bottom Row: Amenity Icons + CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted" title={`${property.bedrooms} Bedrooms`}>
                  <Bed className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted" title={`${property.bathrooms} Bathrooms`}>
                  <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted" title={`${property.max_guests} Guests`}>
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <Button
                onClick={handleBookNow}
                size="sm"
                className="rounded-full text-xs gap-1.5 px-4"
              >
                Start Date
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
