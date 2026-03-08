import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';
import { usePageContent } from '@/hooks/usePageContent';
import { useTestimonials, fallbackTestimonials } from '@/hooks/useTestimonials';
import { Skeleton } from '@/components/ui/skeleton';

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: dbTestimonials, isLoading } = useTestimonials();

  const testimonials =
    dbTestimonials && dbTestimonials.length > 0 ? dbTestimonials : fallbackTestimonials;

  const active = testimonials[Math.min(activeIndex, testimonials.length - 1)];

  const content = usePageContent('home', 'testimonials', {
    label: 'Guest Stories',
    heading: 'What They Remember',
  });

  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            className="mb-12"
          >
            <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3.5">{content.label}</p>
            <h2 className="font-serif text-[clamp(28px,3.5vw,44px)] font-semibold text-foreground leading-[1.2]">
              {content.heading.split(' ').slice(0, -1).join(' ')}{' '}
              <em className="font-normal text-accent not-italic">{content.heading.split(' ').pop()}</em>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            className="bg-card border border-border rounded-2xl px-10 md:px-14 py-12 relative"
          >
            {/* Quote mark */}
            <div className="font-serif text-[64px] text-accent/20 absolute top-4 left-8 leading-none">"</div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6 mx-auto" />
                <Skeleton className="h-5 w-4/6 mx-auto" />
                <div className="w-10 h-px bg-accent/20 mx-auto my-5" />
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <p className="font-serif text-xl italic text-foreground leading-[1.7] mb-7">
                      {active.text}
                    </p>
                    <div className="w-10 h-px bg-accent mx-auto mb-5" />
                    <p className="font-sans text-sm font-medium text-foreground">{active.author}</p>
                    <p className="font-sans text-xs text-muted-foreground">{active.location}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex gap-2">
                    {testimonials.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className="rounded-full transition-all border-none cursor-pointer"
                        style={{
                          width: i === activeIndex ? 28 : 8,
                          height: 3,
                          background: i === activeIndex ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveIndex((prev) => (prev + 1) % testimonials.length)}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
