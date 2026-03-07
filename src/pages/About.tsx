import { motion, useReducedMotion } from 'framer-motion';
import { GrainOverlay } from '@/components/home/hero/GrainOverlay';
import { Link } from 'react-router-dom';
import { Heart, Shield, Sparkles, ArrowRight, Star, Mail, Phone, Headphones, MapPin, Users, Home, Globe, Award, CheckCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';
import { useProperties } from '@/hooks/useProperties';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { PageSEO } from '@/components/seo/PageSEO';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { InlineContactForm } from '@/components/contact/InlineContactForm';
import { resolveIcon } from '@/utils/icon-resolver';
import { fadeUp, viewportOnce, getReducedMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';

const defaultValueIcons = [Heart, Shield, Sparkles];

const teamMembers = [
  { name: 'Sofia Laurent', role: 'Co-Founder & CEO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', bio: 'A lifelong traveler who turned her passion for luxury hospitality into a global brand.' },
  { name: 'Marco Vitale', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', bio: 'Ensures every property meets our exacting standards for guest satisfaction.' },
  { name: 'Amara Chen', role: 'Guest Experience Lead', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', bio: 'Crafts bespoke experiences that transform trips into unforgettable memories.' },
];

const timeline = [
  { year: '2019', title: 'The Beginning', desc: 'Founded with just 3 hand-picked villas in the Mediterranean.' },
  { year: '2020', title: 'Digital Pivot', desc: 'Launched virtual tours and contactless check-in during global challenges.' },
  { year: '2022', title: 'Global Expansion', desc: 'Expanded to 50+ properties across 12 destinations worldwide.' },
  { year: '2024', title: 'Award-Winning', desc: 'Recognized as a top luxury villa rental platform by Travel + Leisure.' },
];

const inspectionItems = [
  'Professional-grade linens & towels',
  'Full kitchen equipment inventory',
  'Safety & emergency systems check',
  'Pool & outdoor area inspection',
  'WiFi speed verification (100Mbps+)',
  'Concierge service response test',
];

const About = () => {
  const { brandName, contactEmail, contactPhone } = useBrand();
  const { data: properties } = useProperties();
  const { data: destinations } = useActiveDestinations();
  const prefersReduced = useReducedMotion();
  const v = getReducedMotionVariants(fadeUp, prefersReduced);

  const heroContent = usePageContent('about', 'hero', {
    heading: 'Our Story',
    subtitle: 'Bridging the world, one unforgettable stay at a time.',
    hero_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
  });
  const storyContent = usePageContent('about', 'our_story', {
    heading: 'How It All Began',
    paragraph_1: '{brandName} was born from a simple belief: that the right vacation home can transform an ordinary trip into an extraordinary memory.',
    paragraph_2: 'Our founders, avid travelers themselves, noticed a gap — stunning properties often came with impersonal service, while personalized attention was reserved for only the most exclusive bookings.',
    paragraph_3: "Today, we offer a carefully curated collection of villas across the world's most desirable destinations.",
    story_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  });
  const valuesContent = usePageContent('about', 'values', {
    heading: 'Our Values',
    value_1_icon: 'Heart', value_1_title: 'Passion for Excellence', value_1_description: 'Every property is chosen with care, ensuring exceptional quality and authentic character.',
    value_2_icon: 'Shield', value_2_title: 'Trust & Transparency', value_2_description: 'Honest communication, real photos, and straightforward pricing — always.',
    value_3_icon: 'Sparkles', value_3_title: 'Curated Luxury', value_3_description: 'Each villa is personally vetted against our 87-point quality inspection.',
  });
  const missionContent = usePageContent('about', 'mission', {
    heading: 'Our Mission',
    paragraph_1: 'We believe travel should be transformative. Our mission is to connect discerning travelers with exceptional homes in the most inspiring destinations worldwide.',
    paragraph_2: 'Every stay we curate is designed to create lasting memories — blending local culture, stunning architecture, and personalized service.',
  });

  const r = (text: string) => text.replace(/{brandName}/g, brandName);

  const values = [1, 2, 3].map((i) => ({
    icon: resolveIcon(valuesContent[`value_${i}_icon` as keyof typeof valuesContent] as string, defaultValueIcons[i - 1]),
    title: valuesContent[`value_${i}_title` as keyof typeof valuesContent] as string,
    description: valuesContent[`value_${i}_description` as keyof typeof valuesContent] as string,
  }));

  const totalProperties = properties?.length || 0;
  const totalDestinations = destinations?.length || 0;

  return (
    <PageLayout>
      <PageSEO pageSlug="about" defaults={{ meta_title: `About Us | ${brandName}`, meta_description: `Learn about ${brandName}'s story, values, and commitment to extraordinary luxury vacation experiences.`, og_image: heroContent.hero_image }} />

      {/* ─── Hero ─── */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroContent.hero_image}')` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/40 to-foreground/20" />
        <div className="container mx-auto px-4 relative z-10 h-full flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/70 mb-4">About Us</p>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-background mb-4">
              {r(heroContent.heading)}
            </h1>
            <p className="text-lg text-background/80 max-w-xl mx-auto">{r(heroContent.subtitle)}</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Origin Story ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Our Story</p>
              <h2 className="text-2xl md:text-4xl font-serif font-medium text-foreground mb-6 leading-snug">
                {r(storyContent.heading)}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{r(storyContent.paragraph_1)}</p>
                <p>{r(storyContent.paragraph_2)}</p>
                <p>{r(storyContent.paragraph_3)}</p>
              </div>

              {/* Floating stat card */}
              <div className="mt-8 inline-flex items-center gap-4 bg-card border border-border rounded-xl p-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-serif font-semibold text-foreground">5 Years</p>
                  <p className="text-xs text-muted-foreground">of curating exceptional stays</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce} className="relative">
              <img
                src={storyContent.story_image}
                alt="Our story"
                className="w-full aspect-[4/5] object-cover rounded-2xl"
              />
              {/* Floating quote */}
              <div className="absolute bottom-6 left-6 right-6 bg-card/90 backdrop-blur-lg border border-border rounded-xl p-5">
                <p className="text-sm italic text-foreground leading-relaxed">
                  "We don't just list properties — we curate experiences that become stories worth telling."
                </p>
                <p className="text-xs text-accent mt-2 font-medium">— Sofia Laurent, Co-Founder</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-12 bg-muted border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: totalProperties || '50+', label: 'Curated Villas', icon: Home },
              { value: totalDestinations || '12', label: 'Destinations', icon: Globe },
              { value: '4.9', label: 'Avg. Rating', icon: Star },
              { value: '10,000+', label: 'Happy Guests', icon: Users },
            ].map((stat, i) => (
              <motion.div key={i} variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
                <stat.icon className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-serif font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce} className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">What We Stand For</p>
            <h2 className="text-2xl md:text-4xl font-serif font-medium text-foreground">{valuesContent.heading}</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {values.map((value, i) => (
              <motion.div key={i} variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce} className="bg-card border border-border rounded-2xl p-8 text-center hover:border-accent/20 transition-colors">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent/10 flex items-center justify-center">
                  <value.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-serif font-medium text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 87-Point Inspection ─── */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
                alt="Quality inspection"
                className="w-full aspect-[4/3] object-cover rounded-2xl"
              />
            </motion.div>
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Quality Guarantee</p>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-4">
                Our 87-Point <em className="italic text-accent">Inspection</em>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Every property in our collection undergoes a rigorous multi-day inspection before being listed. We check everything from linens to WiFi speeds.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inspectionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Team ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce} className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">The People</p>
            <h2 className="text-2xl md:text-4xl font-serif font-medium text-foreground">Meet the Team</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <motion.div key={member.name} variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce} className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/20 transition-colors">
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif font-medium text-foreground">{member.name}</h3>
                  <p className="text-xs text-accent uppercase tracking-wider mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Timeline ─── */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce} className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Our Journey</p>
            <h2 className="text-2xl md:text-4xl font-serif font-medium text-foreground">Timeline</h2>
          </motion.div>
          <div className="relative border-l-2 border-border pl-8 space-y-10">
            {timeline.map((item, i) => (
              <motion.div key={i} variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce} className="relative">
                <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-accent border-4 border-muted" />
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-1">{item.year}</p>
                <h3 className="font-serif font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact CTA ─── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Get in Touch</p>
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-6">
                Talk to a <em className="italic text-accent">Human</em>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">{r(missionContent.paragraph_1)}</p>
              {missionContent.paragraph_2 && <p className="text-muted-foreground leading-relaxed mb-8">{r(missionContent.paragraph_2)}</p>}
              <div className="space-y-4 mb-8">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><Mail className="h-4 w-4 text-accent" /></div>
                    {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><Phone className="h-4 w-4 text-accent" /></div>
                    {contactPhone}
                  </a>
                )}
              </div>
              <Link to="/properties">
                <Button variant="gold" size="lg" className="rounded-full gap-2">
                  Browse Our Collection <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={v} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <InlineContactForm />
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
