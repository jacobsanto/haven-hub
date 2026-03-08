import { motion } from 'framer-motion';
import { Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FloatingShareBarProps {
  title: string;
}

export function FloatingShareBar({ title }: FloatingShareBarProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'The article link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL from your browser.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-2"
    >
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-lg flex flex-col gap-2">
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="ghost"
            size="icon"
            asChild
            className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${link.name}`}
            >
              <link.icon className="h-4 w-4" />
            </a>
          </Button>
        ))}
        
        <div className="h-px bg-border my-1" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <LinkIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
