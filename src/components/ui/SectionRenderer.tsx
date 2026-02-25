import { ReactNode, Children, useMemo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SectionDisplaySettings } from '@/hooks/useSectionDisplay';

interface SectionRendererProps {
  settings: SectionDisplaySettings & { isLoading?: boolean };
  children: ReactNode;
  className?: string;
  /** Fallback column count for mobile override */
  mobileColumns?: number;
}

const animationVariants = {
  'fade-up': {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  },
  'scale-in': {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  },
  'slide-in': {
    hidden: { opacity: 0, x: -30 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  },
  none: {
    hidden: {},
    visible: () => ({}),
  },
};

const columnClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function SectionRenderer({
  settings,
  children,
  className,
  mobileColumns = 1,
}: SectionRendererProps) {
  const items = Children.toArray(children);
  const variants = animationVariants[settings.animation] || animationVariants['fade-up'];

  if (items.length === 0) return null;

  switch (settings.layout_mode) {
    case 'carousel':
      return (
        <CarouselLayout settings={settings} className={className}>
          {items.map((child, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={variants}
              className="min-w-0 shrink-0 grow-0"
              style={{ flex: `0 0 ${100 / settings.items_per_view}%` }}
            >
              <div className="px-3">{child}</div>
            </motion.div>
          ))}
        </CarouselLayout>
      );

    case 'list':
      return (
        <div className={cn('space-y-6', className)}>
          {items.map((child, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={variants}
            >
              {child}
            </motion.div>
          ))}
        </div>
      );

    case 'featured':
      return (
        <div className={cn('space-y-8', className)}>
          {items[0] && (
            <motion.div
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={variants}
              className="max-w-4xl mx-auto"
            >
              {items[0]}
            </motion.div>
          )}
          {items.length > 1 && (
            <div className={cn('grid gap-6', columnClasses[Math.min(settings.columns, 3)])}>
              {items.slice(1).map((child, i) => (
                <motion.div
                  key={i + 1}
                  custom={i + 1}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={variants}
                >
                  {child}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      );

    case 'grid':
    default:
      return (
        <div className={cn('grid gap-6 md:gap-8', columnClasses[settings.columns] || columnClasses[3], className)}>
          {items.map((child, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={variants}
            >
              {child}
            </motion.div>
          ))}
        </div>
      );
  }
}

// Carousel sub-component using Embla
function CarouselLayout({
  settings,
  children,
  className,
}: {
  settings: SectionDisplaySettings;
  children: ReactNode;
  className?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemCount = Children.toArray(children).length;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Autoplay
  useEffect(() => {
    if (!emblaApi || !settings.autoplay) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, settings.autoplay_interval * 1000);
    return () => clearInterval(interval);
  }, [emblaApi, settings.autoplay, settings.autoplay_interval]);

  return (
    <div className={cn('relative', className)}>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex -mx-3">{children}</div>
      </div>

      {settings.show_navigation && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/90 backdrop-blur-sm shadow-md hidden md:flex"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/90 backdrop-blur-sm shadow-md hidden md:flex"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {settings.show_dots && itemCount > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: itemCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === selectedIndex
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
