import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

export function DestinationsShowcase() {
  const { data: destinations, isLoading } = useActiveDestinations();

  if (!isLoading && (!destinations || destinations.length === 0)) return null;

  return (
    <section className="py-20 md:py-28 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="text-accent text-sm font-medium uppercase tracking-widest mb-3 block">Destinations</span>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight max-w-lg">
              Discover the World's Most <em className="text-accent not-italic">Captivating</em> Places
            </h2>
          </div>
          <Link
            to="/destinations"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-foreground transition-colors"
          >
            View All Destinations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : (
          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {destinations!.map((dest, index) => (
                <CarouselItem key={dest.id} className="pl-4 md:basis-1/3 lg:basis-1/4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Link to={`/destinations/${dest.slug}`} className="block group">
                      <div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
                        <img
                          src={dest.hero_image_url || '/placeholder.svg'}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1">
                            <MapPin className="w-3 h-3" />
                            {dest.country}
                          </div>
                          <h3 className="text-white font-serif text-lg font-medium">{dest.name}</h3>
                        </div>
                        {dest.is_featured && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-medium backdrop-blur-sm">
                            Featured
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-8">
              <CarouselPrevious className="static translate-y-0 h-10 w-10 rounded-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground" />
              <CarouselNext className="static translate-y-0 h-10 w-10 rounded-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground" />
            </div>
          </Carousel>
        )}
      </div>
    </section>
  );
}
