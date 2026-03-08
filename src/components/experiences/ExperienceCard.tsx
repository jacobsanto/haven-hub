import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Experience } from '@/types/experiences';

interface ExperienceCardProps {
  experience: Experience;
  index?: number;
}

function getDifficultyFromCategory(category: string): { label: string; dots: number } {
  const lower = category.toLowerCase();
  if (['adventure', 'sports', 'hiking', 'active'].some((k) => lower.includes(k))) {
    return { label: 'Active', dots: 3 };
  }
  if (['culture', 'tour', 'cooking', 'wine'].some((k) => lower.includes(k))) {
    return { label: 'Moderate', dots: 2 };
  }
  return { label: 'Easy', dots: 1 };
}

export function ExperienceCard({ experience, index = 0 }: ExperienceCardProps) {
  const difficulty = getDifficultyFromCategory(experience.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        to={`/experiences/${experience.slug}`}
        className="group flex flex-col md:flex-row gap-0 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-accent"
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
            {/* Category + Difficulty */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary block">
                {experience.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i < difficulty.dots ? 'bg-accent' : 'bg-border'}`}
                  />
                ))}
                <span className="ml-0.5">{difficulty.label}</span>
              </span>
            </div>

            {/* Name */}
            <h3 className="text-base font-medium uppercase tracking-wide text-foreground mb-1 group-hover:text-primary transition-colors">
              {experience.name}
            </h3>

            {/* Price */}
            {experience.price_from && (
              <p className="text-accent font-semibold text-sm mb-2">
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

          {/* CTA + Duration pill */}
          <div className="flex items-center gap-3">
            <Button size="sm" className="rounded-full gap-1.5 text-xs px-4">
              <Calendar className="h-3.5 w-3.5" />
              Book Now
            </Button>
            {experience.duration && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                {experience.duration}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
