import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { BlogPost } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
interface BlogSecondaryCardProps {
  post: BlogPost;
  index?: number;
}

function estimateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function BlogSecondaryCard({ post, index = 0 }: BlogSecondaryCardProps) {
  const readTime = estimateReadTime(post.content);
  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group h-full"
    >
      <Link 
        to={`/blog/${post.slug}`} 
        className="flex flex-col h-full overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {post.featured_image_url ? (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {post.category && (
            <Badge 
              variant="secondary" 
              className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm"
            >
              {post.category.name}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col flex-1 p-6">
          <h3 className="text-xl font-serif text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          
          {post.excerpt && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              {post.author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.name} />
                    <AvatarFallback className="text-[10px]">
                      {post.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{post.author.name}</span>
                </div>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {readTime} min
              </span>
            </div>
            <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Read <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
