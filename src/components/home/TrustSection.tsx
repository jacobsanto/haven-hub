import { motion } from 'framer-motion';
import { Star, Shield, Sun, Heart } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';

const trustItems = [
  { icon: Star, label: 'Handpicked', desc: 'Every villa personally inspected' },
  { icon: Shield, label: 'Best Price', desc: 'Direct booking guarantee' },
  { icon: Sun, label: 'Local Experts', desc: 'Concierge in every destination' },
  { icon: Heart, label: 'Loved by Guests', desc: '4.9 average across 2,400+ stays' },
];

export function TrustSection() {
  return (
    <section className="bg-[#111118] border-t border-b border-white/[0.06] py-9">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {trustItems.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="flex flex-col items-center gap-2.5">
                <div className="text-accent">
                  <Icon size={20} />
                </div>
                <p className="font-serif text-[15px] font-semibold text-[#f0ece4]">{t.label}</p>
                <p className="font-sans text-xs text-[#6b6560] leading-relaxed">{t.desc}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
