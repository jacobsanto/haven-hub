import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Home, Calendar, DollarSign, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BookingConfirmState {
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  status?: 'confirmed' | 'pending';
  bookingReference?: string;
}

export default function BookingConfirm() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  const state = location.state as BookingConfirmState | null;
  const bookingRef = searchParams.get('ref') || state?.bookingReference;

  const handleCopyReference = () => {
    if (bookingRef) {
      navigator.clipboard.writeText(bookingRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!state && !bookingRef) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-serif font-medium mb-4">No Booking Found</h1>
          <p className="text-muted-foreground mb-8">
            It looks like you haven't made a booking yet.
          </p>
          <Link to="/properties">
            <Button className="rounded-full">Browse Properties</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isConfirmed = state?.status === 'confirmed';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center ${
              isConfirmed 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}
          >
            {isConfirmed ? (
              <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            )}
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">
            {isConfirmed ? 'Booking Confirmed!' : 'Booking Request Received!'}
          </h1>
          
          {/* Booking Reference */}
          {bookingRef && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <span className="text-muted-foreground">Reference:</span>
              <code className="font-mono text-lg font-semibold bg-muted px-3 py-1 rounded">
                {bookingRef}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyReference}
                aria-label="Copy booking reference"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          )}

          <div className="flex justify-center mb-8">
            <Badge 
              className={isConfirmed 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
              }
            >
              {isConfirmed ? 'Confirmed' : 'Pending Review'}
            </Badge>
          </div>

          <p className="text-lg text-muted-foreground mb-12">
            {isConfirmed 
              ? 'Your booking is confirmed! You will receive a confirmation email shortly with all the details.'
              : 'Thank you for your booking request. We\'ll review availability and confirm your reservation shortly.'
            }
          </p>

          {/* Booking Details Card */}
          {state && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-organic p-8 text-left mb-8"
            >
              <h2 className="font-serif text-2xl font-medium mb-6">Booking Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <Home className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Property</p>
                    <p className="font-medium">{state.propertyName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Dates</p>
                    <p className="font-medium">
                      {state.checkIn} → {state.checkOut}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {state.nights} {state.nights === 1 ? 'night' : 'nights'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="text-2xl font-semibold">{formatPrice(state.totalPrice)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-secondary/30 rounded-2xl p-6 mb-8 text-left"
          >
            <h3 className="font-medium mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isConfirmed ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    You will receive a confirmation email with your booking details
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Check-in instructions will be sent 48 hours before arrival
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Contact us if you need to make any changes to your booking
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    We'll check availability and review your booking request
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    You'll receive a confirmation email within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Once confirmed, you'll receive check-in instructions
                  </li>
                </>
              )}
            </ul>
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline" className="rounded-full w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
            <Link to="/properties">
              <Button className="rounded-full w-full sm:w-auto">
                Browse More Properties
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
