import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      transition={{ delay: index * 0.08 }}
    >
      <Link
        to={`/experiences/${experience.slug}`}
        className="group flex flex-col md:flex-row gap-0 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
      >
        {/* Image — Left Side */}
        <div className="w-full md:w-[200px] shrink-0 aspect-square md:aspect-auto overflow-hidden">
          {experience.hero_image_url ? (
            <img
              src={experience.hero_image_url}
              alt={experience.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center min-h-[200px]">
              <span className="text-4xl">✨</span>
            </div>
          )}
        </div>

        {/* Content — Right Side */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            {/* Category */}
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary mb-1 block">
              {experience.category}
            </span>

            {/* Name */}
            <h3 className="text-base font-bold uppercase tracking-wide text-foreground mb-1 group-hover:text-primary transition-colors">
              {experience.name}
            </h3>

            {/* Price */}
            {experience.price_from && (
              <p className="text-accent font-bold text-sm mb-2">
                From €{experience.price_from}
                {experience.price_type && (
                  <span className="text-muted-foreground font-normal text-xs ml-1">/{experience.price_type}</span>
                )}
              </p>
            )}

            {/* Description */}
            {experience.description && (
              <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed mb-4">
                {experience.description}
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Button size="sm" className="rounded-full gap-1.5 text-xs px-4">
              <Calendar className="h-3.5 w-3.5" />
              Book Now
            </Button>
            {experience.duration && (
              <span className="text-xs text-muted-foreground">{experience.duration}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
