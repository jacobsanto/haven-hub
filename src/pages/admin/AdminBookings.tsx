import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Check, X, Clock, Eye, Loader2, Calendar } from 'lucide-react';
import { getStatusColors } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useConfirmBookingWithPMS } from '@/hooks/useCompleteBooking';
import { useAdminProperties } from '@/hooks/useProperties';
import { BookingDetailDialog } from '@/components/admin/BookingDetailDialog';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { TablePagination } from '@/components/admin/TablePagination';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { BookingStatus } from '@/types/database';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';

export default function AdminBookings() {
  const { format: formatCurrency } = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useAdminBookings({
    status: statusFilter === 'all' ? undefined : statusFilter,
    propertyId: propertyFilter === 'all' ? undefined : propertyFilter,
  });
  const { data: properties } = useAdminProperties();
  const updateStatus = useUpdateBookingStatus();
  const confirmWithPMS = useConfirmBookingWithPMS();
  const { toast } = useToast();

  const filteredBookings = bookings?.filter(
    (b) =>
      b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email.toLowerCase().includes(search.toLowerCase())
  );

  const pagination = useTablePagination(filteredBookings);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: 'Status Updated', description: `Booking has been marked as ${status}.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update booking status.', variant: 'destructive' });
    }
  };

  const handleConfirmWithPMS = async (id: string) => {
    try {
      await confirmWithPMS.mutateAsync(id);
      toast({ title: 'Booking Confirmed', description: 'Booking confirmed and synced to PMS.' });
    } catch (error) {
      toast({
        title: 'Confirmation Error',
        description: error instanceof Error ? error.message : 'Failed to confirm booking.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => getStatusColors(status);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-serif font-medium">Bookings</h1>
            <p className="text-muted-foreground">Manage and track all booking requests</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by guest name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 input-organic" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | 'all')}>
              <SelectTrigger className="w-[180px] input-organic"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[200px] input-organic"><SelectValue placeholder="Filter by property" /></SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All Properties</SelectItem>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="card-organic overflow-hidden">
            {isLoading ? (
              <AdminLoadingSkeleton variant="table" rows={8} />
            ) : pagination.paginatedData.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedData.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.guest_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                          </div>
                        </TableCell>
                        <TableCell><p className="font-medium">{booking.property?.name || 'Unknown'}</p></TableCell>
                        <TableCell>
                          <div>
                            <p>{format(new Date(booking.check_in), 'MMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">to {format(new Date(booking.check_out), 'MMM d, yyyy')}</p>
                            <p className="text-xs text-muted-foreground">{booking.nights} nights</p>
                          </div>
                        </TableCell>
                        <TableCell>{booking.guests}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(booking.total_price)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedBookingId(booking.id)} aria-label="View booking details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleConfirmWithPMS(booking.id)} disabled={confirmWithPMS.isPending} aria-label="Confirm booking and sync to PMS">
                                  {confirmWithPMS.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(booking.id, 'cancelled')} aria-label="Cancel booking">
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(booking.id, 'cancelled')} aria-label="Cancel booking">
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            {booking.status === 'cancelled' && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleStatusUpdate(booking.id, 'pending')} aria-label="Reopen booking">
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                  onNextPage={pagination.nextPage}
                  onPrevPage={pagination.prevPage}
                  onPageSizeChange={pagination.changePageSize}
                />
              </>
            ) : (
              <AdminEmptyState
                icon={Calendar}
                title="No bookings found"
                description={search ? 'Try adjusting your search or filters' : 'Bookings will appear here once guests start booking'}
              />
            )}
          </div>
        </div>

        <BookingDetailDialog
          bookingId={selectedBookingId}
          open={!!selectedBookingId}
          onOpenChange={(open) => { if (!open) setSelectedBookingId(null); }}
        />
      </AdminLayout>
    </AdminGuard>
  );
}
