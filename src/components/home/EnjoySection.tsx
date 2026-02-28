import { motion } from 'framer-motion';
import { Gift, UserCheck, Star, Award, LucideIcon } from 'lucide-react';
import { DecorativeHeading } from './DecorativeHeading';
import { usePageContent } from '@/hooks/usePageContent';
import { resolveIcon } from '@/utils/icon-resolver';
import { viewportOnce } from '@/lib/motion';

interface BenefitItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EnjoySection() {
  const content = usePageContent('home', 'enjoy', {
    heading: 'Enjoy',
    subtitle: 'a completely personalised villa experience',
    benefit_1_icon: 'Gift',
    benefit_1_title: 'Enhanced Stay & Benefits',
    benefit_1_description: 'A great property is only the beginning of your vacation. For us, your villa is not just a house.',
    benefit_2_icon: 'UserCheck',
    benefit_2_title: 'Dedicated villa advisor',
    benefit_2_description: 'We are the best at finding the right villa just for you. From the moment you contact us...',
    benefit_3_icon: 'Star',
    benefit_3_title: 'Honest guest reviews',
    benefit_3_description: 'Your opinion matters! Every year, we work to become even better at providing our guests...',
    benefit_4_icon: 'Award',
    benefit_4_title: 'Award-winning excellence',
    benefit_4_description: "We were voted as the 'Best Serviced Luxury Villas in Greece' by the World Luxury Hotel Awards.",
  });

  const benefits: BenefitItem[] = [
    { icon: resolveIcon(content.benefit_1_icon, Gift), title: content.benefit_1_title, description: content.benefit_1_description },
    { icon: resolveIcon(content.benefit_2_icon, UserCheck), title: content.benefit_2_title, description: content.benefit_2_description },
    { icon: resolveIcon(content.benefit_3_icon, Star), title: content.benefit_3_title, description: content.benefit_3_description },
    { icon: resolveIcon(content.benefit_4_icon, Award), title: content.benefit_4_title, description: content.benefit_4_description },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <DecorativeHeading
          word={content.heading}
          subtitle={content.subtitle}
          className="mb-16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-full border-2 border-primary/20 flex items-center justify-center mb-2">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-serif font-medium text-primary">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          className="text-center mt-14"
        >
          <a
            href="/about"
            className="inline-flex items-center justify-center rounded-full border-2 border-primary text-primary font-medium px-10 py-3 hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
          >
            View More
          </a>
        </motion.div>
      </div>
    </section>
  );
}
