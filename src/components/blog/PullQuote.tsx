import { motion } from 'framer-motion';

interface PullQuoteProps {
  children: React.ReactNode;
}

export function PullQuote({ children }: PullQuoteProps) {
  return (
    <motion.blockquote
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="my-12 md:my-16 px-6 md:px-12 py-8 md:py-10 relative"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-2xl" />
      
      {/* Left accent border */}
      <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-accent to-primary/50 rounded-full" />
      
      {/* Quote marks */}
      <span className="absolute -top-4 left-4 text-7xl md:text-8xl font-serif text-primary/20 select-none leading-none">
        "
      </span>
      
      {/* Content */}
      <div className="relative z-10 text-xl md:text-2xl lg:text-3xl font-serif italic text-foreground leading-relaxed text-center md:text-left">
        {children}
      </div>
      
      {/* Closing quote */}
      <span className="absolute -bottom-8 right-4 text-7xl md:text-8xl font-serif text-primary/20 select-none leading-none rotate-180">
        "
      </span>
    </motion.blockquote>
  );
}
