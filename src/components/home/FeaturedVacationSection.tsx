import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Palmtree, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import { useSectionDisplay } from '@/hooks/useSectionDisplay';
import { SectionRenderer } from '@/components/ui/SectionRenderer';
import { SectionShowcase, type ShowcaseItem } from '@/components/ui/SectionShowcase';

const SHOWCASE_MODES = ['parallax-depth', 'split-reveal', 'morph-tiles', 'cinematic', 'vertical-curtain', 'card-deck', 'bright-minimalist'];

export function FeaturedVacationSection() {
  const { data: properties, isLoading } = useFeaturedProperties();
  const { format } = useFormatCurrency();
  const settings = useSectionDisplay('home', 'featured-vacations');
  const isShowcase = SHOWCASE_MODES.includes(settings.layout_mode);

  const featured = properties?.slice(0, 3);

  const showcaseItems: ShowcaseItem[] = useMemo(() =>
    (featured || []).map(p => ({
      id: p.id,
      image: p.hero_image_url || '/placeholder.svg',
      title: p.display_name || p.name,
      subtitle: p.short_description || undefined,
      location: `${p.city}, ${p.country}`,
      meta: `Starting from ${format(p.base_price)}`,
      extra: `${p.bedrooms || 3} beds · ${p.max_guests || 6} guests`,
      link: `/properties`,
    })),
    [featured, format]
  );

  if (!isLoading && (!featured || featured.length === 0)) return null;

  return (
    <section className={isShowcase ? 'py-12' : 'bg-background py-20 md:py-24'}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
          >
            <div className="flex items-center gap-2 mb-3">
              <Palmtree className="w-5 h-5 text-accent" />
              <span className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase">Featured Vacations</span>
            </div>
            <h2 className="font-serif text-[clamp(28px,3.5vw,44px)] font-semibold text-foreground leading-tight max-w-md">
              Exceptional Properties for Your Next Escape
            </h2>
          </motion.div>
          <Link
            to="/properties"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            See All Vacations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-[14px] bg-card" />
          ))}
        </div>
      ) : isShowcase ? (
        <SectionShowcase settings={settings} items={showcaseItems} />
      ) : (
        <div className="container mx-auto px-4">
          <SectionRenderer settings={settings}>
            {featured!.map((property) => (
              <Link key={property.id} to={`/properties/${property.slug}`} className="block group">
                <div className="relative overflow-hidden rounded-[14px] aspect-[4/5]">
                  <img
                    src={property.hero_image_url || '/placeholder.svg'}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-1.5 text-foreground/80 text-xs mb-2">
                      <MapPin className="w-3 h-3 text-accent" />
                      {property.city}, {property.country}
                    </div>
                    <h3 className="text-foreground font-serif text-xl font-medium mb-2">
                      {property.display_name || property.name}
                    </h3>
                    <span className="inline-block px-3 py-1 rounded-full bg-foreground/10 backdrop-blur-sm text-foreground text-sm">
                      Starting from {format(property.base_price)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </SectionRenderer>
        </div>
      )}
    </section>
  );
}
