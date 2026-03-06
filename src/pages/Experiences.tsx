import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Search, Clock, Users, Star, X, ChevronLeft, ChevronRight, CheckCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { PageSEO } from '@/components/seo/PageSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { cn } from '@/lib/utils';

const categories = ['All', 'Culinary', 'Adventure', 'Cultural', 'Wellness'];

/* ─── Experience Detail Modal ─── */
function ExperienceModal({ experience, onClose, formatPrice }: { experience: any; onClose: () => void; formatPrice: (n: number) => string }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = [experience.hero_image_url, ...(experience.gallery || [])].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-8 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-muted border border-border rounded-2xl max-w-[900px] w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gallery */}
        <div className="relative aspect-[21/9] overflow-hidden">
          {images[imgIdx] && <img src={images[imgIdx]} alt={experience.name} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/30 backdrop-blur flex items-center justify-center text-background hover:bg-background/50 transition-colors">
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIdx(p => (p - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/20 backdrop-blur flex items-center justify-center text-background hover:bg-background/40"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setImgIdx(p => (p + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/20 backdrop-blur flex items-center justify-center text-background hover:bg-background/40"><ChevronRight className="h-4 w-4" /></button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className={cn('w-2 h-2 rounded-full transition-colors', i === imgIdx ? 'bg-accent' : 'bg-background/40')} />)}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] bg-accent/10 text-accent px-2.5 py-1 rounded-full">{experience.category}</span>
              <h2 className="text-2xl font-serif font-medium text-foreground mt-3">{experience.name}</h2>
            </div>
            {experience.price_from && (
              <div className="text-right">
                <p className="text-lg font-serif font-semibold text-accent">{formatPrice(experience.price_from)}</p>
                <p className="text-xs text-muted-foreground">{experience.price_type || 'per person'}</p>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            {experience.duration && <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5 text-accent" /> {experience.duration}</span>}
            <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5 text-accent" /> Small groups</span>
          </div>

          {experience.long_description && <p className="text-sm text-muted-foreground leading-relaxed mb-6">{experience.long_description}</p>}
          {!experience.long_description && experience.description && <p className="text-sm text-muted-foreground leading-relaxed mb-6">{experience.description}</p>}

          {/* Includes */}
          {experience.includes && experience.includes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">What's Included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {experience.includes.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link to={`/experiences/${experience.slug}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-full">View Details</Button>
            </Link>
            <Link to={`/experiences/${experience.slug}#enquiry`} className="flex-1">
              <Button variant="gold" className="w-full rounded-full gap-2">Enquire Now <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const Experiences = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedExp, setSelectedExp] = useState<any>(null);
  const { data: experiences, isLoading } = useActiveExperiences();
  const { formatPrice } = useFormatCurrency();

  const filtered = useMemo(() => {
    let items = experiences || [];
    if (selectedCategory !== 'All') items = items.filter(e => e.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(e => e.name.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    return items;
  }, [experiences, selectedCategory, search]);

  const heroImg = experiences?.find(e => e.is_featured)?.hero_image_url || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1400&q=80';

  return (
    <PageLayout>
      <PageSEO pageSlug="experiences" defaults={{ meta_title: 'Curated Experiences | Haven Hub', meta_description: 'Enhance your luxury stay with curated experiences.', og_image: heroImg }} />

      {/* Hero */}
      <section className="relative py-24 md:py-36 overflow-hidden bg-muted">
        <div className="absolute inset-0 overflow-hidden">
          <img src={heroImg} alt="" className="w-full h-full object-cover blur-[80px] brightness-[0.15] saturate-50 scale-[1.3]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Curated Experiences</p>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground mb-4">
              Unforgettable <em className="italic text-accent">Moments</em>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From culinary journeys to cultural immersions, each experience is designed to create lasting memories.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-[72px] z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full"
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="relative md:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search experiences..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9 text-sm rounded-full bg-muted/50 border-border" />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} experience{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-[16/10]" />
                  <div className="p-5 space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-full" /></div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/20 hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                  onClick={() => setSelectedExp(exp)}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={exp.hero_image_url || heroImg} alt={exp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
                    {/* Category badge */}
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest bg-accent/90 text-background px-2.5 py-1 rounded">{exp.category}</span>
                    {/* Price pill */}
                    {exp.price_from && (
                      <div className="absolute bottom-3 right-3 bg-background/70 backdrop-blur px-3 py-1.5 rounded-full">
                        <span className="text-sm font-semibold text-foreground">{formatPrice(exp.price_from)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif font-medium text-foreground mb-1 line-clamp-1">{exp.name}</h3>
                    {exp.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{exp.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {exp.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-accent" /> {exp.duration}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3 text-accent" /> Small groups</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-medium mb-2">
                {selectedCategory === 'All' ? 'No Experiences Yet' : `No ${selectedCategory} Experiences`}
              </h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'All' ? "We're adding new experiences soon." : 'Try a different category.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-4">
            Looking for Something <em className="italic text-accent">Custom?</em>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Our concierge team can arrange bespoke experiences tailored to your interests.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/contact"><Button variant="outline" className="rounded-full">Contact Concierge</Button></Link>
            <Link to="/properties"><Button variant="gold" className="rounded-full gap-2">Browse Properties <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedExp && <ExperienceModal experience={selectedExp} onClose={() => setSelectedExp(null)} formatPrice={formatPrice} />}
      </AnimatePresence>
    </PageLayout>
  );
};

export default Experiences;
