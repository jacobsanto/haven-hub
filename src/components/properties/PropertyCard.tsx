import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';
import { Property } from '@/types/database';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  index?: number;
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
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

            {/* Amenities Preview */}
            {property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {property.amenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity}
                    className="text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground capitalize"
                  >
                    {amenity.replace('-', ' ')}
                  </span>
                ))}
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
