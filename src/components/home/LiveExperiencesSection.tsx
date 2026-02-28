import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DecorativeHeading } from './DecorativeHeading';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

export function LiveExperiencesSection() {
  const { data: experiences, isLoading } = useActiveExperiences();
  const featured = experiences?.filter(e => e.is_featured).slice(0, 8) || experiences?.slice(0, 8);

  if (!isLoading && (!featured || featured.length === 0)) return null;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <DecorativeHeading
          word="Live"
          subtitle="the experience"
          className="mb-14"
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : featured && featured.length > 0 ? (
          <Carousel
            opts={{ align: 'start', loop: true }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-6">
              {featured.map((exp) => (
                <CarouselItem key={exp.id} className="pl-6 md:basis-1/4">
                  <Link to={`/experiences/${exp.slug}`} className="block group">
                    <div className="overflow-hidden rounded-2xl mb-4">
                      <img
                        src={exp.hero_image_url || '/placeholder.svg'}
                        alt={exp.name}
                        className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-base font-serif font-medium text-primary group-hover:underline">
                      {exp.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {exp.description}
                    </p>
                    <span className="inline-block text-sm text-primary mt-2 group-hover:underline">
                      Learn More
                    </span>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>

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
            to="/experiences"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium px-10 py-3 hover:bg-primary/90 transition-colors duration-300"
          >
            View All
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
