import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBrand } from '@/contexts/BrandContext';

const Terms = () => {
  const { brandName, contactEmail } = useBrand();
  const lastUpdated = 'January 27, 2026';

  return (
    <PageLayout>
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
              Terms of Service
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
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using the {brandName} website and services, you agree to be bound by 
                  these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  2. Services Description
                </h2>
                <p>
                  {brandName} provides an online platform connecting guests with luxury vacation rental 
                  properties. We act as an intermediary between property owners/managers and guests, 
                  facilitating bookings and communications.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  3. Booking and Reservations
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All bookings are subject to availability and confirmation.</li>
                  <li>Prices displayed are per night unless otherwise stated and may not include taxes, fees, or additional charges.</li>
                  <li>You must provide accurate and complete information when making a booking.</li>
                  <li>A booking is confirmed only when you receive a confirmation email from us.</li>
                  <li>You must be at least 18 years old to make a booking.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  4. Cancellation Policy
                </h2>
                <p>
                  Cancellation policies vary by property and will be clearly stated at the time of booking. 
                  Please review the specific cancellation terms before confirming your reservation.
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li><strong>Flexible:</strong> Full refund if cancelled at least 7 days before check-in.</li>
                  <li><strong>Moderate:</strong> Full refund if cancelled at least 14 days before check-in; 50% refund if cancelled at least 7 days before.</li>
                  <li><strong>Strict:</strong> 50% refund if cancelled at least 30 days before check-in; no refund after that.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  5. Guest Responsibilities
                </h2>
                <p>As a guest, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Treat the property with respect and care</li>
                  <li>Comply with all house rules provided by the property owner</li>
                  <li>Not exceed the maximum number of guests stated in your booking</li>
                  <li>Report any damages or issues promptly</li>
                  <li>Leave the property in the condition you found it</li>
                  <li>Not engage in any illegal activities on the premises</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  6. Payment Terms
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment is required at the time of booking unless otherwise specified.</li>
                  <li>We accept major credit cards and other payment methods as displayed on our website.</li>
                  <li>Security deposits may be required for certain properties.</li>
                  <li>All payments are processed securely through our payment partners.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  7. Liability Limitations
                </h2>
                <p>
                  {brandName} acts as an intermediary and is not responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>The condition or accuracy of property listings</li>
                  <li>Personal injury or property damage during your stay</li>
                  <li>Actions or omissions of property owners or third parties</li>
                  <li>Force majeure events that may affect your booking</li>
                </ul>
                <p className="mt-4">
                  We recommend all guests obtain appropriate travel insurance to cover unforeseen circumstances.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  8. Intellectual Property
                </h2>
                <p>
                  All content on this website, including text, images, logos, and design elements, 
                  is owned by {brandName} or its licensors and is protected by copyright and 
                  other intellectual property laws. You may not reproduce, distribute, or use 
                  any content without our written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  9. Privacy
                </h2>
                <p>
                  Your use of our services is also governed by our Privacy Policy. Please review 
                  our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> to 
                  understand how we collect, use, and protect your personal information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  10. Dispute Resolution
                </h2>
                <p>
                  Any disputes arising from these terms or your use of our services shall be 
                  resolved through good-faith negotiation. If a resolution cannot be reached, 
                  disputes will be subject to binding arbitration in accordance with applicable laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  11. Changes to Terms
                </h2>
                <p>
                  We reserve the right to modify these terms at any time. Changes will be effective 
                  immediately upon posting on this page. Your continued use of our services after 
                  any changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-medium text-foreground mb-4">
                  12. Contact Information
                </h2>
                <p>
                  For questions about these Terms of Service, please contact us at:
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

export default Terms;
