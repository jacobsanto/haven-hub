import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeaturedDestinations } from '@/hooks/useDestinations';
import { usePageContent } from '@/hooks/usePageContent';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import { useSectionDisplay } from '@/hooks/useSectionDisplay';
import { SectionRenderer } from '@/components/ui/SectionRenderer';
import { SectionShowcase, type ShowcaseItem } from '@/components/ui/SectionShowcase';
import { useMemo } from 'react';

const SHOWCASE_MODES = ['parallax-depth', 'split-reveal', 'morph-tiles', 'cinematic', 'vertical-curtain', 'card-deck', 'bright-minimalist'];

export function DestinationsShowcase() {
  const { data: destinations, isLoading } = useFeaturedDestinations();
  const settings = useSectionDisplay('home', 'destinations');
  const content = usePageContent('home', 'destinations', {
    label: 'Explore',
    heading: 'Sun-Kissed Destinations'
  });

  const showcaseItems: ShowcaseItem[] = useMemo(() =>
  (destinations || []).slice(0, 8).map((dest) => ({
    id: dest.id,
    image: dest.hero_image_url || '/placeholder.svg',
    title: dest.name,
    subtitle: dest.description || undefined,
    location: dest.country,
    badge: undefined,
    link: `/destinations`
  })),
  [destinations]
  );

  if (!isLoading && (!destinations || destinations.length === 0)) return null;

  const isShowcase = SHOWCASE_MODES.includes(settings.layout_mode);
  const words = content.heading.split(' ');
  const headingMain = words.slice(0, -1).join(' ');
  const headingAccent = words[words.length - 1];

  return (
    <section className={isShowcase ? 'py-12' : 'bg-background py-20 md:py-24'}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mb-14">
          
          <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3.5">{content.label}</p>
          <h2 className="font-serif text-[clamp(32px,4vw,48px)] text-foreground leading-[1.1] font-medium">
            {headingMain} <em className="font-normal text-accent not-italic">{headingAccent}</em>
          </h2>
        </motion.div>
      </div>

      {isLoading ?
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) =>
        <Skeleton key={i} className="aspect-[3/4] rounded-[14px] bg-card" />
        )}
        </div> :
      isShowcase ?
      <SectionShowcase settings={settings} items={showcaseItems} /> :

      <div className="container mx-auto px-4 max-w-[1200px]">
          <SectionRenderer settings={settings}>
            {destinations!.slice(0, 8).map((dest) =>
          <Link
            key={dest.id}
            to={`/destinations/${dest.slug}`}
            className="block group relative rounded-[14px] overflow-hidden aspect-[3/4] cursor-pointer transition-transform duration-500 hover:-translate-y-1.5">
            
                <img
              src={dest.hero_image_url || '/placeholder.svg'}
              alt={dest.name}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-[1.06]"
              loading="lazy" />
            
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="font-sans text-[11px] tracking-[0.15em] text-accent uppercase mb-1.5">
                    <MapPin size={11} className="inline mr-1 align-middle" />
                    {dest.country}
                  </p>
                  <h3 className="font-serif text-2xl font-semibold text-foreground mb-1.5">{dest.name}</h3>
                </div>
                {dest.is_featured &&
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-medium backdrop-blur-sm">
                    Featured
                  </span>
            }
              </Link>
          )}
          </SectionRenderer>
        </div>
      }
    </section>);

}