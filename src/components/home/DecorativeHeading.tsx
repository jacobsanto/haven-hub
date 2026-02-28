import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DecorativeHeadingProps {
  word: string;
  subtitle: string;
  className?: string;
}

export function DecorativeHeading({ word, subtitle, className }: DecorativeHeadingProps) {
  return (
    <div className={cn("text-center", className)}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-primary tracking-[0.15em] uppercase"
        style={{ fontVariantLigatures: 'discretionary-ligatures' }}
      >
        {word}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-lg md:text-xl text-primary/80 mt-2 font-sans"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
