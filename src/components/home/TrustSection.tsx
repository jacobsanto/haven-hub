import { motion } from 'framer-motion';
import { Shield, Headphones, Home, Sparkles } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';

const features = [
  {
    icon: Home,
    title: 'Handpicked Properties',
    description: 'Every property is personally vetted to ensure the highest standards of luxury and comfort.',
  },
  {
    icon: Sparkles,
    title: 'Unique Experiences',
    description: 'Curated local experiences that transform your stay into an unforgettable journey.',
  },
  {
    icon: Shield,
    title: 'Seamless Booking',
    description: 'Book with confidence through our secure, streamlined reservation process.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our dedicated concierge team is always available to assist you.',
  },
];

export function TrustSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Heading */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
          >
            <span className="text-accent text-sm font-medium uppercase tracking-widest mb-4 block">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground leading-tight">
              Your Trusted Partner in Finding the{' '}
              <em className="text-accent not-italic">Perfect</em> Vacation Rental
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
              We combine local expertise with world-class service to deliver vacation experiences that exceed every expectation.
            </p>
          </motion.div>

          {/* Right: Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
