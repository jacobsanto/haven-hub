import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Shield, Sparkles, Users, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Button } from '@/components/ui/button';
import { TrustBadges } from '@/components/booking/TrustBadges';
import { resolveIcon } from '@/utils/icon-resolver';

const defaultValueIcons = [Heart, Shield, Sparkles, Users];

const About = () => {
  const { brandName, brandTagline } = useBrand();

  const heroContent = usePageContent('about', 'hero', {
    heading: 'About {brandName}',
    subtitle: "Crafting extraordinary vacation experiences in the world's most beautiful destinations.",
    hero_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
  });
  const storyContent = usePageContent('about', 'our_story', {
    heading: 'Our Story',
    paragraph_1: '{brandName} was born from a simple belief: that the right vacation home can transform an ordinary trip into an extraordinary memory. What began as a passion project curating exceptional properties has grown into a trusted name in luxury villa rentals.',
    paragraph_2: 'Our founders, avid travelers themselves, noticed a gap in the market—stunning properties often came with impersonal service, while personalized attention was reserved for only the most exclusive bookings. We set out to change that.',
    paragraph_3: "Today, we offer a carefully curated collection of villas across the world's most desirable destinations. Each property is personally inspected, each host relationship nurtured, and each guest treated as if they're our only one.",
  });
  const valuesContent = usePageContent('about', 'values', {
    heading: 'Our Values',
    subtitle: 'The principles that guide everything we do',
    value_1_icon: 'Heart',
    value_1_title: 'Passion for Excellence',
    value_1_description: 'Every property in our collection is chosen with care, ensuring exceptional quality and unforgettable experiences.',
    value_2_icon: 'Shield',
    value_2_title: 'Trust & Transparency',
    value_2_description: 'We believe in honest communication and straightforward booking, with no hidden fees or surprises.',
    value_3_icon: 'Sparkles',
    value_3_title: 'Curated Luxury',
    value_3_description: 'Our team personally vets each villa to guarantee it meets our exacting standards for comfort and style.',
    value_4_icon: 'Users',
    value_4_title: 'Personal Service',
    value_4_description: 'From your first inquiry to checkout, our dedicated concierge team is here to make your stay seamless.',
  });
  const statsContent = usePageContent('about', 'stats', {
    stat_1_value: '10+', stat_1_label: 'Years of Excellence',
    stat_2_value: '25+', stat_2_label: 'Luxury Properties',
    stat_3_value: '5000+', stat_3_label: 'Happy Guests',
    stat_4_value: '15+', stat_4_label: 'Destinations',
  });
  const ctaContent = usePageContent('about', 'cta', {
    heading: 'Ready to Book Your Escape?',
    subtitle: 'Browse our collection of handpicked luxury villas and secure the best rates.',
  });

  const r = (text: string) => text.replace(/{brandName}/g, brandName);

  const values = [1, 2, 3, 4].map((i) => ({
    icon: resolveIcon(
      valuesContent[`value_${i}_icon` as keyof typeof valuesContent] as string,
      defaultValueIcons[i - 1]
    ),
    title: valuesContent[`value_${i}_title` as keyof typeof valuesContent] as string,
    description: valuesContent[`value_${i}_description` as keyof typeof valuesContent] as string,
  }));

  const stats = [1, 2, 3, 4].map((i) => ({
    value: statsContent[`stat_${i}_value` as keyof typeof statsContent] as string,
    label: statsContent[`stat_${i}_label` as keyof typeof statsContent] as string,
  }));

  return (
    <PageLayout>
      <PageSEO pageSlug="about" defaults={{ meta_title: 'About Us | Haven Hub', meta_description: "Learn about Haven Hub's story, values, and commitment to extraordinary luxury vacation experiences.", og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' }} />
      {/* Hero */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${heroContent.hero_image}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6">{r(heroContent.heading)}</h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">{brandTagline || r(heroContent.subtitle)}</p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-6">{storyContent.heading}</h2>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="prose prose-lg max-w-none text-muted-foreground text-center">
              <p className="mb-6 leading-relaxed">{r(storyContent.paragraph_1)}</p>
              <p className="mb-6 leading-relaxed">{r(storyContent.paragraph_2)}</p>
              <p className="leading-relaxed">{r(storyContent.paragraph_3)}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-warm-cream">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">{valuesContent.heading}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{valuesContent.subtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div key={value.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="card-organic p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gold-accent/10 flex items-center justify-center">
                  <value.icon className="h-7 w-7 text-gold-accent" />
                </div>
                <h3 className="text-lg font-serif font-medium mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 md:py-28 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
                <div className="text-4xl md:text-5xl font-serif font-medium text-gold-accent mb-2">{stat.value}</div>
                <div className="text-sm md:text-base opacity-80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Booking Benefits */}
      <section className="py-20 md:py-28 bg-warm-cream">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">Why Book Direct with {brandName}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">When you book directly, you get the best rates and exclusive benefits</p>
          </motion.div>
          <div className="max-w-3xl mx-auto mb-12">
            <TrustBadges variant="grid" badges={['price', 'cancellation', 'support', 'verified']} />
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <Link to="/properties">
              <Button variant="gold" size="lg" className="rounded-full gap-2 px-8">Start Booking Now <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">{ctaContent.heading}</h2>
            <p className="text-muted-foreground text-lg mb-8">{ctaContent.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/properties"><Button variant="gold" size="lg" className="rounded-full px-8 gap-2">Browse & Book Properties <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/contact"><Button variant="outline" size="lg" className="rounded-full px-8">Talk to Concierge</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
