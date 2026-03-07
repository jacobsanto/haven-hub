import { motion } from 'framer-motion';

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
    <section className="relative pt-28 pb-16 bg-background overflow-hidden">
      {/* Visible background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-[5%] text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-sans text-[11px] tracking-[0.3em] text-foreground uppercase mb-4"
        >
          Our Collection
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-[clamp(36px,5vw,60px)] font-bold text-foreground leading-[1.05] mb-3"
        >
          Handpicked <em className="font-normal text-primary italic">Villas</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-sans text-[15px] text-foreground/80 max-w-[520px] mx-auto leading-relaxed"
        >
          Every villa personally inspected. Every detail considered. Find your perfect escape among {totalVillas} extraordinary properties.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-7 flex justify-center gap-6"
        >
          <div className="text-center">
            <p className="font-serif text-[28px] font-bold text-accent">{totalVillas}</p>
            <p className="font-sans text-[11px] text-foreground/70 tracking-[0.1em] uppercase">Villas</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="font-serif text-[28px] font-bold text-accent">{destinationsCount}</p>
            <p className="font-sans text-[11px] text-foreground/70 tracking-[0.1em] uppercase">Destinations</p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="font-serif text-[28px] font-bold text-accent">{avgRating.toFixed(1)}</p>
            <p className="font-sans text-[11px] text-muted-foreground/80 tracking-[0.1em] uppercase">Avg Rating</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
