import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { EnquiryForm } from '@/components/experiences/EnquiryForm';
import { useExperience, useActiveExperiences } from '@/hooks/useExperiences';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ExperienceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: experience, isLoading } = useExperience(slug || '');
  const { data: allExperiences } = useActiveExperiences();

  // Get related experiences from same category
  const relatedExperiences = allExperiences?.filter(
    exp => experience && exp.category === experience.category && exp.id !== experience.id
  ).slice(0, 3);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-24">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!experience) {
    return (
      <PageLayout>
        <div className="py-24 text-center">
          <div className="container mx-auto px-4">
            <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-medium mb-4">Experience Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The experience you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/experiences">
              <Button variant="outline" className="rounded-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Experiences
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 hero-gradient texture-overlay overflow-hidden">
        {experience.hero_image_url && (
          <div className="absolute inset-0">
            <img
              src={experience.hero_image_url}
              alt={experience.name}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          </div>
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="mb-4">{experience.category}</Badge>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-foreground mb-6">
              {experience.name}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {experience.description}
            </p>
            
            {/* Quick Info */}
            <div className="flex items-center justify-center gap-6 mt-8">
              {experience.duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{experience.duration}</span>
                </div>
              )}
              {experience.price_from && (
                <div className="flex items-center gap-1 text-primary font-medium">
                  <DollarSign className="h-5 w-5" />
                  <span>From €{experience.price_from}</span>
                  {experience.price_type && (
                    <span className="text-muted-foreground font-normal">
                      /{experience.price_type}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Description & Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-3 space-y-10"
              >
                {/* Long Description */}
                {experience.long_description && (
                  <div>
                    <h2 className="text-2xl font-serif font-medium mb-6">About This Experience</h2>
                    <div className="prose prose-lg text-muted-foreground">
                      <p className="leading-relaxed whitespace-pre-line">
                        {experience.long_description}
                      </p>
                    </div>
                  </div>
                )}

                {/* What's Included */}
                {experience.includes && experience.includes.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-medium mb-6">What's Included</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {experience.includes.map((item, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gallery */}
                {experience.gallery && experience.gallery.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-medium mb-6">Gallery</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {experience.gallery.map((image, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="aspect-square rounded-xl overflow-hidden"
                        >
                          <img
                            src={image}
                            alt={`${experience.name} ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Enquiry Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="sticky top-24">
                  <EnquiryForm 
                    experienceId={experience.id} 
                    experienceName={experience.name} 
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Experiences */}
      {relatedExperiences && relatedExperiences.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">
                Related Experiences
              </h2>
              <p className="text-muted-foreground">
                You might also enjoy these {experience.category.toLowerCase()} experiences
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {relatedExperiences.map((exp, index) => (
                <ExperienceCard key={exp.id} experience={exp} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default ExperienceDetail;
