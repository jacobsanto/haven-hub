import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { viewportOnce } from '@/lib/motion';

export function CTASection() {
  return (
    <section className="bg-[#0a0a0f] py-20 md:py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        className="max-w-[900px] mx-auto text-center rounded-[20px] py-16 px-12 border border-accent/15"
        style={{
          background: 'linear-gradient(135deg, rgba(212,165,116,0.08), rgba(224,122,95,0.06))',
        }}
      >
        <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-4">Summer 2026</p>
        <h2 className="font-serif text-[clamp(30px,4vw,48px)] font-semibold text-[#f0ece4] leading-[1.1] mb-4">
          Your Dream Villa <em className="font-normal text-accent not-italic">Awaits</em>
        </h2>
        <p className="font-sans text-sm text-[#6b6560] leading-[1.7] max-w-[500px] mx-auto mb-8">
          Handpicked luxury villas in the world's most beautiful destinations. Book direct for the best experience.
        </p>
        <Link
          to="/properties"
          className="inline-block px-11 py-4 bg-accent border-none text-[#0a0a0f] font-sans text-[13px] font-bold tracking-[0.12em] uppercase rounded-md hover:bg-accent/80 transition-colors"
        >
          Explore Villas
        </Link>
      </motion.div>
    </section>
  );
}
