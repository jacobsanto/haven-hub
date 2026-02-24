import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContactForm } from '@/components/contact/ContactForm';
import { useBrand } from '@/contexts/BrandContext';

const Contact = () => {
  const { brandName, contactEmail, contactPhone, contactAddress } = useBrand();

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: contactEmail || 'hello@ariviavillas.com',
      href: `mailto:${contactEmail || 'hello@ariviavillas.com'}`,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: contactPhone || '+1 (234) 567-890',
      href: `tel:${contactPhone || '+12345678901'}`,
    },
    {
      icon: MapPin,
      label: 'Address',
      value: contactAddress || '123 Luxury Lane, Paradise City',
      href: null,
    },
    {
      icon: Clock,
      label: 'Response Time',
      value: 'Within 24-48 hours',
      href: null,
    },
  ];

  return (
    <PageLayout>
      {/* Hero Section - Image Background */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              Have a question or ready to plan your next luxury escape? 
              We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-3"
              >
                <h2 className="text-2xl md:text-3xl font-serif font-medium mb-6">
                  Send Us a Message
                </h2>
                <ContactForm />
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <h2 className="text-2xl md:text-3xl font-serif font-medium mb-6">
                  Contact Information
                </h2>
                
                <div className="space-y-6">
                  {contactInfo.map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold-accent/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-gold-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                        {item.href ? (
                          <a 
                            href={item.href}
                            className="text-foreground font-medium hover:text-gold-accent transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-foreground font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Info Card */}
                <div className="mt-10 card-organic p-6 bg-warm-cream">
                  <h3 className="font-serif font-medium mb-3">Need Immediate Assistance?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    For urgent booking inquiries or assistance during your stay, 
                    our concierge team is available around the clock. Simply call 
                    our priority line and we'll be happy to help.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="bg-warm-cream">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-3xl font-serif font-medium mb-4">
              Visit Our Office
            </h2>
            <p className="text-muted-foreground mb-8">
              While our properties span the globe, our headquarters is where the magic begins.
            </p>
            <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center border border-border">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {contactAddress || '123 Luxury Lane, Paradise City'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
