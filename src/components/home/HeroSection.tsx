import { motion, useReducedMotion } from 'framer-motion';
import { SearchBar } from '@/components/search/SearchBar';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';

export function HeroSection() {
  const { showSearchBar, featuredPropertyId, heroBackgroundImage } = useHeroSettings();
  const { data: properties } = useFeaturedProperties();
  const { brandName } = useBrand();
  const prefersReduced = useReducedMotion();

  const hero = usePageContent('home', 'hero', {
    heading_prefix: 'You Are Here Already',
    subtitle_with_property: 'Book a luxury villa in {city}, {country}',
    subtitle_default: 'We believe in quality, personal contact with the visitor on a daily basis, and the effectiveness achieved by adopting our high standards.',
  });

  const heroProperty = featuredPropertyId === 'auto'
    ? properties?.[0]
    : properties?.find(p => p.id === featuredPropertyId) || properties?.[0];
  const heroImageUrl = heroBackgroundImage || heroProperty?.hero_image_url;

  return (
    <section className="relative h-screen flex flex-col justify-end overflow-hidden">
      {/* Background */}
      {heroImageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 hero-gradient texture-overlay" />
      )}

      {/* Content - left aligned, bottom portion */}
      <div className="relative z-10 container mx-auto px-4 pb-32 md:pb-40">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white mb-4 uppercase tracking-wide leading-tight">
            {hero.heading_prefix || brandName}
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-xl leading-relaxed">
            {hero.subtitle_default}
          </p>
        </motion.div>

        {/* Search bar */}
        {showSearchBar && (
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 max-w-xl"
          >
            <SearchBar variant="hero" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
