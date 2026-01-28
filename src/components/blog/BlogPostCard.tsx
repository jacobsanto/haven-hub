import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { BlogPost } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
}

function estimateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  const readTime = estimateReadTime(post.content);
  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="group relative overflow-hidden rounded-2xl bg-card border border-border"
      >
        <Link to={`/blog/${post.slug}`} className="grid md:grid-cols-2 gap-0">
          <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
            {post.featured_image_url ? (
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          <div className="p-8 flex flex-col justify-center">
            {post.category && (
              <Badge variant="secondary" className="w-fit mb-4">
                {post.category.name}
              </Badge>
            )}
            <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4 group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-muted-foreground mb-6 line-clamp-3">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
              {post.author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.name} />
                    <AvatarFallback className="text-xs">
                      {post.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author.name}</span>
                </div>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(publishedDate, 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readTime} min read
              </span>
            </div>
            <span className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
              Read Article <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden rounded-xl mb-4 relative">
          {post.featured_image_url ? (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
        <div className="space-y-3">
          {post.category && (
            <Badge variant="secondary" className="text-xs">
              {post.category.name}
            </Badge>
          )}
          <h3 className="text-lg md:text-xl font-serif text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {post.author && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.name} />
                  <AvatarFallback className="text-[10px]">
                    {post.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span>{post.author.name}</span>
              </div>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readTime} min
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
