import { motion } from 'framer-motion';
import { GrainOverlay } from '@/components/home/hero/GrainOverlay';

interface PropertiesHeroBannerProps {
  totalVillas: number;
  destinationsCount: number;
  avgRating: number;
  heroImageUrl?: string;
}

export function PropertiesHeroBanner({
  totalVillas,
  destinationsCount,
  avgRating,
  heroImageUrl,
}: PropertiesHeroBannerProps) {
  const bgImage = heroImageUrl || 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=50';

  return (
    <section className="relative py-24 md:py-36 bg-muted overflow-hidden">
      {/* Ambient background image */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={bgImage} alt="" className="w-full h-full object-cover blur-sm scale-105" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
      <GrainOverlay />

      <div className="relative z-10 max-w-[1200px] mx-auto px-[5%] text-center" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Our Collection</p>
          <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground mb-4">
            Handpicked <em className="italic text-accent">Villas</em>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every villa personally inspected. Every detail considered. Find your perfect escape among {totalVillas} extraordinary properties.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-7 flex justify-center gap-6"
        >
          <div className="text-center">
            <p className="font-serif text-[28px] font-medium text-accent">{totalVillas}</p>
            <p className="font-sans text-[11px] text-foreground/70 tracking-[0.1em] uppercase">Villas</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="font-serif text-[28px] font-medium text-accent">{destinationsCount}</p>
            <p className="font-sans text-[11px] text-foreground/70 tracking-[0.1em] uppercase">Destinations</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="font-serif text-[28px] font-bold text-accent">{avgRating.toFixed(1)}</p>
            <p className="font-sans text-[11px] text-foreground/70 tracking-[0.1em] uppercase">Avg Rating</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
