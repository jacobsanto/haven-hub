import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Clock, Sparkles, Tag } from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { usePromotion } from '@/contexts/PromotionContext';
import { useNavigate } from 'react-router-dom';

export function PromotionalPopup() {
  const { activePromotion, showPromotion, dismissPromotion } = usePromotion();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Reset copied state when popup closes
  useEffect(() => {
    if (!showPromotion) setCopied(false);
  }, [showPromotion]);

  if (!activePromotion || !showPromotion) return null;

  const {
    title,
    subtitle,
    description,
    image_url,
    cta_text,
    cta_link,
    discount_method,
    auto_discount_percent,
    ends_at,
    coupon,
  } = activePromotion;

  const endDate = new Date(ends_at);
  const now = new Date();
  const daysRemaining = differenceInDays(endDate, now);
  const hoursRemaining = differenceInHours(endDate, now) % 24;

  const handleCopyCoupon = () => {
    if (coupon?.code) {
      navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('Coupon code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCTAClick = () => {
    // Copy coupon if applicable
    if (discount_method === 'coupon' && coupon?.code) {
      navigator.clipboard.writeText(coupon.code);
      toast.success('Coupon code copied to clipboard!');
    }

    // Navigate to link or default to properties
    if (cta_link) {
      if (cta_link.startsWith('http')) {
        window.open(cta_link, '_blank');
      } else {
        navigate(cta_link);
      }
    } else {
      navigate('/properties');
    }

    dismissPromotion();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      dismissPromotion();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative"
        >
          {/* Close button */}
          <button
            onClick={dismissPromotion}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
            aria-label="Close promotion"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image */}
          {image_url && (
            <div className="relative h-48 sm:h-56 overflow-hidden">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              
              {/* Urgency badge */}
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="bg-primary text-primary-foreground gap-1">
                  <Clock className="h-3 w-3" />
                  {daysRemaining > 0 
                    ? `${daysRemaining}d ${hoursRemaining}h left`
                    : `${hoursRemaining}h left`
                  }
                </Badge>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Discount badge */}
            <div className="flex items-center gap-2">
              {discount_method === 'automatic' && auto_discount_percent && (
                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                  <Sparkles className="h-3 w-3" />
                  {auto_discount_percent}% OFF - Auto Applied
                </Badge>
              )}
              {discount_method === 'coupon' && coupon && (
                <Badge className="bg-accent/10 text-accent-foreground border-accent/20 gap-1">
                  <Tag className="h-3 w-3" />
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}% OFF`
                    : `€${coupon.discount_value} OFF`
                  }
                </Badge>
              )}
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>

            {/* Storytelling description */}
            {description && (
              <p className="text-foreground/80 leading-relaxed italic">
                "{description}"
              </p>
            )}

            {/* Coupon code display */}
            {discount_method === 'coupon' && coupon?.code && (
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Use code</p>
                  <p className="text-lg font-mono font-bold text-primary">{coupon.code}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCoupon}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={handleCTAClick}
              className="w-full"
              size="lg"
            >
              {cta_text || 'Claim Offer'}
            </Button>

            {/* Valid until */}
            <p className="text-center text-xs text-muted-foreground">
              Valid until {format(endDate, 'MMMM d, yyyy')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
