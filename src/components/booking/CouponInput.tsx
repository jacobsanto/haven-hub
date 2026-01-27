import { useState } from 'react';
import { useValidateCoupon } from '@/hooks/useBookingEngine';
import { CouponPromo } from '@/types/booking-engine';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CouponInputProps {
  propertyId: string;
  nights: number;
  bookingValue: number;
  appliedCoupon: CouponPromo | null;
  onCouponApply: (coupon: CouponPromo | null) => void;
  className?: string;
}

export function CouponInput({
  propertyId,
  nights,
  bookingValue,
  appliedCoupon,
  onCouponApply,
  className,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const validateCoupon = useValidateCoupon();

  const handleApply = async () => {
    if (!code.trim()) return;

    try {
      const coupon = await validateCoupon.mutateAsync({
        code: code.trim(),
        propertyId,
        nights,
        bookingValue,
      });

      onCouponApply(coupon);
      setCode('');
      setIsExpanded(false);
      
      toast({
        title: 'Coupon applied!',
        description: `${coupon.name} - ${
          coupon.discountType === 'percentage' 
            ? `${coupon.discountValue}% off` 
            : `€${coupon.discountValue} off`
        }`,
      });
    } catch (error) {
      toast({
        title: 'Invalid coupon',
        description: error instanceof Error ? error.message : 'This coupon is not valid',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = () => {
    onCouponApply(null);
    toast({
      title: 'Coupon removed',
    });
  };

  if (appliedCoupon) {
    return (
      <div className={cn('flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent/20', className)}>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" />
          <div>
            <span className="font-medium">{appliedCoupon.code}</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {appliedCoupon.discountType === 'percentage' 
                ? `${appliedCoupon.discountValue}% off` 
                : `€${appliedCoupon.discountValue} off`}
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className={cn(
          'flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors',
          className
        )}
      >
        <Tag className="h-4 w-4" />
        Have a promo code?
      </button>
    );
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        placeholder="Enter code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleApply}
        disabled={validateCoupon.isPending || !code.trim()}
      >
        {validateCoupon.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Apply'
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsExpanded(false);
          setCode('');
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
