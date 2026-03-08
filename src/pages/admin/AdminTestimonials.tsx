import { useState } from 'react';
import { Plus, Edit, Trash2, Quote, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  useAllTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  type Testimonial,
  type TestimonialInput,
} from '@/hooks/useTestimonials';

const PLATFORM_OPTIONS = [
  { value: 'booking', label: 'Booking.com' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'google', label: 'Google' },
  { value: 'direct', label: 'Direct' },
];

const PLATFORM_COLORS: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-800',
  tripadvisor: 'bg-green-100 text-green-800',
  airbnb: 'bg-rose-100 text-rose-800',
  google: 'bg-yellow-100 text-yellow-800',
  direct: 'bg-purple-100 text-purple-800',
};

const emptyForm: TestimonialInput = {
  platform: 'direct',
  text: '',
  author: '',
  location: '',
  rating: 5,
  display_order: 0,
  is_active: true,
};

function TestimonialFormDialog({
  open,
  onClose,
  initial,
  nextOrder,
}: {
  open: boolean;
  onClose: () => void;
  initial: (Testimonial & { isEdit: true }) | null;
  nextOrder: number;
}) {
  const [form, setForm] = useState<TestimonialInput>(
    initial ? { ...initial } : { ...emptyForm, display_order: nextOrder }
  );

  const create = useCreateTestimonial();
  const update = useUpdateTestimonial();
  const isPending = create.isPending || update.isPending;

  // Reset form when dialog opens
  const handleOpen = (open: boolean) => {
    if (open) {
      setForm(initial ? { ...initial } : { ...emptyForm, display_order: nextOrder });
    }
  };

  const handleSubmit = async () => {
    if (!form.text.trim() || !form.author.trim() || !form.location.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...form });
        toast.success('Testimonial updated');
      } else {
        await create.mutateAsync(form);
        toast.success('Testimonial added');
      }
      onClose();
    } catch {
      toast.error('Failed to save testimonial');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { handleOpen(v); if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          <DialogDescription>
            {initial ? 'Update the guest review details.' : 'Add a new guest review to display on the homepage.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Review <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              placeholder="The guest's review text..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Author <span className="text-destructive">*</span></Label>
              <Input
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                placeholder="e.g. Sarah M."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location / Date <span className="text-destructive">*</span></Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Santorini, June 2025"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <Select
                value={String(form.rating)}
                onValueChange={(v) => setForm((f) => ({ ...f, rating: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={String(r)}>{'★'.repeat(r)} ({r}/5)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Display Order</Label>
              <Input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Active</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <span className="text-sm text-muted-foreground">
                  {form.is_active ? 'Visible on site' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving…' : initial ? 'Save Changes' : 'Add Testimonial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const AdminTestimonials = () => {
  const { data: testimonials, isLoading } = useAllTestimonials();
  const deleteTestimonial = useDeleteTestimonial();
  const updateTestimonial = useUpdateTestimonial();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<(Testimonial & { isEdit: true }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const nextOrder = (testimonials?.length ?? 0) + 1;

  const handleToggleActive = async (t: Testimonial) => {
    try {
      await updateTestimonial.mutateAsync({ id: t.id, is_active: !t.is_active });
      toast.success(t.is_active ? 'Testimonial hidden' : 'Testimonial published');
    } catch {
      toast.error('Failed to update testimonial');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTestimonial.mutateAsync(deleteId);
      toast.success('Testimonial deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete testimonial');
    }
  };

  const openEdit = (t: Testimonial) => {
    setEditTarget({ ...t, isEdit: true });
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const platformLabel = (p: string) =>
    PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold text-foreground">Testimonials</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage guest reviews displayed on the homepage.
              </p>
            </div>
            <Button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </div>

          {/* Stats bar */}
          {testimonials && testimonials.length > 0 && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{testimonials.length} total</span>
              <span>·</span>
              <span>{testimonials.filter((t) => t.is_active).length} active</span>
              <span>·</span>
              <span>{testimonials.filter((t) => !t.is_active).length} hidden</span>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !testimonials || testimonials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl">
              <Quote className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="font-medium text-foreground">No testimonials yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Add your first guest review to display on the homepage.
              </p>
              <Button onClick={() => { setEditTarget(null); setShowForm(true); }} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Review</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm italic text-foreground line-clamp-2">"{t.text}"</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{t.author}</p>
                          <p className="text-xs text-muted-foreground">{t.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            PLATFORM_COLORS[t.platform] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {platformLabel(t.platform)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-yellow-500 text-sm">{'★'.repeat(t.rating)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{t.display_order}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? 'default' : 'secondary'}>
                          {t.is_active ? 'Active' : 'Hidden'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t.is_active ? 'Hide' : 'Publish'}
                            onClick={() => handleToggleActive(t)}
                          >
                            {t.is_active ? (
                              <ToggleRight className="h-4 w-4 text-primary" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(t)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(t.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Form dialog */}
        <TestimonialFormDialog
          open={showForm}
          onClose={handleFormClose}
          initial={editTarget}
          nextOrder={nextOrder}
        />

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the testimonial. This action cannot be undone.
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

export default AdminTestimonials;
