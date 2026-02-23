import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Home, Receipt, Share2, HelpCircle, Calendar, Users, BedDouble, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface BookingDetails {
  bookingReference: string;
  propertyName: string;
  propertyImage: string;
  propertyLocation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  totalPaid: number;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
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
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
          body: { sessionId },
        });

        if (error) throw new Error(error.message);

        if (data?.success && data?.booking) {
          setBooking({
            bookingReference: data.booking.bookingReference,
            propertyName: data.booking.propertyName || 'Your Property',
            propertyImage: data.booking.propertyImage || '',
            propertyLocation: data.booking.propertyLocation || '',
            checkIn: data.booking.checkIn,
            checkOut: data.booking.checkOut,
            guests: data.booking.guests || 2,
            roomType: data.booking.roomType || 'Entire Property',
            totalPaid: data.booking.totalPaid,
          });
          setStatus('success');
        } else if (data?.pending) {
          setBooking({
            bookingReference: data.bookingReference || 'Processing...',
            propertyName: data.propertyName || 'Your Property',
            propertyImage: data.propertyImage || '',
            propertyLocation: data.propertyLocation || '',
            checkIn: data.checkIn || '',
            checkOut: data.checkOut || '',
            guests: data.guests || 2,
            roomType: data.roomType || 'Entire Property',
            totalPaid: data.amount || 0,
          });
          setStatus('success');
        } else {
          throw new Error(data?.message || 'Unable to verify payment');
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
        setStatus('success');
        setBooking({
          bookingReference: 'Confirmation email incoming',
          propertyName: '',
          propertyImage: '',
          propertyLocation: '',
          checkIn: '',
          checkOut: '',
          guests: 0,
          roomType: '',
          totalPaid: 0,
        });
      }
    };

    verifyPayment();
  }, [sessionId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'My Booking at Haven Hub',
        text: `I just booked ${booking?.propertyName}!`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <h1 className="font-serif text-2xl font-semibold">Confirming Your Booking</h1>
              <p className="text-muted-foreground">Please wait while we verify your payment...</p>
            </div>
          )}

          {status === 'success' && booking && (
            <div className="space-y-6">
              {/* Success icon */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h1 className="font-serif text-2xl font-semibold">Booking Confirmed!</h1>
                <p className="text-muted-foreground mt-2">
                  Your stay at Haven Hub is locked in! We've sent a confirmation email to your inbox.
                </p>
              </div>

              {/* Property card with confirmation badge */}
              {booking.propertyName && booking.propertyName !== '' && (
                <div className="bg-card rounded-xl border overflow-hidden">
                  {booking.propertyImage && (
                    <div className="relative">
                      <img
                        src={booking.propertyImage}
                        alt={booking.propertyName}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif font-semibold">{booking.propertyName}</h3>
                        {booking.propertyLocation && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.propertyLocation}</span>
                          </div>
                        )}
                      </div>
                      {booking.bookingReference && booking.bookingReference !== 'Confirmation email incoming' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                          #{booking.bookingReference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Details grid */}
              {(booking.checkIn || booking.checkOut || booking.guests > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {booking.checkIn && (
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        <Calendar className="h-3 w-3" />
                        Check-in
                      </div>
                      <div className="text-sm font-medium">{formatDate(booking.checkIn)}</div>
                    </div>
                  )}
                  {booking.checkOut && (
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        <Calendar className="h-3 w-3" />
                        Check-out
                      </div>
                      <div className="text-sm font-medium">{formatDate(booking.checkOut)}</div>
                    </div>
                  )}
                  {booking.guests > 0 && (
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        <Users className="h-3 w-3" />
                        Guests
                      </div>
                      <div className="text-sm font-medium">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</div>
                    </div>
                  )}
                  {booking.roomType && (
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        <BedDouble className="h-3 w-3" />
                        Room Type
                      </div>
                      <div className="text-sm font-medium">{booking.roomType}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Total Paid */}
              {booking.totalPaid > 0 && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Price Paid</span>
                  <span className="font-serif text-xl font-semibold">
                    €{booking.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link to="/">View My Bookings</Link>
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" className="w-full">
                    <Receipt className="h-4 w-4 mr-2" />
                    Receipt
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Support link */}
              <div className="text-center pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Need help with your booking? Contact Support
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold">Something Went Wrong</h1>
                <p className="text-muted-foreground mt-2">
                  {errorMessage || "We couldn't verify your payment. Please contact support."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
