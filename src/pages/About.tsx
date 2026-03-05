import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Shield, Sparkles, ArrowRight, Star, Mail, Phone, Headphones, MapPin } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { InlineContactForm } from '@/components/contact/InlineContactForm';
import { resolveIcon } from '@/utils/icon-resolver';
import { fadeUp, viewportOnce, getReducedMotionVariants } from '@/lib/motion';

const defaultValueIcons = [Heart, Shield, Sparkles];

const teamMembers = [
  { name: 'Sofia Laurent', role: 'Co-Founder & CEO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'Marco Vitale', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Amara Chen', role: 'Guest Experience Lead', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
  { name: 'James Okafor', role: 'Property Curator', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
  { name: 'Elena Petrova', role: 'Marketing Director', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
  { name: 'David Moreno', role: 'Tech Lead', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
];

const testimonials = [
  { name: 'Sarah & Tom', location: 'London, UK', text: 'An absolutely magical experience. The villa was even better than the photos.', stars: 5 },
  { name: 'Yuki Tanaka', location: 'Tokyo, Japan', text: 'The concierge service made everything seamless. We felt truly cared for.', stars: 5 },
  { name: 'Pierre Dubois', location: 'Paris, France', text: 'Best vacation rental experience we have ever had. Will definitely return.', stars: 5 },
];

const About = () => {
  const { brandName, contactEmail, contactPhone } = useBrand();
  const prefersReduced = useReducedMotion();
  const v = getReducedMotionVariants(fadeUp, prefersReduced);

  const heroContent = usePageContent('about', 'hero', {
    heading: 'Our Story: Bridging the World, One Unforgettable Stay at a Time.',
    hero_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
  });
  const storyContent = usePageContent('about', 'our_story', {
    heading: 'Meet the Global Explorers Behind {brandName}',
    paragraph_1: '{brandName} was born from a simple belief: that the right vacation home can transform an ordinary trip into an extraordinary memory.',
    paragraph_2: 'Our founders, avid travelers themselves, noticed a gap in the market—stunning properties often came with impersonal service, while personalized attention was reserved for only the most exclusive bookings.',
    paragraph_3: "Today, we offer a carefully curated collection of villas across the world's most desirable destinations.",
  });
  const valuesContent = usePageContent('about', 'values', {
    heading: 'Our Values',
    value_1_icon: 'Heart', value_1_title: 'Passion for Excellence', value_1_description: 'Every property is chosen with care, ensuring exceptional quality.',
    value_2_icon: 'Shield', value_2_title: 'Trust & Transparency', value_2_description: 'Honest communication and straightforward booking, always.',
    value_3_icon: 'Sparkles', value_3_title: 'Curated Luxury', value_3_description: 'Each villa personally vetted to meet our exacting standards.',
  });
  const missionContent = usePageContent('about', 'mission', {
    heading: 'Our Mission',
    paragraph_1: 'We believe travel should be transformative. Our mission is to connect discerning travelers with exceptional homes in the most inspiring destinations worldwide.',
    paragraph_2: 'Every stay we curate is designed to create lasting memories — blending local culture, stunning architecture, and personalized service into one seamless experience.',
  });

  const r = (text: string) => text.replace(/{brandName}/g, brandName);

  const values = [1, 2, 3].map((i) => ({
    icon: resolveIcon(valuesContent[`value_${i}_icon` as keyof typeof valuesContent] as string, defaultValueIcons[i - 1]),
    title: valuesContent[`value_${i}_title` as keyof typeof valuesContent] as string,
    description: valuesContent[`value_${i}_description` as keyof typeof valuesContent] as string,
  }));

  return (
    <PageLayout>
      <PageSEO pageSlug="about" defaults={{ meta_title: `About Us | ${brandName}`, meta_description: `Learn about ${brandName}'s story, values, and commitment to extraordinary luxury vacation experiences.`, og_image: heroContent.hero_image }} />

      {/* ─── Hero ─── */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroContent.hero_image}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="container mx-auto px-4 relative z-10 h-full flex items-end pb-16 md:pb-20">
          <motion.h1
            initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif italic text-white max-w-3xl leading-tight"
          >
            {r(heroContent.heading)}
          </motion.h1>
        </div>
      </section>

      {/* ─── Story + Values ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Story */}
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-6 leading-snug">
                {r(storyContent.heading)}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{r(storyContent.paragraph_1)}</p>
                <p>{r(storyContent.paragraph_2)}</p>
                <p>{r(storyContent.paragraph_3)}</p>
              </div>
            </motion.div>

            {/* Values */}
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-6">
                {valuesContent.heading}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {values.map((value, i) => (
                  <div key={i} className="text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-accent/10 flex items-center justify-center">
                      <value.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{value.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Team + Mission ─── */}
      <section className="py-16 md:py-24 bg-section-alt">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Team */}
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-8">
                Meet the Team
              </h2>
              <div className="grid grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <div key={member.name} className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-3">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-foreground leading-tight">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mission + CTAs */}
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-6">
                {missionContent.heading}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
                <p>{r(missionContent.paragraph_1)}</p>
                <p>{r(missionContent.paragraph_2)}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-5 bg-accent/10 border-accent/20 hover:bg-accent/15 transition-colors cursor-pointer group">
                  <Headphones className="h-6 w-6 text-accent mb-3" />
                  <h3 className="font-semibold text-foreground text-sm mb-1">Customer Service</h3>
                  <p className="text-xs text-muted-foreground mb-3">24/7 dedicated concierge support</p>
                  <ArrowRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
                </Card>
                <Card className="p-5 border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                  <MapPin className="h-6 w-6 text-foreground mb-3" />
                  <h3 className="font-semibold text-foreground text-sm mb-1">Local Guides</h3>
                  <p className="text-xs text-muted-foreground mb-3">Expert tips for every destination</p>
                  <ArrowRight className="h-4 w-4 text-foreground group-hover:translate-x-1 transition-transform" />
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials + Contact ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Testimonials */}
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-8">
                What Our Guests Say
              </h2>
              <div className="space-y-4">
                {testimonials.map((t, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.stars }).map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground italic mb-3">"{t.text}"</p>
                    <p className="text-xs font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-6">
                Get in Touch
              </h2>
              <div className="space-y-3 mb-8">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="h-4 w-4 text-accent" /> {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="h-4 w-4 text-accent" /> {contactPhone}
                  </a>
                )}
              </div>
              <InlineContactForm />
              <div className="mt-8 pt-6 border-t border-border">
                <Link to="/properties">
                  <Button variant="gold" size="lg" className="w-full rounded-full gap-2">
                    Browse Properties <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
