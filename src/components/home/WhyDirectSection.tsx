import { motion } from 'framer-motion';
import { Shield, Clock, Star, Calendar } from 'lucide-react';
import { viewportOnce } from '@/lib/motion';
import { usePageContent } from '@/hooks/usePageContent';
import { resolveIcon } from '@/utils/icon-resolver';
import { useBrand } from '@/contexts/BrandContext';

const defaultIcons = [Shield, Clock, Star, Calendar];

export function WhyDirectSection() {
  const { brandName } = useBrand();
  const content = usePageContent('home', 'why_book_direct', {
    heading: 'Why Book Direct with {brandName}',
    subtitle: 'Get the best rates and exclusive benefits when you book directly',
    feature_1_icon: 'Shield',
    feature_1_title: 'Best Price',
    feature_1_description: 'Guaranteed lowest rate',
    feature_2_icon: 'Clock',
    feature_2_title: 'Free Changes',
    feature_2_description: 'Flexible modifications',
    feature_3_icon: 'Star',
    feature_3_title: 'VIP Perks',
    feature_3_description: 'Welcome gifts & upgrades',
    feature_4_icon: 'Calendar',
    feature_4_title: 'Early Access',
    feature_4_description: 'First pick on new villas',
  });

  const r = (text: string) => text.replace(/{brandName}/g, brandName);

  const perks = [1, 2, 3, 4].map((i) => ({
    icon: resolveIcon(content[`feature_${i}_icon` as keyof typeof content] as string, defaultIcons[i - 1]),
    title: content[`feature_${i}_title` as keyof typeof content] as string,
    desc: content[`feature_${i}_description` as keyof typeof content] as string,
  }));

  return (
    <section className="bg-muted border-t border-b border-border py-20 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
          >
            <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3.5">Direct Advantage</p>
            <h2 className="font-serif text-[clamp(28px,3vw,40px)] font-semibold text-foreground leading-[1.15] mb-5">
              Book Direct,<br />Live <em className="font-normal text-accent not-italic">Better</em>
            </h2>
            <p className="font-sans text-sm text-muted-foreground leading-[1.7]">
              {r(content.subtitle)}
            </p>
          </motion.div>

          {/* Right: Perk cards */}
          <div className="grid grid-cols-2 gap-4">
            {perks.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-xl p-6 hover:border-accent/40 transition-colors group"
                >
                  <div className="text-accent mb-3">
                    <Icon size={20} />
                  </div>
                  <p className="font-serif text-[15px] font-semibold text-foreground mb-1">{perk.title}</p>
                  <p className="font-sans text-xs text-muted-foreground">{perk.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
