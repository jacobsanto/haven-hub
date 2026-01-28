import { motion } from 'framer-motion';

interface SectionDividerProps {
  variant?: 'default' | 'subtle' | 'accent';
}

export function SectionDivider({ variant = 'default' }: SectionDividerProps) {
  if (variant === 'subtle') {
    return (
      <div className="my-12 md:my-16 flex justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
        </div>
      </div>
    );
  }

  if (variant === 'accent') {
    return (
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-14 md:my-20 flex items-center justify-center gap-4"
      >
        <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-primary/30" />
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-accent" />
        <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-primary/30" />
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="my-12 md:my-16 flex items-center justify-center"
    >
      <div className="flex items-center gap-4 w-full max-w-md">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="w-2 h-2 rounded-full bg-primary/40" />
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </motion.div>
  );
}
