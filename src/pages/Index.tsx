import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchBar } from '@/components/search/SearchBar';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useBrand } from '@/contexts/BrandContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { data: properties, isLoading } = useFeaturedProperties();
  const { brandName } = useBrand();

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center hero-gradient texture-overlay overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 organic-blob animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 organic-blob" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-primary">Escape</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover extraordinary vacation homes in the world's most desirable destinations. 
              Luxury living, reimagined for unforgettable experiences.
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              Featured Properties
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Handpicked luxury homes that offer the perfect blend of comfort, 
              style, and unforgettable experiences.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-organic animate-pulse">
                  <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property, index) => (
                <PropertyCard key={property.id} property={property} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No properties available yet. Check back soon!
              </p>
            </div>
          )}

          {properties && properties.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link to="/properties">
                <Button variant="outline" size="lg" className="rounded-full gap-2">
                  View All Properties
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              Why Choose {brandName}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: 'Curated Selection',
                description: 'Every property is personally vetted for quality, comfort, and exceptional experiences.',
              },
              {
                title: 'Seamless Booking',
                description: 'Simple, transparent booking process with instant confirmation and flexible policies.',
              },
              {
                title: 'Dedicated Support',
                description: '24/7 concierge service to ensure your stay exceeds expectations.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-serif text-primary">{index + 1}</span>
                </div>
                <h3 className="text-xl font-serif font-medium mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium mb-6">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-lg opacity-80 mb-8">
              Start exploring our collection of extraordinary vacation homes today.
            </p>
            <Link to="/properties">
              <Button
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                Browse Properties
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
