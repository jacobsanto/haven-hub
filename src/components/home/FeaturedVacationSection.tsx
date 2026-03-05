import { motion } from 'framer-motion';
import { Palmtree, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';

export function FeaturedVacationSection() {
  const { data: properties, isLoading } = useFeaturedProperties();
  const { format } = useFormatCurrency();

  const featured = properties?.slice(0, 3);

  if (!isLoading && (!featured || featured.length === 0)) return null;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
          >
            <div className="flex items-center gap-2 mb-3">
              <Palmtree className="w-5 h-5 text-accent" />
              <span className="text-accent text-sm font-medium uppercase tracking-widest">Featured Vacations</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight max-w-md">
              Exceptional Properties for Your Next Escape
            </h2>
          </motion.div>
          <Link
            to="/properties"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-foreground transition-colors"
          >
            See All Vacations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured!.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/properties/${property.slug}`} className="block group">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5]">
                    <img
                      src={property.hero_image_url || '/placeholder.svg'}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="flex items-center gap-1.5 text-white/80 text-xs mb-2">
                        <MapPin className="w-3 h-3" />
                        {property.city}, {property.country}
                      </div>
                      <h3 className="text-white font-serif text-xl font-medium mb-2">
                        {property.display_name || property.name}
                      </h3>
                      <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
                        Starting from {format(property.base_price)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
