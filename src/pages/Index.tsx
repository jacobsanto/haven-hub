import { PageLayout } from '@/components/layout/PageLayout';
import { PageSEO } from '@/components/seo/PageSEO';
import { HeroSection } from '@/components/home/HeroSection';
import { TrustSection } from '@/components/home/TrustSection';
import { DestinationsShowcase } from '@/components/home/DestinationsShowcase';
import { DiscoverVillasSection } from '@/components/home/DiscoverVillasSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { FeaturedVacationSection } from '@/components/home/FeaturedVacationSection';
import { LiveExperiencesSection } from '@/components/home/LiveExperiencesSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';

const Index = () => {
  return (
    <PageLayout>
      <PageSEO
        pageSlug="home"
        defaults={{
          meta_title: 'Arivia Villas | Luxury Vacation Homes',
          meta_description: 'Discover extraordinary luxury vacation homes in the world\'s most desirable destinations.',
          og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
        }}
      />

      <HeroSection />
      <TrustSection />
      <DestinationsShowcase />
      <DiscoverVillasSection />
      <FeaturesSection />
      <FeaturedVacationSection />
      <LiveExperiencesSection />
      <TestimonialsSection />
    </PageLayout>
  );
};

export default Index;
