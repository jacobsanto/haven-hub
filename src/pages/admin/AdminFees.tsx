import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Receipt, Percent, DollarSign } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminFees, useCreateFee, useUpdateFee, useDeleteFee, FeeTax, FeeFormData } from '@/hooks/useAdminFees';
import { useAdminProperties } from '@/hooks/useProperties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const FEE_TYPES = [
  { value: 'fixed', label: 'Fixed Amount', description: 'One-time flat fee' },
  { value: 'percentage', label: 'Percentage', description: '% of booking subtotal' },
  { value: 'per_night', label: 'Per Night', description: 'Multiplied by nights' },
  { value: 'per_guest', label: 'Per Guest', description: 'Multiplied by guests' },
  { value: 'per_guest_per_night', label: 'Per Guest/Night', description: 'Guests × Nights' },
];

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'All Bookings' },
  { value: 'direct', label: 'Direct Bookings Only' },
  { value: 'ota', label: 'OTA Bookings Only' },
];

export default function AdminFees() {
  const { data: fees, isLoading } = useAdminFees();
  const { data: properties } = useAdminProperties();
  const createFee = useCreateFee();
  const updateFee = useUpdateFee();
  const deleteFee = useDeleteFee();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeTax | null>(null);
  const [formData, setFormData] = useState<FeeFormData>({
    property_id: null,
    name: '',
    fee_type: 'fixed',
    amount: 0,
    is_tax: false,
    is_mandatory: true,
    applies_to: 'all',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      property_id: null,
      name: '',
      fee_type: 'fixed',
      amount: 0,
      is_tax: false,
      is_mandatory: true,
      applies_to: 'all',
      is_active: true,
    });
    setEditingFee(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (fee: FeeTax) => {
    setEditingFee(fee);
    setFormData({
      property_id: fee.property_id,
      name: fee.name,
      fee_type: fee.fee_type,
      amount: fee.amount,
      is_tax: fee.is_tax,
      is_mandatory: fee.is_mandatory,
      applies_to: fee.applies_to,
      is_active: fee.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFee) {
        await updateFee.mutateAsync({ id: editingFee.id, ...formData });
        toast({ title: 'Fee updated successfully' });
      } else {
        await createFee.mutateAsync(formData);
        toast({ title: 'Fee created successfully' });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to save fee',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFee.mutateAsync(id);
      toast({ title: 'Fee deleted successfully' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete fee',
        variant: 'destructive' 
      });
    }
  };

  const handleToggleActive = async (fee: FeeTax) => {
    try {
      await updateFee.mutateAsync({ id: fee.id, is_active: !fee.is_active });
      toast({ title: `Fee ${fee.is_active ? 'deactivated' : 'activated'}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update fee', variant: 'destructive' });
    }
  };

  const formatAmount = (fee: FeeTax) => {
    if (fee.fee_type === 'percentage') {
      return `${fee.amount}%`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(fee.amount);
  };

  const getPropertyName = (propertyId: string | null) => {
    if (!propertyId) return 'All Properties';
    const property = properties?.find(p => p.id === propertyId);
    return property?.name || 'Unknown';
  };

  // Separate fees and taxes
  const taxItems = fees?.filter(f => f.is_tax) || [];
  const feeItems = fees?.filter(f => !f.is_tax) || [];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium">Fees & Taxes</h1>
              <p className="text-muted-foreground">
                Manage cleaning fees, VAT, and other charges applied to bookings
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fee or Tax
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="card-organic">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fees</p>
                      <p className="text-2xl font-semibold">{feeItems.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="card-organic">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <Percent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tax Types</p>
                      <p className="text-2xl font-semibold">{taxItems.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="card-organic">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-100">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-semibold">
                        {fees?.filter(f => f.is_active).length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Taxes Section */}
          <Card className="card-organic">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Taxes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taxItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxItems.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {FEE_TYPES.find(t => t.value === fee.fee_type)?.label || fee.fee_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{formatAmount(fee)}</TableCell>
                        <TableCell>{getPropertyName(fee.property_id)}</TableCell>
                        <TableCell>
                          {APPLIES_TO_OPTIONS.find(o => o.value === fee.applies_to)?.label}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={fee.is_active}
                            onCheckedChange={() => handleToggleActive(fee)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(fee)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tax?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{fee.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(fee.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No taxes configured yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Fees Section */}
          <Card className="card-organic">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feeItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeItems.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {FEE_TYPES.find(t => t.value === fee.fee_type)?.label || fee.fee_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{formatAmount(fee)}</TableCell>
                        <TableCell>{getPropertyName(fee.property_id)}</TableCell>
                        <TableCell>
                          <Badge variant={fee.is_mandatory ? 'default' : 'secondary'}>
                            {fee.is_mandatory ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={fee.is_active}
                            onCheckedChange={() => handleToggleActive(fee)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(fee)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Fee?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{fee.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(fee.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No fees configured yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingFee ? 'Edit Fee/Tax' : 'Add Fee or Tax'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cleaning Fee, VAT"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.is_tax ? 'tax' : 'fee'}
                    onValueChange={(v) => setFormData({ ...formData, is_tax: v === 'tax' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Calculation</Label>
                  <Select
                    value={formData.fee_type}
                    onValueChange={(v) => setFormData({ ...formData, fee_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {FEE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount {formData.fee_type === 'percentage' ? '(%)' : '(€)'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step={formData.fee_type === 'percentage' ? '0.01' : '1'}
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {FEE_TYPES.find(t => t.value === formData.fee_type)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Apply to Property</Label>
                <Select
                  value={formData.property_id || 'all'}
                  onValueChange={(v) => setFormData({ ...formData, property_id: v === 'all' ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(v) => setFormData({ ...formData, applies_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {APPLIES_TO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Mandatory</Label>
                  <p className="text-xs text-muted-foreground">
                    Required for all bookings
                  </p>
                </div>
                <Switch
                  checked={formData.is_mandatory}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Apply this fee to new bookings
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createFee.isPending || updateFee.isPending}>
                  {editingFee ? 'Save Changes' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminGuard>
  );
}
