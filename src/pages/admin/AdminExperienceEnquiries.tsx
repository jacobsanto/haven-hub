import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Mail, Phone, Calendar, Users, Trash2, MessageSquare } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useExperienceEnquiries, useUpdateExperienceEnquiry, useDeleteExperienceEnquiry } from '@/hooks/useExperienceEnquiries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  contacted: 'secondary',
  confirmed: 'outline',
  cancelled: 'destructive',
};

const AdminExperienceEnquiries = () => {
  const { data: enquiries, isLoading } = useExperienceEnquiries();
  const updateEnquiry = useUpdateExperienceEnquiry();
  const deleteEnquiry = useDeleteExperienceEnquiry();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: 'new' | 'contacted' | 'confirmed' | 'cancelled') => {
    try {
      await updateEnquiry.mutateAsync({ id, status });
      toast.success('Enquiry status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteEnquiry.mutateAsync(deleteId);
      toast.success('Enquiry deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete enquiry');
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-medium">Experience Enquiries</h1>
            <p className="text-muted-foreground mt-1">
              Manage enquiries from guests interested in experiences
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-organic overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead className="hidden md:table-cell">Experience</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <div className="h-12 bg-muted animate-pulse rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : enquiries && enquiries.length > 0 ? (
                  enquiries.map((enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{enquiry.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${enquiry.email}`} className="hover:underline">
                              {enquiry.email}
                            </a>
                          </div>
                          {enquiry.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{enquiry.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {enquiry.experience?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {enquiry.preferred_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(enquiry.preferred_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {enquiry.group_size && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{enquiry.group_size} guests</span>
                            </div>
                          )}
                          {enquiry.message && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{enquiry.message}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={enquiry.status}
                          onValueChange={(value: 'new' | 'contacted' | 'confirmed' | 'cancelled') => 
                            handleStatusChange(enquiry.id, value)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <Badge variant={statusColors[enquiry.status]}>
                              {enquiry.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(enquiry.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(enquiry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No enquiries yet</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </motion.div>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this enquiry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminExperienceEnquiries;
