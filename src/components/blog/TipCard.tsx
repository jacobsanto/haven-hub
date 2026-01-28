import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface TipCardProps {
  number: number;
  title: string;
  content: string;
  checklistItems?: string[];
}

export function TipCard({ number, title, content, checklistItems }: TipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: number * 0.1 }}
      className="relative bg-card rounded-xl border border-border p-6 md:p-8 hover:shadow-lg transition-shadow"
    >
      {/* Number Badge */}
      <div className="absolute -top-4 left-6 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-md">
        {number.toString().padStart(2, '0')}
      </div>

      {/* Content */}
      <div className="pt-4">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
          {title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed mb-6">
          {content}
        </p>

        {/* Checklist */}
        {checklistItems && checklistItems.length > 0 && (
          <ul className="space-y-3">
            {checklistItems.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
