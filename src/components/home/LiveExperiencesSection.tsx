import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { usePageContent } from '@/hooks/usePageContent';
import { Skeleton } from '@/components/ui/skeleton';
import { viewportOnce } from '@/lib/motion';

export function LiveExperiencesSection() {
  const { data: experiences, isLoading } = useActiveExperiences();
  const { format } = useFormatCurrency();
  const featured = experiences?.filter(e => e.is_featured).slice(0, 8) || experiences?.slice(0, 8);

  const content = usePageContent('home', 'experiences', {
    label: 'Curated',
    heading: 'Beyond the Villa',
    subtitle: 'Elevate your stay with our hand-selected experiences.',
  });

  if (!isLoading && (!featured || featured.length === 0)) return null;

  const words = content.heading.split(' ');
  const headingMain = words.slice(0, -1).join(' ');
  const headingAccent = words[words.length - 1];

  return (
    <section className="bg-muted border-t border-b border-border py-20 md:py-24">
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

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-[14px] bg-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[1200px] mx-auto">
            {featured!.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: index * 0.08 }}
              >
                <Link
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
