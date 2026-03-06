import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Search, X, HelpCircle, ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeroBanner } from '@/components/ui/PageHeroBanner';
import { CategoryFilterTabs } from '@/components/ui/CategoryFilterTabs';
import { ContactForm } from '@/components/contact/ContactForm';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'booking', label: 'Booking & Payments' },
  { id: 'stay', label: 'Your Stay' },
  { id: 'cancellation', label: 'Cancellation' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'policies', label: 'Policies' },
];

const FAQS = [
  { id: '1', cat: 'booking', q: 'How do I book a villa?', a: 'Browse our collection, select your dates and guests, choose any add-on experiences, and complete payment. You\'ll receive an instant confirmation email with your booking reference, directions, and concierge contact details.', popular: true },
  { id: '2', cat: 'booking', q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, American Express, and Apple Pay. All payments are processed securely with 256-bit SSL encryption.' },
  { id: '3', cat: 'booking', q: 'Is a deposit required?', a: 'Yes. A 30% deposit is charged at booking. The remaining 70% is charged 30 days before check-in. For bookings within 30 days of arrival, the full amount is charged immediately.', popular: true },
  { id: '4', cat: 'stay', q: 'What time is check-in and check-out?', a: 'Standard check-in is from 3:00 PM and check-out is by 11:00 AM. Early check-in or late check-out can often be arranged — just let your concierge know.', popular: true },
  { id: '5', cat: 'stay', q: 'Will someone meet us at the villa?', a: 'Yes. Every stay begins with a personal welcome. The villa manager or a concierge team member will meet you, give a full walkthrough, and share local tips.' },
  { id: '6', cat: 'stay', q: 'Is housekeeping included?', a: 'Daily housekeeping is included at most villas (typically once per day, 6 days per week). The exact frequency is listed on each villa\'s page.' },
  { id: '7', cat: 'cancellation', q: 'What is your cancellation policy?', a: 'Each villa has a cancellation tier clearly shown during checkout: Free (full refund 14 days before), Moderate (full refund 7 days before), or Strict (50% refund 14 days before).', popular: true },
  { id: '8', cat: 'cancellation', q: 'Can I change my dates after booking?', a: 'Yes, subject to availability. Date changes more than 14 days before check-in are free. Changes within 14 days may incur a fee.' },
  { id: '9', cat: 'experiences', q: 'How do I book experiences?', a: 'Add experiences during checkout (Step 2) or request them any time through your concierge. Popular experiences should be booked at least 48 hours in advance.' },
  { id: '10', cat: 'experiences', q: 'Can you arrange a private chef?', a: 'Yes — it\'s one of our most popular add-ons. Private chef experiences include a 3-course dinner prepared in your villa kitchen. Prices start from €180 per evening.' },
  { id: '11', cat: 'policies', q: 'Are the villas insured?', a: 'Every villa carries comprehensive property and public liability insurance. We still recommend guests carry personal travel insurance.' },
  { id: '12', cat: 'policies', q: 'What is your sustainability commitment?', a: 'We prioritize partner villas that demonstrate environmental responsibility — including solar energy, water recycling, plastic-free operations, and community employment.' },
];

const Contact = () => {
  const { brandName, contactEmail, contactPhone, contactAddress } = useBrand();
  const [searchVal, setSearchVal] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const prefersReduced = useReducedMotion();

  const heroContent = usePageContent('contact', 'hero', {
    heading: 'How Can We Help?',
    subtitle: 'Everything you need to know about booking, staying, and experiencing a luxury villa.',
  });

  const filteredFaqs = useMemo(() => {
    let faqs = FAQS;
    if (activeCat !== 'all') faqs = faqs.filter(f => f.cat === activeCat);
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      faqs = faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    }
    return faqs;
  }, [activeCat, searchVal]);

  const popularFaqs = FAQS.filter(f => f.popular);

  const m = (delay = 0) => prefersReduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay, duration: 0.6 } };

  return (
    <PageLayout>
      <PageSEO pageSlug="contact" defaults={{ meta_title: `Help & Contact | ${brandName}`, meta_description: 'Find answers to common questions or get in touch with our team.', og_image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80' }} />

      {/* Hero with Search */}
      <PageHeroBanner
        label="Help Centre"
        labelIcon={HelpCircle}
        title={
          <>
            How Can We <em className="font-normal text-accent italic">Help?</em>
          </>
        }
        subtitle={heroContent.subtitle}
        backgroundImage="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1400&q=50"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-[520px] mx-auto mt-8"
        >
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3.5 shadow-lg">
            <Search className="h-[18px] w-[18px] text-muted-foreground shrink-0" />
            <input
              placeholder="Search questions... e.g. cancellation, pets, WiFi"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="bg-transparent border-none outline-none font-sans text-sm text-foreground w-full placeholder:text-muted-foreground/50"
            />
            {searchVal && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{filteredFaqs.length} results</span>
                <X className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setSearchVal('')} />
              </div>
            )}
          </div>
        </motion.div>
      </PageHeroBanner>

      {/* Popular Questions */}
      {!searchVal && popularFaqs.length > 0 && (
        <section className="bg-muted border-t border-b border-border py-12">
          <div className="max-w-[800px] mx-auto px-[5%]">
            <p className="font-sans text-[11px] tracking-[0.2em] text-destructive uppercase mb-5 text-center">Most Asked</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {popularFaqs.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveCat(f.cat)}
                  className="flex items-center gap-2.5 p-3.5 text-left bg-card border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:border-accent/30 hover:text-accent transition-all"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 opacity-50" />
                  {f.q}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Tabs + FAQ List */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-[800px] mx-auto px-[5%]">
          <div className="mb-8 overflow-x-auto scrollbar-hide">
            <CategoryFilterTabs
              categories={FAQ_CATEGORIES}
              activeCategory={activeCat}
              onCategoryChange={(id) => { setActiveCat(id); setSearchVal(''); }}
            />
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs.map((faq, i) => (
              <AccordionItem key={faq.id} value={faq.id} className="bg-card border border-border rounded-xl overflow-hidden data-[state=open]:border-accent/30">
                <AccordionTrigger className="px-5 py-4 text-left font-serif text-base font-medium text-foreground hover:text-accent hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 font-sans text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No questions match your search.</p>
              <Button variant="outline" onClick={() => { setSearchVal(''); setActiveCat('all'); }} className="mt-3">Show All</Button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-muted border-t border-border">
        <div className="max-w-[1100px] mx-auto px-[5%]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <motion.div {...m()} className="lg:col-span-3">
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-6">Send Us a Message</h2>
              <ContactForm />
            </motion.div>
            <motion.div {...m(0.15)} className="lg:col-span-2">
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-6">Contact Information</h2>
              <div className="space-y-5">
                {[
                  { icon: Mail, label: 'Email', value: contactEmail || 'hello@ariviavillas.com', href: `mailto:${contactEmail}` },
                  { icon: Phone, label: 'Phone', value: contactPhone || '+1 (234) 567-890', href: `tel:${contactPhone}` },
                  { icon: MapPin, label: 'Address', value: contactAddress || '123 Luxury Lane', href: null },
                  { icon: Clock, label: 'Response Time', value: 'Within 24 hours', href: null },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-foreground font-medium text-sm hover:text-accent transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-foreground font-medium text-sm">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
