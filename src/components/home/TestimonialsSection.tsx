import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { viewportOnce } from '@/lib/motion';

interface Testimonial {
  platform: 'booking' | 'tripadvisor';
  text: string;
  author: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    platform: 'booking',
    text: 'Absolutely stunning villa with breathtaking views. The concierge service was exceptional and made our stay truly memorable. Every detail was perfect.',
    author: 'Sarah M.',
    rating: 5,
  },
  {
    platform: 'tripadvisor',
    text: 'From the moment we arrived, everything was perfect. The villa exceeded our expectations in every way. Will definitely return next summer!',
    author: 'James K.',
    rating: 5,
  },
  {
    platform: 'booking',
    text: 'A truly luxurious experience. The attention to detail, the private pool, the location — everything was world-class. Highly recommended.',
    author: 'Maria L.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: properties } = useFeaturedProperties();
  const photos = (properties || []).slice(0, 6).map(p => p.hero_image_url).filter(Boolean);

  const active = testimonials[activeIndex];

  return (
    <section className="py-20 md:py-28 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mb-14"
        >
          <span className="text-accent text-sm font-medium uppercase tracking-widest mb-3 block">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight max-w-lg mx-auto">
            Real Stories from <em className="text-accent not-italic">Happy</em> Travelers
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
          {/* Left: Testimonial */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <span className="text-6xl text-accent/30 font-serif leading-none">"</span>
                <div className="flex items-center gap-1">
                  {[...Array(active.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-lg md:text-xl text-foreground leading-relaxed font-serif italic">
                  {active.text}
                </p>
                <div>
                  <p className="font-medium text-foreground">{active.author}</p>
                  <p className="text-sm text-muted-foreground capitalize">{active.platform === 'booking' ? 'Booking.com' : 'TripAdvisor'}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`rounded-full transition-all ${i === activeIndex ? 'w-8 h-2 bg-accent' : 'w-2 h-2 bg-border'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveIndex((prev) => (prev + 1) % testimonials.length)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: Photo mosaic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            className="hidden lg:grid grid-cols-3 grid-rows-2 gap-3 h-[400px]"
          >
            {photos.slice(0, 6).map((url, i) => (
              <div
                key={i}
                className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
              >
                <img
                  src={url!}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
