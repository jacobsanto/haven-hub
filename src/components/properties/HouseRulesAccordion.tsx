import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Clock,
  AlertCircle,
  PawPrint,
  XCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HouseRulesAccordionProps {
  houseRules: string[];
  cancellationPolicy?: string | null;
  petPolicy?: string | null;
  className?: string;
}

export function HouseRulesAccordion({
  houseRules,
  cancellationPolicy,
  petPolicy,
  className,
}: HouseRulesAccordionProps) {
  // Default check-in/out times if not specified
  const defaultCheckIn = '3:00 PM - 10:00 PM';
  const defaultCheckOut = '11:00 AM';

  // Parse check-in/out from house rules if present
  const checkInRule = houseRules.find((r) =>
    r.toLowerCase().includes('check-in') || r.toLowerCase().includes('check in')
  );
  const checkOutRule = houseRules.find((r) =>
    r.toLowerCase().includes('check-out') || r.toLowerCase().includes('checkout')
  );

  // Filter out check-in/out rules from general rules
  const generalRules = houseRules.filter(
    (r) =>
      !r.toLowerCase().includes('check-in') &&
      !r.toLowerCase().includes('check in') &&
      !r.toLowerCase().includes('check-out') &&
      !r.toLowerCase().includes('checkout')
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Check-in/Check-out */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-organic p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Check-in</p>
            <p className="font-medium">{checkInRule?.replace(/check-?in:?\s*/i, '') || defaultCheckIn}</p>
          </div>
        </div>
        <div className="card-organic p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Check-out</p>
            <p className="font-medium">{checkOutRule?.replace(/check-?out:?\s*/i, '') || defaultCheckOut}</p>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* House Rules */}
        {generalRules.length > 0 && (
          <AccordionItem value="house-rules" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 px-4 card-organic rounded-xl mb-2 [&[data-state=open]]:rounded-b-none [&[data-state=open]]:mb-0">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">House Rules</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="card-organic rounded-t-none rounded-xl px-4 pt-0 pb-4">
              <ul className="space-y-3">
                {generalRules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Cancellation Policy */}
        {cancellationPolicy && (
          <AccordionItem value="cancellation" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 px-4 card-organic rounded-xl mb-2 [&[data-state=open]]:rounded-b-none [&[data-state=open]]:mb-0">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Cancellation Policy</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="card-organic rounded-t-none rounded-xl px-4 pt-0 pb-4">
              <p className="text-muted-foreground">{cancellationPolicy}</p>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Pet Policy */}
        {petPolicy && (
          <AccordionItem value="pets" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 px-4 card-organic rounded-xl mb-2 [&[data-state=open]]:rounded-b-none [&[data-state=open]]:mb-0">
              <div className="flex items-center gap-3">
                <PawPrint className="h-5 w-5 text-primary" />
                <span className="font-medium">Pet Policy</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="card-organic rounded-t-none rounded-xl px-4 pt-0 pb-4">
              <p className="text-muted-foreground">{petPolicy}</p>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* If no rules configured, show defaults */}
      {generalRules.length === 0 && !cancellationPolicy && !petPolicy && (
        <div className="card-organic p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Standard house rules apply:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <XCircle className="h-3 w-3" /> No smoking
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3 w-3" /> No parties or events
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" /> Respect quiet hours
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
