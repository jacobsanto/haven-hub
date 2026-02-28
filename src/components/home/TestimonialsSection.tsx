import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';

interface Testimonial {
  platform: 'booking' | 'tripadvisor';
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    platform: 'booking',
    text: 'Absolutely stunning villa with breathtaking views. The concierge service was exceptional and made our stay truly memorable.',
    rating: 5,
  },
  {
    platform: 'tripadvisor',
    text: 'From the moment we arrived, everything was perfect. The villa exceeded our expectations in every way. Will definitely return!',
    rating: 5,
  },
  {
    platform: 'booking',
    text: 'A truly luxurious experience. The attention to detail, the private pool, the location – everything was world-class.',
    rating: 5,
  },
];

function PlatformLogo({ platform }: { platform: 'booking' | 'tripadvisor' }) {
  if (platform === 'booking') {
    return (
      <div className="w-8 h-8 rounded bg-[hsl(213,80%,45%)] flex items-center justify-center text-white font-bold text-sm">
        B.
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[hsl(165,60%,40%)] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
        <circle cx="12" cy="10" r="4" />
        <circle cx="7" cy="12" r="2.5" />
        <circle cx="17" cy="12" r="2.5" />
      </svg>
    </div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(count)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-section-alt relative overflow-hidden">
      {/* Decorative organic background shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 1440 600" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <clipPath id="blob1">
              <ellipse cx="240" cy="320" rx="200" ry="180" transform="rotate(-10 240 320)" />
            </clipPath>
            <clipPath id="blob2">
              <ellipse cx="720" cy="280" rx="220" ry="200" transform="rotate(5 720 280)" />
            </clipPath>
            <clipPath id="blob3">
              <ellipse cx="1200" cy="320" rx="200" ry="180" transform="rotate(8 1200 320)" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mb-6"
        >
          <span className="text-6xl text-primary/20 font-serif">"</span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="relative"
            >
              {/* Organic blob background */}
              <div
                className="absolute inset-0 bg-background rounded-[40%_60%_55%_45%/50%_40%_60%_50%] shadow-sm"
                style={{
                  transform: `rotate(${index * 5 - 5}deg)`,
                }}
              />

              {/* Card content */}
              <div className="relative p-8 text-center flex flex-col items-center gap-4 min-h-[220px] justify-center">
                <span className="text-3xl text-primary/30 font-serif leading-none">"</span>
                <div className="flex items-center gap-2">
                  <PlatformLogo platform={testimonial.platform} />
                  <StarRating count={testimonial.rating} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {testimonial.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
