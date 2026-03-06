import { motion } from 'framer-motion';
import { Star, Shield, Sun, Heart } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';
import { usePageContent } from '@/hooks/usePageContent';
import { resolveIcon } from '@/utils/icon-resolver';

const defaultIcons = [Star, Shield, Sun, Heart];

export function TrustSection() {
  const content = usePageContent('home', 'trust_badges', {
    badge_1_icon: 'Star',
    badge_1_title: 'Handpicked',
    badge_1_description: 'Every villa personally inspected',
    badge_2_icon: 'Shield',
    badge_2_title: 'Best Price',
    badge_2_description: 'Direct booking guarantee',
    badge_3_icon: 'Sun',
    badge_3_title: 'Local Experts',
    badge_3_description: 'Concierge in every destination',
  });

  const badges = [1, 2, 3].map((i) => ({
    icon: resolveIcon(content[`badge_${i}_icon` as keyof typeof content] as string, defaultIcons[i - 1]),
    label: content[`badge_${i}_title` as keyof typeof content] as string,
    desc: content[`badge_${i}_description` as keyof typeof content] as string,
  }));

  return (
    <section className="bg-muted border-t border-b border-border py-9">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="max-w-[1200px] mx-auto grid grid-cols-3 gap-8 text-center"
        >
          {badges.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="flex flex-col items-center gap-2.5">
                <div className="text-accent">
                  <Icon size={20} />
                </div>
                <p className="font-serif text-[15px] font-semibold text-foreground">{t.label}</p>
                <p className="font-sans text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
