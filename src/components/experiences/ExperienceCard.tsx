import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { Experience } from '@/types/experiences';

interface ExperienceCardProps {
  experience: Experience;
  index?: number;
}

export function ExperienceCard({ experience, index = 0 }: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
    >
      <Link
        to={`/experiences/${experience.slug}`}
        className="group block bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {experience.hero_image_url ? (
            <img
              src={experience.hero_image_url}
              alt={experience.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center min-h-[200px]">
              <span className="text-4xl">✨</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute top-3.5 left-3.5">
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded bg-accent/15 text-accent backdrop-blur-sm">
              {experience.category}
            </span>
          </div>

          {/* Price tag */}
          {experience.price_from && (
            <div className="absolute bottom-3.5 right-3.5 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
              <span className="font-bold text-accent">€{experience.price_from}</span>
              {experience.price_type && (
                <span className="text-muted-foreground text-xs ml-1">/{experience.price_type}</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-1">
            {experience.name}
          </h3>

          {experience.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-4">
              {experience.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {experience.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {experience.duration}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-accent text-sm font-semibold group-hover:gap-2.5 transition-all">
              Details <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
