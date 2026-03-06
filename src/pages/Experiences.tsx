import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeroBanner } from '@/components/ui/PageHeroBanner';
import { CategoryFilterTabs } from '@/components/ui/CategoryFilterTabs';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const categories = [
  { id: 'All', label: 'All Experiences' },
  { id: 'Adventure', label: 'Adventure' },
  { id: 'Culinary', label: 'Culinary' },
  { id: 'Wellness', label: 'Wellness' },
  { id: 'Cultural', label: 'Culture' },
];

const Experiences = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: experiences, isLoading } = useActiveExperiences();

  const ctaContent = usePageContent('experiences', 'cta', {
    heading: 'Complete Your Trip',
    subtitle: 'These experiences are available exclusively for guests staying at our properties.',
  });

  const filteredExperiences = experiences?.filter(
    exp => selectedCategory === 'All' || exp.category === selectedCategory
  );

  return (
    <PageLayout>
      <PageSEO pageSlug="experiences" defaults={{ meta_title: 'Curated Experiences | Haven Hub', meta_description: 'Enhance your luxury stay with curated experiences.', og_image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80' }} />

      {/* Hero */}
      <PageHeroBanner
        label="Curated Experiences"
        labelIcon={Compass}
        title={
          <>
            Beyond the <em className="font-normal text-accent italic">Villa</em>
          </>
        }
        subtitle="Handcrafted by local experts — every experience designed to reveal the soul of your destination."
        backgroundImage="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&q=50"
      />

      {/* Category Filter */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1200px] mx-auto px-[5%] py-3.5">
          <CategoryFilterTabs
            categories={categories}
            activeCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      </div>

      {/* Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-[1200px] mx-auto px-[5%]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredExperiences && filteredExperiences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((experience, index) => (
                <ExperienceCard key={experience.id} experience={experience} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Compass className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
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
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
              <h3 className="text-2xl font-serif font-semibold mb-3">{ctaContent.heading}</h3>
              <p className="text-muted-foreground mb-6">{ctaContent.subtitle}</p>
              <Link to="/properties">
                <Button size="lg" className="gap-2">Browse & Book Properties <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Experiences;
