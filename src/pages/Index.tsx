import { PageLayout } from '@/components/layout/PageLayout';
import { PageSEO } from '@/components/seo/PageSEO';
import { HeroSection } from '@/components/home/HeroSection';
import { SearchBarOverlay } from '@/components/home/SearchBarOverlay';
import { TrustSection } from '@/components/home/TrustSection';
import { DestinationsShowcase } from '@/components/home/DestinationsShowcase';
import { DiscoverVillasSection } from '@/components/home/DiscoverVillasSection';
import { FeaturedVacationSection } from '@/components/home/FeaturedVacationSection';
import { LiveExperiencesSection } from '@/components/home/LiveExperiencesSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { WhyDirectSection } from '@/components/home/WhyDirectSection';
import { CTASection } from '@/components/home/CTASection';
import { GrainOverlay } from '@/components/home/hero/GrainOverlay';

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

      <div className="relative bg-background">
        {/* Global grain for entire homepage */}
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          <GrainOverlay />
        </div>

        <HeroSection />
        <SearchBarOverlay />
        <div className="pt-12">
          <TrustSection />
          <DestinationsShowcase />
          <DiscoverVillasSection />
          <FeaturedVacationSection />
          <LiveExperiencesSection />
          <TestimonialsSection />
          <WhyDirectSection />
          <CTASection />
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
