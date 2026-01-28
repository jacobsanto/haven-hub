import { motion } from 'framer-motion';

interface InlineImageProps {
  src: string;
  alt: string;
  caption?: string;
  variant?: 'full' | 'wide' | 'medium';
}

export function InlineImage({ src, alt, caption, variant = 'wide' }: InlineImageProps) {
  const widthClass = {
    full: 'w-screen relative -ml-4 md:-ml-8 lg:-ml-16',
    wide: 'w-full',
    medium: 'w-full md:w-4/5 mx-auto',
  }[variant];

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className={`my-10 md:my-14 ${widthClass}`}
    >
      <div className="overflow-hidden rounded-xl md:rounded-2xl shadow-lg">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-4 text-center text-sm text-muted-foreground italic px-4">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
