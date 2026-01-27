import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Shield, Sparkles, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBrand } from '@/contexts/BrandContext';
import { Button } from '@/components/ui/button';

const values = [
  {
    icon: Heart,
    title: 'Passion for Excellence',
    description: 'Every property in our collection is chosen with care, ensuring exceptional quality and unforgettable experiences.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We believe in honest communication and straightforward booking, with no hidden fees or surprises.',
  },
  {
    icon: Sparkles,
    title: 'Curated Luxury',
    description: 'Our team personally vets each villa to guarantee it meets our exacting standards for comfort and style.',
  },
  {
    icon: Users,
    title: 'Personal Service',
    description: 'From your first inquiry to checkout, our dedicated concierge team is here to make your stay seamless.',
  },
];

const stats = [
  { value: '10+', label: 'Years of Excellence' },
  { value: '25+', label: 'Luxury Properties' },
  { value: '5000+', label: 'Happy Guests' },
  { value: '15+', label: 'Destinations' },
];

const About = () => {
  const { brandName, brandTagline } = useBrand();

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 hero-gradient texture-overlay overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 organic-blob animate-pulse" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/10 organic-blob" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-foreground mb-6">
              About {brandName}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {brandTagline || 'Crafting extraordinary vacation experiences in the world\'s most beautiful destinations.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-6">
                Our Story
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="prose prose-lg max-w-none text-muted-foreground text-center"
            >
              <p className="mb-6 leading-relaxed">
                {brandName} was born from a simple belief: that the right vacation home can transform 
                an ordinary trip into an extraordinary memory. What began as a passion project 
                curating exceptional properties has grown into a trusted name in luxury villa rentals.
              </p>
              <p className="mb-6 leading-relaxed">
                Our founders, avid travelers themselves, noticed a gap in the market—stunning 
                properties often came with impersonal service, while personalized attention was 
                reserved for only the most exclusive bookings. We set out to change that.
              </p>
              <p className="leading-relaxed">
                Today, we offer a carefully curated collection of villas across the world's most 
                desirable destinations. Each property is personally inspected, each host relationship 
                nurtured, and each guest treated as if they're our only one.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-organic p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-serif font-medium mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 md:py-28 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-serif font-medium text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base opacity-80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">
              Ready to Experience the Difference?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Browse our collection of handpicked luxury villas and find your perfect escape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/properties">
                <Button size="lg" className="rounded-full px-8">
                  Explore Properties
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
