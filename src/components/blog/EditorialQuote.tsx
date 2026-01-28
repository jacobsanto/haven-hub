import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface EditorialQuoteProps {
  quote: string;
  attribution?: string;
  publication?: string;
}

export function EditorialQuote({ quote, attribution, publication }: EditorialQuoteProps) {
  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="my-12 md:my-16 py-10 md:py-12 border-y border-border/50"
    >
      {/* Quote Icon */}
      <Quote className="h-8 w-8 text-primary/40 mb-4" />

      {/* Quote Text */}
      <p className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-foreground leading-relaxed mb-6">
        "{quote}"
      </p>

      {/* Attribution */}
      {(attribution || publication) && (
        <footer className="flex items-center gap-2 text-muted-foreground">
          {attribution && (
            <span className="font-medium text-foreground">— {attribution}</span>
          )}
          {publication && (
            <span className="text-sm">, {publication}</span>
          )}
        </footer>
      )}
    </motion.blockquote>
  );
}
