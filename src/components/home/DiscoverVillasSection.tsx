import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useBooking } from '@/contexts/BookingContext';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { useSectionDisplay } from '@/hooks/useSectionDisplay';
import { SectionRenderer } from '@/components/ui/SectionRenderer';
import { SectionShowcase, type ShowcaseItem } from '@/components/ui/SectionShowcase';
import { VillaDetailModal } from '@/components/properties/VillaDetailModal';
import { Property } from '@/types/database';

const SHOWCASE_MODES = ['parallax-depth', 'split-reveal', 'morph-tiles', 'cinematic', 'vertical-curtain', 'card-deck', 'bright-minimalist'];

export function DiscoverVillasSection() {
  const { data: properties, isLoading } = useFeaturedProperties();
  const { format } = useFormatCurrency();
  const { openBooking } = useBooking();
  const settings = useSectionDisplay('home', 'discover-villas');
  const isShowcase = SHOWCASE_MODES.includes(settings.layout_mode);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const showcaseItems: ShowcaseItem[] = useMemo(() =>
    (properties || []).map(p => ({
      id: p.id,
      image: p.hero_image_url || '/placeholder.svg',
      title: p.display_name || p.name,
      subtitle: p.short_description || p.description?.slice(0, 80) || undefined,
      location: `${p.city}, ${p.country}`,
      meta: `${format(p.base_price)} / night`,
      extra: `${p.bedrooms || 3} beds · ${p.max_guests || 6} guests`,
      link: `/properties`,
    })),
    [properties, format]
  );

  return (
    <section className={isShowcase ? 'py-12' : 'bg-muted border-t border-border py-20 md:py-24'}>
      <div className="container mx-auto px-4">
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
      </div>

      {isLoading ? (
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/3] rounded-[14px] bg-card" />
              <Skeleton className="h-6 w-3/4 bg-card" />
            </div>
          ))}
        </div>
      ) : properties && properties.length > 0 ? (
        isShowcase ? (
          <SectionShowcase settings={settings} items={showcaseItems} />
        ) : (
          <div className="container mx-auto px-4">
            <SectionRenderer settings={settings}>
              {properties.map((property) => (
                <div key={property.id} className="block group cursor-pointer" onClick={() => setSelectedProperty(property)}>
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
                </div>
              ))}
            </SectionRenderer>
          </div>
        )
      ) : null}

      <AnimatePresence>
        {selectedProperty && (
          <VillaDetailModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            isFavorite={favorites.has(selectedProperty.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
