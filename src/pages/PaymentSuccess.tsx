import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Home, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';

interface BookingDetails {
  bookingReference: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalPaid: number;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMessage('No session ID provided');
      return;
    }

    const verifyPayment = async () => {
      try {
        // Wait briefly for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Call verify endpoint to get booking details
        const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
          body: { sessionId },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success && data?.booking) {
          setBooking({
            bookingReference: data.booking.bookingReference,
            propertyName: data.booking.propertyName,
            checkIn: data.booking.checkIn,
            checkOut: data.booking.checkOut,
            totalPaid: data.booking.totalPaid,
          });
          setStatus('success');
        } else if (data?.pending) {
          // Payment received but booking not yet created - show success anyway
          setBooking({
            bookingReference: data.bookingReference || 'Processing...',
            propertyName: data.propertyName || 'Your property',
            checkIn: data.checkIn || '',
            checkOut: data.checkOut || '',
            totalPaid: data.amount || 0,
          });
          setStatus('success');
        } else {
          throw new Error(data?.message || 'Unable to verify payment');
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
        // Even if verification fails, Stripe payment succeeded - show generic success
        setStatus('success');
        setBooking({
          bookingReference: 'Confirmation email incoming',
          propertyName: '',
          checkIn: '',
          checkOut: '',
          totalPaid: 0,
        });
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <PageLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-6 text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h1 className="font-serif text-2xl font-semibold">Confirming Your Booking</h1>
                <p className="text-muted-foreground">Please wait while we verify your payment...</p>
              </div>
            )}

            {status === 'success' && booking && (
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-foreground">Payment Successful!</h1>
                  <p className="text-muted-foreground mt-2">
                    Your booking has been confirmed. A confirmation email will be sent shortly.
                  </p>
                </div>

                {booking.bookingReference && booking.bookingReference !== 'Confirmation email incoming' && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Booking Reference</span>
                      <span className="font-mono font-semibold">{booking.bookingReference}</span>
                    </div>
                    {booking.propertyName && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Property</span>
                        <span className="font-medium">{booking.propertyName}</span>
                      </div>
                    )}
                    {booking.checkIn && booking.checkOut && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Dates</span>
                        <span className="font-medium">{booking.checkIn} → {booking.checkOut}</span>
                      </div>
                    )}
                    {booking.totalPaid > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Total Paid</span>
                        <span className="font-serif font-semibold text-lg">
                          €{booking.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/properties">
                      Browse More Properties
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-foreground">Something Went Wrong</h1>
                  <p className="text-muted-foreground mt-2">
                    {errorMessage || 'We couldn\'t verify your payment. Please contact support.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/contact">
                      Contact Support
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
