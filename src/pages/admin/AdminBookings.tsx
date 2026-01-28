import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Check, X, Clock } from 'lucide-react';
import { getStatusColors } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useAdminProperties } from '@/hooks/useProperties';
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

export default function AdminBookings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

  const { data: bookings, isLoading } = useAdminBookings({
    status: statusFilter === 'all' ? undefined : statusFilter,
    propertyId: propertyFilter === 'all' ? undefined : propertyFilter,
  });
  const { data: properties } = useAdminProperties();
  const updateStatus = useUpdateBookingStatus();
  const { toast } = useToast();

  const filteredBookings = bookings?.filter(
    (b) =>
      b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      b.guest_email.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
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

  const getStatusBadge = (status: string) => getStatusColors(status);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-serif font-medium">Bookings</h1>
            <p className="text-muted-foreground">
              Manage and track all booking requests
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 input-organic"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | 'all')}>
              <SelectTrigger className="w-[180px] input-organic">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[200px] input-organic">
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All Properties</SelectItem>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="card-organic overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading bookings...</p>
              </div>
            ) : filteredBookings && filteredBookings.length > 0 ? (
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
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.guest_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.guest_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {booking.property?.name || 'Unknown'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>
                            {format(new Date(booking.check_in), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            to {format(new Date(booking.check_out), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.nights} nights
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.guests}</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(booking.total_price)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                onClick={() =>
                                  handleStatusUpdate(booking.id, 'confirmed')
                                }
                                aria-label="Confirm booking"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleStatusUpdate(booking.id, 'cancelled')
                                }
                                aria-label="Cancel booking"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                handleStatusUpdate(booking.id, 'cancelled')
                              }
                              aria-label="Cancel booking"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {booking.status === 'cancelled' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                              onClick={() =>
                                handleStatusUpdate(booking.id, 'pending')
                              }
                              aria-label="Reopen booking"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
