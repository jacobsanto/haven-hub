import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Home } from 'lucide-react';
import { Destination } from '@/types/destinations';

interface DestinationCardProps {
  destination: Destination;
  propertyCount?: number;
  index?: number;
}

export function DestinationCard({ destination, propertyCount = 0, index = 0 }: DestinationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link 
        to={`/destinations/${destination.slug}`}
        className="group block card-organic card-hover-lift overflow-hidden"
      >
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {destination.hero_image_url ? (
            <img
              src={destination.hero_image_url}
              alt={destination.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-primary/40" />
            </div>
          )}
          
          {/* Always-visible bottom gradient scrim for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
          
          {/* Featured badge */}
          {destination.is_featured && (
            <div className="absolute top-4 left-4 bg-accent/85 backdrop-blur-sm text-accent-foreground text-xs font-medium px-3 py-1 rounded-full">
              Featured
            </div>
          )}

          {/* Frosted property count badge — bottom-right over image */}
          <div className="absolute bottom-4 right-4 z-[3]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-background/80 text-foreground shadow-sm">
              <Home className="h-3 w-3 text-accent" />
              {propertyCount} {propertyCount === 1 ? 'Villa' : 'Villas'}
            </span>
          </div>

          {/* Destination name overlay on image */}
          <div className="absolute bottom-4 left-4 z-[3]">
            <p className="text-primary-foreground font-serif text-xl font-medium drop-shadow-md">
              {destination.name}
            </p>
            <div className="flex items-center gap-1 text-primary-foreground/80 text-sm mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{destination.country}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {destination.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {destination.description}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
