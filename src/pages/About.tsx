import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Shield, Sparkles, ArrowRight, Star, Mail, Phone, Headphones, MapPin, Eye, Fingerprint, Leaf, Gem, Check, Quote } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeroBanner } from '@/components/ui/PageHeroBanner';
import { StatCounter } from '@/components/ui/StatCounter';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { InlineContactForm } from '@/components/contact/InlineContactForm';
import { resolveIcon } from '@/utils/icon-resolver';

const defaultValueIcons = [Heart, Shield, Sparkles];

const teamMembers = [
  { name: 'Sofia Laurent', role: 'Co-Founder & CEO', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'Marco Vitale', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Amara Chen', role: 'Guest Experience Lead', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
  { name: 'James Okafor', role: 'Property Curator', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
  { name: 'Elena Petrova', role: 'Marketing Director', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
  { name: 'David Moreno', role: 'Tech Lead', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
];

const timeline = [
  { year: '2018', title: 'The First Villa', desc: 'Our founders curate the first 3 villas, operating from a notebook and passionate dreams.' },
  { year: '2019', title: 'Italy Expansion', desc: 'Tuscany and the Amalfi Coast join the collection.' },
  { year: '2021', title: 'Asia & Indian Ocean', desc: 'Bali and Maldives open up. We launch our concierge-first model.' },
  { year: '2023', title: 'Experiences Launch', desc: 'Curated local experiences become a core part of every stay.' },
  { year: '2026', title: 'Today', desc: 'A growing collection of extraordinary villas across multiple destinations.' },
];

const values = [
  { icon: Eye, title: 'Obsessive Curation', desc: 'Every villa is personally visited, tested, and vetted. If it doesn\'t feel extraordinary, it doesn\'t make the cut.' },
  { icon: Fingerprint, title: 'Genuine Hospitality', desc: 'We don\'t automate warmth. Every guest gets a real human concierge who knows their destination and their name.' },
  { icon: Leaf, title: 'Responsible Travel', desc: 'We partner with properties that protect their environments — coral restoration, plastic-free operations, community employment.' },
  { icon: Gem, title: 'Details Over Everything', desc: 'The linen thread count. The morning sun angle on the terrace. The local olive oil in the welcome basket. We notice.' },
];

const press = [
  { name: 'Condé Nast Traveller', quote: 'The villa collection for people who\'ve outgrown the mainstream' },
  { name: 'Financial Times', quote: 'A refreshingly personal approach to luxury villa rentals' },
  { name: 'Monocle', quote: 'Curation still beats algorithm' },
  { name: 'Wallpaper*', quote: 'Design-led hospitality with genuine soul' },
];

const About = () => {
  const { brandName, contactEmail, contactPhone } = useBrand();
  const prefersReduced = useReducedMotion();

  const heroContent = usePageContent('about', 'hero', {
    heading: 'We Believe Every Detail Matters',
    hero_image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=80',
  });
  const storyContent = usePageContent('about', 'our_story', {
    heading: 'A Notebook, a Phone, and Three Villas',
    paragraph_1: `${brandName} was born from a simple conviction: the best travel experiences are built on genuine care, obsessive curation, and people who love what they do.`,
    paragraph_2: 'Our founder quit a 200-room luxury hotel to start something personal — handshake deals with villa owners, bookings in a notebook, and hospitality that felt real.',
    paragraph_3: 'Today, we offer a carefully curated collection across the world\'s most desirable destinations.',
  });

  const m = (delay = 0) => prefersReduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay, duration: 0.6 } };

  return (
    <PageLayout>
      <PageSEO pageSlug="about" defaults={{ meta_title: `About Us | ${brandName}`, meta_description: `Learn about ${brandName}'s story, values, and commitment to extraordinary luxury stays.`, og_image: heroContent.hero_image }} />

      {/* Hero */}
      <section className="relative h-[75vh] min-h-[500px] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img src={heroContent.hero_image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/70" />
        </div>
        <motion.div {...m()} className="relative z-10 text-center max-w-[700px] px-[5%]">
          <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-5">Our Story</p>
          <h1 className="font-serif text-[clamp(36px,5.5vw,64px)] font-bold text-foreground leading-[1.05] mb-4">
            We Believe Every <em className="font-normal text-accent italic">Detail</em> Matters
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-[520px] mx-auto">
            {brandName} was born from a simple conviction: the best travel experiences are built on genuine care, obsessive curation, and people who love what they do.
          </p>
          <div className="w-12 h-px bg-accent mx-auto mt-7" />
        </motion.div>
      </section>

      {/* Origin Story */}
      <section className="py-24 bg-background">
        <div className="max-w-[1100px] mx-auto px-[5%] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...m()}>
            <p className="font-sans text-[11px] tracking-[0.25em] text-destructive uppercase mb-3.5">How It Started</p>
            <h2 className="font-serif text-[clamp(28px,3.5vw,42px)] font-bold text-foreground leading-[1.1] mb-5">
              {storyContent.heading.replace(/{brandName}/g, brandName)}
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground/60 leading-relaxed">
              <p>{storyContent.paragraph_1.replace(/{brandName}/g, brandName)}</p>
              <p>{storyContent.paragraph_2.replace(/{brandName}/g, brandName)}</p>
            </div>
            <p className="text-sm text-muted-foreground italic mt-6 leading-relaxed">
              "{storyContent.paragraph_3.replace(/{brandName}/g, brandName)}"
            </p>
          </motion.div>

          <motion.div {...m(0.2)} className="relative">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img src="https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=700&q=80" alt="Villa view" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 -left-5 bg-card border border-border rounded-xl p-5 shadow-lg">
              <p className="font-serif text-4xl font-bold text-accent">2018</p>
              <p className="font-sans text-[11px] text-muted-foreground/60 tracking-[0.1em] uppercase">Founded</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-muted border-t border-b border-border">
        <div className="max-w-[1100px] mx-auto px-[5%]">
          <SectionHeading
            label="What We Stand For"
            title={<>Four Principles, <em className="font-normal text-accent italic">Zero Compromise</em></>}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div key={i} {...m(i * 0.1)} className="bg-card border border-border rounded-2xl p-8 transition-all duration-400 hover:border-accent/30">
                  <div className="w-13 h-13 rounded-xl bg-muted border border-border flex items-center justify-center mb-5">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2.5">{v.title}</h3>
                  <p className="font-sans text-sm text-muted-foreground/60 leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <StatCounter
        className="bg-background"
        stats={[
          { value: '42', label: 'Handpicked Villas' },
          { value: '6', label: 'Destinations' },
          { value: '2,400', label: 'Guest Stays', suffix: '+' },
          { value: '4.9', label: 'Average Rating' },
          { value: '87', label: 'Point Inspection', suffix: '-pt' },
          { value: '< 1', label: 'Response Time', suffix: 'hr' },
        ]}
      />

      {/* Timeline */}
      <section className="py-24 bg-muted border-t border-border">
        <div className="max-w-[800px] mx-auto px-[5%]">
          <SectionHeading
            label="Our Journey"
            title={<>From Three Villas to <em className="font-normal text-accent italic">Global Collection</em></>}
          />
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            {timeline.map((item, i) => (
              <motion.div key={i} {...m(i * 0.1)} className="relative pl-12 pb-10 last:pb-0">
                <div className="absolute left-0 top-1 w-9 h-9 rounded-full bg-card border-2 border-accent flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                </div>
                <p className="font-serif text-2xl font-bold text-accent mb-1">{item.year}</p>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-background">
        <div className="max-w-[1100px] mx-auto px-[5%]">
          <SectionHeading
            label="The People"
            title={<>Meet the <em className="font-normal text-accent italic">Team</em></>}
            subtitle="A small, obsessive team of hospitality professionals who believe the details matter most."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => (
              <motion.div key={member.name} {...m(i * 0.1)} className="group text-center bg-card border border-border rounded-2xl p-6 transition-all hover:border-accent/30">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-border group-hover:border-accent/50 transition-colors">
                  <AvatarImage src={member.image} alt={member.name} />
                  <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <p className="font-serif text-base font-semibold text-foreground">{member.name}</p>
                <p className="font-sans text-xs text-muted-foreground mt-1">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Press */}
      <section className="py-20 bg-muted border-t border-border">
        <div className="max-w-[1100px] mx-auto px-[5%]">
          <SectionHeading label="Press" title={<>What They <em className="font-normal text-accent italic">Say</em></>} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {press.map((p, i) => (
              <motion.div key={i} {...m(i * 0.08)} className="bg-card border border-border rounded-xl p-6">
                <Quote className="h-5 w-5 text-accent/40 mb-3" />
                <p className="font-serif text-sm italic text-muted-foreground leading-relaxed mb-3">{p.quote}</p>
                <p className="font-sans text-xs text-accent font-semibold">{p.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-[1100px] mx-auto px-[5%] grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <SectionHeading align="left" label="Get in Touch" title={<>Let's Plan Your <em className="font-normal text-accent italic">Next Stay</em></>} />
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
            <Link to="/properties">
              <Button size="lg" className="gap-2">
                Browse Properties <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <InlineContactForm />
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
