import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BookingWidget } from './BookingWidget';
import { Property } from '@/types/database';

interface MobileBookingCTAProps {
  property: Property;
  priceDisplay: string;
}

export function MobileBookingCTA({ property, priceDisplay }: MobileBookingCTAProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between gap-4 z-50 lg:hidden">
        <div>
          <p className="text-lg font-semibold">{priceDisplay}</p>
          <p className="text-sm text-muted-foreground">per night</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="min-h-[44px] px-8 rounded-xl">
              <Calendar className="h-5 w-5 mr-2" />
              Book Now
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 overflow-auto">
            <div className="p-6">
              <BookingWidget property={property} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Spacer to prevent content from being hidden behind the CTA */}
      <div className="h-24 lg:hidden" />
    </>
  );
}
