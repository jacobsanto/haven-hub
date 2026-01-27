import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Author {
  name: string;
  avatar_url?: string | null;
  bio?: string;
}

interface AuthorBioProps {
  author: Author;
  className?: string;
}

export function AuthorBio({ author, className = '' }: AuthorBioProps) {
  const initials = author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`bg-muted/50 rounded-2xl p-6 md:p-8 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-serif text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Written by</p>
          <h3 className="text-xl font-serif text-foreground mb-2">{author.name}</h3>
          {author.bio && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {author.bio}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
