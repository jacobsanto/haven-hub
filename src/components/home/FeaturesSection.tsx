import { motion } from 'framer-motion';
import { Map, CreditCard, ArrowRight } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';

const leftFeatures = [
  {
    icon: Map,
    title: 'Curated Vacation Rentals',
    description: 'Each property is hand-selected for quality, location, and unique character to ensure an exceptional stay.',
  },
  {
    icon: CreditCard,
    title: 'Flexible Payment Options',
    description: 'Split payments, early bird discounts, and secure checkout — designed around your comfort.',
  },
];

const rightFeatures = [
  {
    title: 'Local Guides',
    description: 'Expert recommendations for dining, activities, and hidden gems in every destination.',
    color: 'bg-accent/10',
  },
  {
    title: '24/7 Concierge',
    description: 'Dedicated support before, during, and after your stay for a truly worry-free experience.',
    color: 'bg-primary/5',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mb-14"
        >
          <span className="text-accent text-sm font-medium uppercase tracking-widest mb-3 block">Our Promise</span>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight max-w-2xl mx-auto">
            Crafting <em className="text-accent not-italic">Memorable</em> Stays and Hassle-Free Travel
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left column */}
          <div className="space-y-6">
            {leftFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-5 p-6 rounded-2xl bg-card border border-border"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {rightFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl ${feature.color} group cursor-default`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-accent shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
