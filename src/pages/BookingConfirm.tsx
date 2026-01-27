import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Home, Calendar, DollarSign } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';

interface BookingConfirmState {
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
}

export default function BookingConfirm() {
  const location = useLocation();
  const state = location.state as BookingConfirmState | null;

  if (!state) {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <CheckCircle className="h-12 w-12 text-secondary-foreground" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">
            Booking Request Received!
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Thank you for your booking request. We'll review availability and 
            confirm your reservation shortly. You'll receive an email confirmation once approved.
          </p>

          {/* Booking Details Card */}
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

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-secondary/30 rounded-2xl p-6 mb-8 text-left"
          >
            <h3 className="font-medium mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
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
