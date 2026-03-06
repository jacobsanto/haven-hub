import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';

export default function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const propertySlug = searchParams.get('property');

  return (
    <PageLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Payment Cancelled</h1>
              <p className="text-muted-foreground mt-2">
                No worries! Your booking has not been confirmed and you haven't been charged.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Your selected dates may still be available. You can return to checkout to complete your booking.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              {propertySlug ? (
                <Button asChild className="flex-1">
                  <Link to="/properties">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Link>
                </Button>
              ) : (
                <Button asChild className="flex-1">
                  <Link to="/properties">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
