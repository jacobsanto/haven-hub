import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';

export function DestinationsShowcase() {
  const { data: destinations, isLoading } = useActiveDestinations();

  if (!isLoading && (!destinations || destinations.length === 0)) return null;

  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mb-14"
        >
          <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3.5">Explore</p>
          <h2 className="font-serif text-[clamp(32px,4vw,48px)] font-semibold text-foreground leading-[1.1]">
            Sun-Kissed <em className="font-normal text-accent not-italic">Destinations</em>
          </h2>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-[14px] bg-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[1200px] mx-auto">
            {destinations!.slice(0, 8).map((dest, index) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: index * 0.08 }}
              >
                <Link
                  to={`/destinations/${dest.slug}`}
                  className="block group relative rounded-[14px] overflow-hidden aspect-[3/4] cursor-pointer transition-transform duration-500 hover:-translate-y-1.5"
                >
                  <img
                    src={dest.hero_image_url || '/placeholder.svg'}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-[1.06]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="font-sans text-[11px] tracking-[0.15em] text-accent uppercase mb-1.5">
                      <MapPin size={11} className="inline mr-1 align-middle" />
                      {dest.country}
                    </p>
                    <h3 className="font-serif text-2xl font-semibold text-foreground mb-1.5">{dest.name}</h3>
                  </div>
                  {dest.is_featured && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-medium backdrop-blur-sm">
                      Featured
                    </span>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
