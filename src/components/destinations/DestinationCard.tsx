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
        className="group block card-organic overflow-hidden hover-lift"
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
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Featured badge */}
          {destination.is_featured && (
            <div className="absolute top-4 right-4 badge-frosted text-foreground text-xs font-medium px-3 py-1.5">
              Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>{destination.country}</span>
          </div>
          
          <h3 className="text-xl font-serif font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
            {destination.name}
          </h3>
          
          {destination.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {destination.description}
            </p>
          )}

          <div className="flex items-center gap-1 text-sm text-primary">
            <Home className="h-4 w-4" />
            <span>
              {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
