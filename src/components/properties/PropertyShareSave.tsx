import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Heart, Link2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface PropertyShareSaveProps {
  propertyName: string;
  propertyUrl?: string;
}

export function PropertyShareSave({ propertyName, propertyUrl }: PropertyShareSaveProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const url = propertyUrl || window.location.href;

  const handleShare = async () => {
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyName,
          text: `Check out ${propertyName}`,
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to menu
      }
    }
    
    // Show share menu on desktop or if native share fails
    setShowShareMenu(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 1500);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      toast.success('Property saved to your wishlist');
    } else {
      toast.success('Property removed from wishlist');
    }
  };

  // Mobile: Render as a floating bar
  if (isMobile) {
    return (
      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center"
        >
          <Share2 className="h-5 w-5 text-foreground" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className={`w-12 h-12 rounded-full border shadow-lg flex items-center justify-center transition-colors ${
            isSaved 
              ? 'bg-destructive border-destructive' 
              : 'bg-background border-border'
          }`}
        >
          <Heart 
            className={`h-5 w-5 transition-colors ${
              isSaved ? 'text-white fill-current' : 'text-foreground'
            }`} 
          />
        </motion.button>
      </div>
    );
  }

  // Desktop: Render as floating sidebar
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="w-11 h-11 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-secondary transition-colors group relative"
        >
          <Share2 className="h-5 w-5 text-foreground" />
          <span className="absolute right-full mr-3 px-2 py-1 bg-foreground text-background text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Share
          </span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className={`w-11 h-11 rounded-full border shadow-lg flex items-center justify-center transition-colors group relative ${
            isSaved 
              ? 'bg-destructive border-destructive hover:bg-destructive/90' 
              : 'bg-background border-border hover:bg-secondary'
          }`}
        >
          <Heart 
            className={`h-5 w-5 transition-colors ${
              isSaved ? 'text-white fill-current' : 'text-foreground'
            }`} 
          />
          <span className="absolute right-full mr-3 px-2 py-1 bg-foreground text-background text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isSaved ? 'Saved' : 'Save'}
          </span>
        </motion.button>
      </motion.div>

      {/* Share Menu Modal */}
      <AnimatePresence>
        {showShareMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareMenu(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-medium">Share this property</h3>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 truncate">
                {propertyName}
              </p>

              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
