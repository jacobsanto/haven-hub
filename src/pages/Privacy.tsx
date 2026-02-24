import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageSEO } from '@/components/seo/PageSEO';
import { useBrand } from '@/contexts/BrandContext';

const Privacy = () => {
  const { brandName, contactEmail } = useBrand();
  const lastUpdated = 'January 27, 2026';

  return (
    <PageLayout>
      <PageSEO pageSlug="privacy" defaults={{ meta_title: 'Privacy Policy | Haven Hub', meta_description: 'Read our privacy policy to understand how Haven Hub collects, uses, and protects your personal data.', og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' }} />
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 hero-gradient texture-overlay">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto prose prose-lg"
          >
            <div className="space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  1. Introduction
                </h2>
                <p>
                  At {brandName}, we respect your privacy and are committed to protecting your personal data. 
                  This privacy policy explains how we collect, use, and safeguard your information when you 
                  use our website and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  2. Information We Collect
                </h2>
                <p>We may collect the following types of information:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>Personal Information:</strong> Name, email address, phone number, and billing information when you make a booking.</li>
                  <li><strong>Booking Details:</strong> Property preferences, travel dates, guest counts, and special requests.</li>
                  <li><strong>Communication Data:</strong> Messages you send through our contact forms or email correspondence.</li>
                  <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited and features used.</li>
                  <li><strong>Device Information:</strong> Browser type, IP address, and device identifiers for security and analytics.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  3. How We Use Your Information
                </h2>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Process and manage your bookings</li>
                  <li>Communicate with you about your reservations and inquiries</li>
                  <li>Improve our services and website experience</li>
                  <li>Send relevant marketing communications (with your consent)</li>
                  <li>Comply with legal obligations and prevent fraud</li>
                  <li>Provide customer support</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  4. Information Sharing
                </h2>
                <p>
                  We do not sell your personal information. We may share your data with:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>Property Owners:</strong> To facilitate your booking and stay.</li>
                  <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (payment processors, email services).</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  5. Data Security
                </h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal 
                  data against unauthorized access, alteration, disclosure, or destruction. This includes 
                  encryption, secure servers, and regular security assessments.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  6. Your Rights
                </h2>
                <p>Depending on your location, you may have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Access the personal data we hold about you</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to or restrict certain processing</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  7. Cookies
                </h2>
                <p>
                  We use cookies and similar technologies to enhance your browsing experience, 
                  analyze site traffic, and understand where our visitors come from. You can 
                  control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  8. Data Retention
                </h2>
                <p>
                  We retain your personal data only for as long as necessary to fulfill the purposes 
                  for which it was collected, including satisfying legal, accounting, or reporting requirements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  9. Changes to This Policy
                </h2>
                <p>
                  We may update this privacy policy from time to time. We will notify you of any 
                  significant changes by posting the new policy on this page and updating the 
                  "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  10. Contact Us
                </h2>
                <p>
                  If you have any questions about this privacy policy or our data practices, 
                  please contact us at:
                </p>
                <p className="mt-4">
                  <strong>Email:</strong>{' '}
                  <a 
                    href={`mailto:${contactEmail || 'hello@ariviavillas.com'}`}
                    className="text-primary hover:underline"
                  >
                    {contactEmail || 'hello@ariviavillas.com'}
                  </a>
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Privacy;
