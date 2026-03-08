import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { viewportOnce } from '@/lib/motion';
import { usePageContent } from '@/hooks/usePageContent';

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  const content = usePageContent('home', 'cta', {
    heading: 'Your Dream Villa Awaits',
    subtitle: 'Handpicked luxury villas in the world\'s most beautiful destinations. Book direct for the best experience.',
  });

  return (
    <section ref={ref} className="py-20 md:py-24 px-4">
      <div className="max-w-[900px] mx-auto rounded-[20px] overflow-hidden relative">
        {/* Parallax background image */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-0 -top-[20%] -bottom-[20%] z-0"
        >
          <img
            src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-primary/70 z-[1]" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="relative z-[2] text-center py-16 px-12"
        >
          <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-4">Summer 2026</p>
          <h2 className="font-serif text-[clamp(30px,4vw,48px)] font-semibold text-primary-foreground leading-[1.1] mb-4">
            {content.heading.split(' ').slice(0, -1).join(' ')}{' '}
            <em className="font-normal text-accent not-italic">{content.heading.split(' ').pop()}</em>
          </h2>
          <p className="font-sans text-sm text-primary-foreground/80 leading-[1.7] max-w-[500px] mx-auto mb-8">
            {content.subtitle}
          </p>
          <Link
            to="/properties"
            className="inline-block px-11 py-4 bg-accent border-none text-accent-foreground font-sans text-[13px] font-medium tracking-[0.12em] uppercase rounded-md hover:bg-accent/80 transition-colors"
          >
            Explore Villas
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
