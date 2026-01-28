import { format } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  Users,
  RefreshCw,
  X,
  Check,
  CreditCard,
  Package,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useBookingDetails } from '@/hooks/useBookings';
import { useUpdateBookingStatus } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingDetailDialogProps {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailDialog({
  bookingId,
  open,
  onOpenChange,
}: BookingDetailDialogProps) {
  const { data, isLoading } = useBookingDetails(bookingId);
  const updateStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  const booking = data?.booking;
  const priceBreakdown = data?.priceBreakdown || [];
  const payments = data?.payments || [];
  const addons = data?.addons || [];
  const deposits = data?.deposits || [];

  const formatPrice = (price: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      unpaid: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      synced: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const handleStatusUpdate = async (status: 'confirmed' | 'cancelled' | 'pending') => {
    if (!booking) return;
    try {
      await updateStatus.mutateAsync({ id: booking.id, status });
      toast({
        title: 'Status Updated',
        description: `Booking has been marked as ${status}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      });
    }
  };

  const handleRetrySync = () => {
    toast({
      title: 'Sync Initiated',
      description: 'PMS sync has been triggered. Please wait...',
    });
    // TODO: Implement actual PMS sync mutation
  };

  // Group price breakdown by type
  const groupedBreakdown = priceBreakdown.reduce((acc, item) => {
    const type = item.line_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, typeof priceBreakdown>);

  const lineTypeLabels: Record<string, string> = {
    accommodation: 'Accommodation',
    addon: 'Add-ons',
    fee: 'Fees',
    tax: 'Taxes',
    discount: 'Discounts',
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-48" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!booking) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            The requested booking could not be found.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-serif">
              Booking Detail
            </DialogTitle>
            <span className="font-mono text-sm text-muted-foreground">
              {booking.booking_reference || booking.id.slice(0, 8)}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guest Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Guest Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{booking.guest_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${booking.guest_email}`} className="text-primary hover:underline">
                    {booking.guest_email}
                  </a>
                </div>
                {booking.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.guest_phone}</span>
                  </div>
                )}
                {booking.guest_country && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.guest_country}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.adults || booking.guests} adults
                    {booking.children ? `, ${booking.children} children` : ''}
                    {' '}({booking.guests} total)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property</span>
                  <span className="font-medium">{booking.property?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span>{format(new Date(booking.check_in), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span>{format(new Date(booking.check_out), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nights</span>
                  <span>{booking.nights}</span>
                </div>
                {(booking.check_in_time || booking.check_out_time) && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Check-in: {booking.check_in_time || '14:00'} / Check-out: {booking.check_out_time || '11:00'}
                      </span>
                    </div>
                  </>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge variant="outline" className="capitalize">
                    {booking.source || 'direct'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {priceBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {priceBreakdown.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className={item.line_type === 'discount' ? 'text-emerald-600' : ''}>
                        {item.label}
                        {item.quantity && item.quantity > 1 ? ` (×${item.quantity})` : ''}
                      </span>
                      <span className={item.line_type === 'discount' ? 'text-emerald-600' : 'font-medium'}>
                        {item.line_type === 'discount' ? '-' : ''}
                        {formatPrice(Math.abs(item.amount))}
                      </span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-lg">{formatPrice(booking.total_price)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span className="text-lg">{formatPrice(booking.total_price)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="breakdown" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="breakdown" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Breakdown</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="addons" className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Add-ons</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown" className="mt-4">
              {priceBreakdown.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceBreakdown.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {lineTypeLabels[item.line_type] || item.line_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.label}</TableCell>
                        <TableCell className="text-center">{item.quantity || 1}</TableCell>
                        <TableCell className={`text-right ${item.line_type === 'discount' ? 'text-emerald-600' : ''}`}>
                          {item.line_type === 'discount' ? '-' : ''}
                          {formatPrice(Math.abs(item.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No itemized breakdown available
                </div>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-4">
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="capitalize">{payment.payment_type}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.payment_method || '-'}</TableCell>
                        <TableCell>
                          {payment.due_date 
                            ? format(new Date(payment.due_date), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(payment.amount, payment.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No payments recorded
                </div>
              )}

              {/* Security Deposits */}
              {deposits.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Security Deposits</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Held At</TableHead>
                        <TableHead>Released At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell>
                            <Badge className={getStatusBadge(deposit.status || 'pending')}>
                              {deposit.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(deposit.amount, deposit.currency || 'EUR')}
                          </TableCell>
                          <TableCell>
                            {deposit.held_at 
                              ? format(new Date(deposit.held_at), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {deposit.released_at 
                              ? format(new Date(deposit.released_at), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Add-ons Tab */}
            <TabsContent value="addons" className="mt-4">
              {addons.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Add-on</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addons.map((addon) => (
                      <TableRow key={addon.id}>
                        <TableCell className="font-medium">
                          {addon.addon?.name || 'Unknown Add-on'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {addon.addon?.category || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{addon.quantity}</TableCell>
                        <TableCell>
                          {addon.scheduled_date 
                            ? format(new Date(addon.scheduled_date), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(addon.status)}>
                            {addon.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(addon.total_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No add-ons for this booking
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Special Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.special_requests ? (
                    <p className="text-sm whitespace-pre-wrap">{booking.special_requests}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No special requests</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Status Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className={getStatusBadge(booking.status)}>
                {booking.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Payment:</span>
              <Badge className={getStatusBadge(booking.payment_status || 'unpaid')}>
                {booking.payment_status || 'unpaid'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">PMS:</span>
              <Badge className={getStatusBadge(booking.pms_sync_status || 'pending')}>
                {booking.pms_sync_status || 'pending'}
              </Badge>
              {booking.pms_sync_status === 'failed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetrySync}
                  className="h-7"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              {booking.status === 'pending' && (
                <Button
                  variant="default"
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updateStatus.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Booking
                </Button>
              )}
              {booking.status !== 'cancelled' && (
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateStatus.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
