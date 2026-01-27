import { useState } from 'react';
import { Twitter, Facebook, Linkedin, Link2, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SocialShareButtonsProps {
  title: string;
  url?: string;
  className?: string;
}

export function SocialShareButtons({ title, url, className = '' }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'The article link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL from your browser address bar.',
        variant: 'destructive',
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground mr-2">Share:</span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
              onClick={() => handleShare('twitter')}
            >
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Share on X (Twitter)</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share on X</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="h-4 w-4" />
              <span className="sr-only">Share on Facebook</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share on Facebook</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
              onClick={() => handleShare('linkedin')}
            >
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">Share on LinkedIn</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share on LinkedIn</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              <span className="sr-only">Copy link</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
        </Tooltip>

        {typeof navigator !== 'undefined' && navigator.share && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-primary/10 hover:text-primary md:hidden"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
