import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';

interface Testimonial {
  platform: 'booking' | 'tripadvisor';
  text: string;
  author: string;
  location: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    platform: 'booking',
    text: 'The villa was a dream — waking up to the caldera view, the private infinity pool catching the morning light. The team arranged a sunset sailing trip that became the highlight of our entire year.',
    author: 'Elena & Marco',
    location: 'Santorini, August 2025',
    rating: 5,
  },
  {
    platform: 'tripadvisor',
    text: 'From the moment we arrived, everything was perfect. The villa exceeded our expectations in every way. The concierge service was exceptional and truly made our stay unforgettable.',
    author: 'Sarah M.',
    location: 'Tuscany, June 2025',
    rating: 5,
  },
  {
    platform: 'booking',
    text: 'A truly luxurious experience. The attention to detail, the private pool, the location — everything was world-class. We\'ve already booked our return trip.',
    author: 'James K.',
    location: 'Bali, September 2025',
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = testimonials[activeIndex];

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
            <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3.5">Guest Stories</p>
            <h2 className="font-serif text-[clamp(28px,3.5vw,44px)] font-semibold text-foreground leading-[1.2]">
              What They <em className="font-normal text-accent not-italic">Remember</em>
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
                <p className="font-sans text-sm font-bold text-foreground">{active.author}</p>
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
