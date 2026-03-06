import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrustBadges } from '@/components/booking/TrustBadges';

const categories = ['All', 'Culinary', 'Adventure', 'Cultural', 'Wellness'];

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1400&q=80';

const Experiences = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: experiences, isLoading } = useActiveExperiences();

  const ctaContent = usePageContent('experiences', 'cta', {
    heading: 'Complete Your Trip',
    subtitle: 'These experiences are available exclusively for guests staying at our properties. Book your luxury accommodation first, then add experiences to your stay.',
  });

  const filteredExperiences = experiences?.filter(
    exp => selectedCategory === 'All' || exp.category === selectedCategory
  );

  const featuredHero = experiences?.find(e => e.is_featured)?.hero_image_url || HERO_FALLBACK;

  return (
    <PageLayout>
      <PageSEO pageSlug="experiences" defaults={{ meta_title: 'Curated Experiences | Haven Hub', meta_description: 'Enhance your luxury stay with curated experiences — culinary adventures, cultural immersions, and more.', og_image: featuredHero }} />

      {/* Full-width Image Banner */}
      <section className="relative w-full h-[300px] md:h-[420px] overflow-hidden">
        <img
          src={featuredHero}
          alt="Curated local experiences"
          className="w-full h-full object-cover"
        />
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mb-8"
          >
            <h1 className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">Curated Experiences</h1>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">
              CURATED LOCAL EXPERIENCES
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Enhance your stay with handpicked adventures — from culinary journeys to cultural immersions, each experience is designed to create lasting memories.
            </p>
          </motion.div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-10">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Experience Cards Grid */}
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-4 bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="w-full md:w-[200px] aspect-square bg-muted" />
                  <div className="flex-1 p-5 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredExperiences && filteredExperiences.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredExperiences.map((experience, index) => (
                <ExperienceCard key={experience.id} experience={experience} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-medium mb-2">
                {selectedCategory === 'All' ? 'No Experiences Yet' : `No ${selectedCategory} Experiences`}
              </h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'All' ? "We're adding new experiences soon." : 'Try a different category.'}
              </p>
            </div>
          )}

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 text-center">
            <div className="bg-card border border-border rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-serif font-medium mb-4">{ctaContent.heading}</h3>
              <p className="text-muted-foreground mb-6">{ctaContent.subtitle}</p>
              <Link to="/properties">
                <Button size="lg" className="rounded-full gap-2">Browse & Book Properties <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <div className="mt-6">
                <TrustBadges variant="compact" badges={['price', 'instant']} className="justify-center" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Experiences;
