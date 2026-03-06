import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Home, ArrowRight } from 'lucide-react';
import { Destination } from '@/types/destinations';

interface DestinationCardProps {
  destination: Destination;
  propertyCount?: number;
  index?: number;
}

export function DestinationCard({ destination, propertyCount = 0, index = 0 }: DestinationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
    >
      <Link
        to={`/destinations/${destination.slug}`}
        className="group block bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_24px_60px_rgba(0,0,0,0.15)]"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {destination.hero_image_url ? (
            <img
              src={destination.hero_image_url}
              alt={destination.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <MapPin className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

          {/* Featured badge */}
          {destination.is_featured && (
            <span className="absolute top-3.5 left-3.5 text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-accent text-accent-foreground">
              Featured
            </span>
          )}

          {/* Villa count badge */}
          <div className="absolute bottom-3.5 right-3.5 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Home className="h-3 w-3 text-accent" />
              {propertyCount} {propertyCount === 1 ? 'villa' : 'villas'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-1 text-xs text-accent tracking-wide mb-2">
            <MapPin className="h-3 w-3" />
            <span>{destination.country}</span>
          </div>

          <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
            {destination.name}
          </h3>

          {destination.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
              {destination.description}
            </p>
          )}

          <span className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold tracking-wide group-hover:gap-2.5 transition-all">
            Explore <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
