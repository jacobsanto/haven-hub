import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useBooking } from '@/contexts/BookingContext';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

export function DiscoverVillasSection() {
  const { data: properties, isLoading } = useFeaturedProperties();
  const { format } = useFormatCurrency();
  const { openBooking } = useBooking();

  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <span className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3 block">Properties</span>
            <h2 className="font-serif text-[clamp(28px,3.5vw,44px)] font-semibold text-foreground leading-tight max-w-lg">
              Find Your Perfect <em className="text-accent not-italic font-normal">Home</em>
            </h2>
          </div>
          <Link
            to="/properties"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            See All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] rounded-[14px] bg-card" />
                <Skeleton className="h-6 w-3/4 bg-card" />
              </div>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {properties.map((property, index) => (
                <CarouselItem key={property.id} className="pl-4 md:basis-1/4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Link to={`/properties/${property.slug}`} className="block group">
                      <div className="overflow-hidden rounded-[14px] mb-4">
                        <img
                          src={property.hero_image_url || '/placeholder.svg'}
                          alt={property.name}
                          className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <MapPin className="w-3 h-3 text-accent" />
                        {property.city}, {property.country}
                      </div>
                      <h3 className="text-base font-serif font-medium text-foreground group-hover:text-accent transition-colors mb-1">
                        {property.display_name || property.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {property.short_description || property.description?.slice(0, 80)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {format(property.base_price)} <span className="text-muted-foreground font-normal text-xs">/ night</span>
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1 rounded-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openBooking({ mode: 'direct', property });
                          }}
                        >
                          Book Now
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-10">
              <CarouselPrevious className="static translate-y-0 h-10 w-10 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent bg-transparent" />
              <CarouselNext className="static translate-y-0 h-10 w-10 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent bg-transparent" />
            </div>
          </Carousel>
        ) : null}
      </div>
    </section>
  );
}
