import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DecorativeHeading } from './DecorativeHeading';
import { useFeaturedProperties, useProperties } from '@/hooks/useProperties';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

export function DiscoverVillasSection() {
  const { data: properties, isLoading } = useFeaturedProperties();
  const { data: allProperties } = useProperties();
  const { format } = useFormatCurrency();

  const totalCount = allProperties?.length || 0;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <DecorativeHeading
          word="Discover"
          subtitle={`more than ${totalCount > 0 ? totalCount : '30'}+ villas`}
          className="mb-14"
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <Carousel
            opts={{ align: 'start', loop: true }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-6">
              {properties.map((property) => (
                <CarouselItem key={property.id} className="pl-6 md:basis-1/3">
                  <Link to={`/properties/${property.slug}`} className="block group">
                    <div className="overflow-hidden rounded-2xl mb-4">
                      <img
                        src={property.hero_image_url || '/placeholder.svg'}
                        alt={property.name}
                        className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-serif font-medium text-primary group-hover:underline">
                        {property.display_name || property.name}
                      </h3>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                        <Users className="h-4 w-4" /> 1-{property.max_guests || 6}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {property.short_description || property.description?.slice(0, 100)}
                    </p>
                    <span className="inline-block text-sm text-primary mt-2 group-hover:underline">
                      View Details
                    </span>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Arrows below carousel */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <CarouselPrevious className="static translate-y-0 h-10 w-10 rounded-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground" />
              <CarouselNext className="static translate-y-0 h-10 w-10 rounded-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground" />
            </div>
          </Carousel>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mt-10"
        >
          <Link
            to="/properties"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium px-10 py-3 hover:bg-primary/90 transition-colors duration-300"
          >
            View All
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
