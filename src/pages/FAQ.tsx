import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, MessageCircle, Mail, Phone, ArrowRight, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageSEO } from '@/components/seo/PageSEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/contexts/BrandContext';
import { cn } from '@/lib/utils';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_popular: boolean;
  sort_order: number;
}

const CATEGORY_META: Record<string, { icon: typeof HelpCircle; label: string }> = {
  general: { icon: HelpCircle, label: 'General' },
  booking: { icon: HelpCircle, label: 'Booking' },
  payment: { icon: HelpCircle, label: 'Payment' },
  properties: { icon: HelpCircle, label: 'Properties' },
  cancellation: { icon: HelpCircle, label: 'Cancellation' },
  experience: { icon: HelpCircle, label: 'Experiences' },
};

function useFAQs() {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return (data || []) as FAQ[];
    },
  });
}

export default function FAQPage() {
  const { brandName, contactEmail, contactPhone } = useBrand();
  const { data: faqs, isLoading } = useFAQs();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!faqs) return [];
    const cats = [...new Set(faqs.map(f => f.category))];
    return cats;
  }, [faqs]);

  const filtered = useMemo(() => {
    if (!faqs) return [];
    let items = faqs;
    if (selectedCategory !== 'all') {
      items = items.filter(f => f.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }
    return items;
  }, [faqs, selectedCategory, search]);

  const popular = useMemo(() => faqs?.filter(f => f.is_popular) || [], [faqs]);

  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  return (
    <PageLayout>
      <PageSEO pageSlug="faq" defaults={{ meta_title: `FAQ | ${brandName}`, meta_description: 'Find answers to common questions about booking, properties, payments, and more.' }} />

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-muted">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Help Center</p>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground mb-6">
              Frequently Asked <em className="italic text-accent">Questions</em>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Everything you need to know about our villas, booking process, and experiences.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-4 h-12 rounded-full bg-card border-border text-sm"
              />
            </div>
            {search && (
              <p className="text-sm text-muted-foreground mt-3">{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Popular Questions */}
      {!search && popular.length > 0 && (
        <section className="py-12 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-6 text-center">Popular Questions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
              {popular.map(faq => (
                <button
                  key={faq.id}
                  onClick={() => { setSelectedCategory('all'); toggle(faq.id); }}
                  className={cn(
                    'text-left p-4 rounded-xl border transition-all text-sm',
                    openId === faq.id
                      ? 'bg-accent/10 border-accent/30 text-foreground'
                      : 'bg-card border-border text-muted-foreground hover:border-accent/20 hover:text-foreground'
                  )}
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Tabs + Accordion */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Category Tabs */}
          {!search && categories.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap mb-10 justify-center">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="rounded-full"
              >
                All ({faqs?.length || 0})
              </Button>
              {categories.map(cat => {
                const count = faqs?.filter(f => f.category === cat).length || 0;
                const meta = CATEGORY_META[cat];
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="rounded-full capitalize"
                  >
                    {meta?.label || cat} ({count})
                  </Button>
                );
              })}
            </div>
          )}

          {/* FAQ Accordion */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(faq => (
                <div key={faq.id} className="border border-border rounded-xl overflow-hidden bg-card">
                  <button
                    onClick={() => toggle(faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left gap-4"
                  >
                    <span className="text-sm font-medium text-foreground">{faq.question}</span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300', openId === faq.id && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {openId === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0">
                          <div className="h-px bg-border mb-4" />
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{faq.answer}</p>
                          <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-widest text-accent/60 bg-accent/10 px-2 py-0.5 rounded">
                            {CATEGORY_META[faq.category]?.label || faq.category}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-serif font-medium mb-2">No questions found</h3>
              <p className="text-muted-foreground text-sm">
                {search ? 'Try different search terms.' : 'FAQ content is coming soon.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 bg-muted border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-3">
            Still Need <em className="italic text-accent">Help?</em>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
            Our concierge team is available around the clock to assist you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-medium text-foreground text-sm mb-1">Live Chat</h3>
              <p className="text-xs text-muted-foreground">Available 24/7</p>
            </div>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="bg-card border border-border rounded-2xl p-6 text-center hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">Email Us</h3>
                <p className="text-xs text-muted-foreground">{contactEmail}</p>
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="bg-card border border-border rounded-2xl p-6 text-center hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">Call Us</h3>
                <p className="text-xs text-muted-foreground">{contactPhone}</p>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-10 bg-background border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/terms"><Button variant="outline" size="sm" className="rounded-full gap-1 text-xs">Terms & Conditions <ArrowRight className="h-3 w-3" /></Button></Link>
            <Link to="/privacy"><Button variant="outline" size="sm" className="rounded-full gap-1 text-xs">Privacy Policy <ArrowRight className="h-3 w-3" /></Button></Link>
            <Link to="/contact"><Button variant="outline" size="sm" className="rounded-full gap-1 text-xs">Contact Us <ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
