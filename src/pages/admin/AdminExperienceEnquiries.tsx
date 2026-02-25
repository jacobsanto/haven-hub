import { useState } from 'react';
import { format, differenceInHours } from 'date-fns';
import { Mail, Phone, Trash2, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { useExperienceEnquiries, useUpdateExperienceEnquiry, useDeleteExperienceEnquiry } from '@/hooks/useExperienceEnquiries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const statusBadge = (status: string, createdAt: string) => {
  const hoursOld = differenceInHours(new Date(), new Date(createdAt));
  const isSLABreached = status === 'new' && hoursOld > 24;

  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    new: 'default',
    contacted: 'secondary',
    confirmed: 'outline',
    cancelled: 'destructive',
  };

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={variants[status] || 'outline'} className="text-xs capitalize">{status}</Badge>
      {isSLABreached && (
        <Badge variant="destructive" className="text-xs gap-1">
          <AlertCircle className="h-3 w-3" /> SLA
        </Badge>
      )}
    </div>
  );
};

const AdminExperienceEnquiries = () => {
  const { data: enquiries, isLoading } = useExperienceEnquiries();
  const updateEnquiry = useUpdateExperienceEnquiry();
  const deleteEnquiry = useDeleteExperienceEnquiry();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailEnquiry, setDetailEnquiry] = useState<any | null>(null);

  const handleStatusChange = async (id: string, status: 'new' | 'contacted' | 'confirmed' | 'cancelled') => {
    try {
      await updateEnquiry.mutateAsync({ id, status });
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEnquiry.mutateAsync(deleteId);
      toast.success('Enquiry deleted');
      setDeleteId(null);
    } catch { toast.error('Failed to delete'); }
  };

  // Sort: new first, then by date desc
  const sorted = enquiries
    ? [...enquiries].sort((a, b) => {
        if (a.status === 'new' && b.status !== 'new') return -1;
        if (a.status !== 'new' && b.status === 'new') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
    : [];

  const newCount = enquiries?.filter(e => e.status === 'new').length || 0;
  const slaBreached = enquiries?.filter(e => e.status === 'new' && differenceInHours(new Date(), new Date(e.created_at)) > 24).length || 0;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-medium">Experience Enquiries</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {enquiries?.length || 0} total · {newCount} new
                {slaBreached > 0 && <span className="text-destructive ml-1">· {slaBreached} SLA breached</span>}
              </p>
            </div>
          </div>

          <div className="card-organic overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead className="hidden md:table-cell">Experience</TableHead>
                  <TableHead className="hidden lg:table-cell">Requested Date</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><div className="h-10 bg-muted animate-pulse rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : sorted.length > 0 ? (
                  sorted.map((enq) => (
                    <TableRow key={enq.id} className="cursor-pointer" onClick={() => setDetailEnquiry(enq)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{enq.name}</p>
                          <p className="text-xs text-muted-foreground">{enq.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {enq.experience?.name || '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {enq.preferred_date ? format(new Date(enq.preferred_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center text-sm">
                        {enq.group_size || '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {statusBadge(enq.status, enq.created_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {format(new Date(enq.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            {enq.status === 'new' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(enq.id, 'contacted')}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Mark Contacted
                              </DropdownMenuItem>
                            )}
                            {enq.status === 'contacted' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(enq.id, 'confirmed')}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Mark Confirmed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteId(enq.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <AdminEmptyState
                        icon={MessageSquare}
                        title="No enquiries yet"
                        description="Enquiries from guests will appear here"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Detail Modal */}
        <Dialog open={!!detailEnquiry} onOpenChange={(open) => !open && setDetailEnquiry(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enquiry Details</DialogTitle>
            </DialogHeader>
            {detailEnquiry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Guest</p>
                    <p className="font-medium">{detailEnquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Experience</p>
                    <p className="font-medium">{detailEnquiry.experience?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <a href={`mailto:${detailEnquiry.email}`} className="text-primary hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {detailEnquiry.email}
                    </a>
                  </div>
                  {detailEnquiry.phone && (
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {detailEnquiry.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs">Preferred Date</p>
                    <p>{detailEnquiry.preferred_date ? format(new Date(detailEnquiry.preferred_date), 'MMM d, yyyy') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Group Size</p>
                    <p>{detailEnquiry.group_size || '—'} guests</p>
                  </div>
                </div>
                {detailEnquiry.message && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Message</p>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{detailEnquiry.message}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  {statusBadge(detailEnquiry.status, detailEnquiry.created_at)}
                  <p className="text-xs text-muted-foreground">
                    Received {format(new Date(detailEnquiry.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminExperienceEnquiries;
