import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrustBadges } from '@/components/booking/TrustBadges';

const categories = ['All', 'Culinary', 'Adventure', 'Cultural', 'Wellness'];

const Experiences = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: experiences, isLoading } = useActiveExperiences();

  const filteredExperiences = experiences?.filter(
    exp => selectedCategory === 'All' || exp.category === selectedCategory
  );

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 hero-gradient texture-overlay overflow-hidden">
        <div className="absolute top-10 left-20 w-64 h-64 bg-primary/5 organic-blob animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/10 organic-blob" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Curated</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-foreground mb-6">
              Enhance Your Stay
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
              Add unforgettable experiences to your booking. Curated adventures available 
              exclusively for our guests.
            </p>
            <Link to="/properties">
              <Button size="lg" variant="outline" className="rounded-full gap-2">
                <Home className="h-4 w-4" />
                Book a Property First
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 bg-background border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
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
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-organic">
                  <Skeleton className="aspect-[4/3] rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredExperiences && filteredExperiences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredExperiences.map((experience, index) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-medium mb-2">
                {selectedCategory === 'All' ? 'No Experiences Yet' : `No ${selectedCategory} Experiences`}
              </h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'All' 
                  ? "We're adding new experiences soon. Check back later!"
                  : 'Try a different category or check back later.'}
              </p>
            </div>
          )}

          {/* Property Booking CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="card-organic p-8 max-w-3xl mx-auto bg-primary/5 border-primary/20">
              <h3 className="text-2xl font-serif font-medium mb-4">
                Complete Your Trip
              </h3>
              <p className="text-muted-foreground mb-6">
                These experiences are available exclusively for guests staying at our properties.
                Book your luxury accommodation first, then add experiences to your stay.
              </p>
              <Link to="/properties">
                <Button size="lg" className="rounded-full gap-2">
                  Browse & Book Properties
                  <ArrowRight className="h-4 w-4" />
                </Button>
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
