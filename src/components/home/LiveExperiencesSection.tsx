import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { usePageContent } from '@/hooks/usePageContent';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';
import { useSectionDisplay } from '@/hooks/useSectionDisplay';
import { SectionRenderer } from '@/components/ui/SectionRenderer';
import { SectionShowcase, type ShowcaseItem } from '@/components/ui/SectionShowcase';

const SHOWCASE_MODES = ['parallax-depth', 'split-reveal', 'morph-tiles', 'cinematic', 'vertical-curtain', 'card-deck', 'bright-minimalist'];

export function LiveExperiencesSection() {
  const { data: experiences, isLoading } = useActiveExperiences();
  const { format } = useFormatCurrency();
  const settings = useSectionDisplay('home', 'experiences');
  const featured = experiences?.filter(e => e.is_featured).slice(0, 8) || experiences?.slice(0, 8);
  const isShowcase = SHOWCASE_MODES.includes(settings.layout_mode);

  const content = usePageContent('home', 'experiences', {
    label: 'Curated',
    heading: 'Beyond the Villa',
    subtitle: 'Elevate your stay with our hand-selected experiences.',
  });

  const showcaseItems: ShowcaseItem[] = useMemo(() =>
    (featured || []).map(exp => ({
      id: exp.id,
      image: exp.hero_image_url || '/placeholder.svg',
      title: exp.name,
      subtitle: exp.description || undefined,
      badge: exp.category,
      location: exp.duration || undefined,
      meta: exp.price_from ? format(exp.price_from) : undefined,
      link: `/experiences/${exp.slug}`,
    })),
    [featured, format]
  );

  if (!isLoading && (!featured || featured.length === 0)) return null;

  const words = content.heading.split(' ');
  const headingMain = words.slice(0, -1).join(' ');
  const headingAccent = words[words.length - 1];

  return (
    <section className={isShowcase ? 'py-12' : 'bg-muted border-t border-b border-border py-20 md:py-24'}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mb-14"
        >
          <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3.5">{content.label}</p>
          <h2 className="font-serif text-[clamp(32px,4vw,48px)] font-semibold text-foreground leading-[1.1]">
            {headingMain} <em className="font-normal text-accent not-italic">{headingAccent}</em>
          </h2>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-[14px] bg-card" />
          ))}
        </div>
      ) : isShowcase ? (
        <SectionShowcase settings={settings} items={showcaseItems} />
      ) : (
        <div className="container mx-auto px-4 max-w-[1200px]">
          <SectionRenderer settings={settings}>
            {featured!.map((exp) => (
              <Link
                key={exp.id}
                to={`/experiences/${exp.slug}`}
                className="block group bg-card border border-border rounded-[14px] overflow-hidden hover:border-accent/40 hover:-translate-y-1 transition-all"
              >
                <div className="p-7">
                  <span className="inline-block font-sans text-[10px] tracking-[0.15em] text-accent uppercase px-2.5 py-1 bg-accent/10 rounded">
                    {exp.category}
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-foreground mt-4 mb-2">
                    {exp.name}
                  </h3>
                  <p className="font-sans text-[13px] text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                    {exp.description}
                  </p>
                  <div className="flex justify-between items-center">
                    {exp.duration && (
                      <span className="font-sans text-xs text-muted-foreground">
                        <Clock size={12} className="inline mr-1 align-middle" />
                        {exp.duration}
                      </span>
                    )}
                    {exp.price_from && (
                      <span className="font-sans text-base font-bold text-accent">
                        {format(exp.price_from)}
                      </span>
                    )}
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
