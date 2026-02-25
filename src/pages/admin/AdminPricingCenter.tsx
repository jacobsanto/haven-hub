import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Copy, Calendar, Tag, Sun, Receipt, Upload, Download, FileText, CheckCircle, XCircle, Loader2, AlertTriangle, DollarSign, Shield } from 'lucide-react';
import { format, parseISO, isWithinInterval, isBefore } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAdminRatePlans, useCreateRatePlan, useUpdateRatePlan, useDeleteRatePlan, useDuplicateRatePlan, RatePlan, RatePlanFormData } from '@/hooks/useAdminRatePlans';
import { useSeasonalRates, useCreateSeasonalRate, useUpdateSeasonalRate, useDeleteSeasonalRate } from '@/hooks/useSeasonalRates';
import { useAdminFees, useCreateFee, useUpdateFee, useDeleteFee, FeeTax, FeeFormData } from '@/hooks/useAdminFees';
import { useAdminProperties } from '@/hooks/useProperties';
import { SeasonalRateFormDialog } from '@/components/admin/SeasonalRateFormDialog';
import { SeasonalRate } from '@/types/database';
import { CANCELLATION_POLICIES, CancellationPolicyKey, getPolicyBadgeClass } from '@/lib/cancellation-policies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { supabase } from '@/integrations/supabase/client';

const RATE_TYPES = [
  { value: 'standard', label: 'Standard', description: 'Default pricing for all guests' },
  { value: 'member', label: 'Member Rate', description: 'Exclusive pricing for loyalty members' },
  { value: 'promotional', label: 'Promotional', description: 'Limited-time special offers' },
  { value: 'early_bird', label: 'Early Bird', description: 'Discount for advance bookings' },
  { value: 'last_minute', label: 'Last Minute', description: 'Short-notice deals' },
  { value: 'long_stay', label: 'Long Stay', description: 'Extended booking discounts' },
];

const MEMBER_TIERS = [
  { value: 'none', label: 'No Requirement' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
];

const FEE_TYPES = [
  { value: 'fixed', label: 'Fixed Amount', description: 'One-time flat fee' },
  { value: 'percentage', label: 'Percentage', description: '% of booking subtotal' },
  { value: 'per_night', label: 'Per Night', description: 'Multiplied by nights' },
  { value: 'per_guest', label: 'Per Guest', description: 'Multiplied by guests' },
  { value: 'per_guest_per_night', label: 'Per Guest/Night', description: 'Guests × Nights' },
];

const APPLIES_TO_OPTIONS = [
  { value: 'all', label: 'All Bookings' },
  { value: 'direct', label: 'Direct Only' },
  { value: 'ota', label: 'OTA Only' },
];

// ─── CSV Import types ───
interface ValidationResult {
  row: number;
  property_slug: string;
  property_name: string | null;
  season_name: string;
  start_date: string;
  end_date: string;
  nightly_rate: number | null;
  price_multiplier: number | null;
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  row: number;
  property_slug: string;
  season_name: string;
  success: boolean;
  error?: string;
}

export default function AdminPricingCenter() {
  const { toast } = useToast();
  const { data: ratePlans, isLoading: loadingPlans } = useAdminRatePlans();
  const { data: properties } = useAdminProperties();
  const { data: fees, isLoading: loadingFees } = useAdminFees();
  const { format: formatCurrency } = useFormatCurrency();

  // Rate plan mutations
  const createRatePlan = useCreateRatePlan();
  const updateRatePlan = useUpdateRatePlan();
  const deleteRatePlan = useDeleteRatePlan();
  const duplicateRatePlan = useDuplicateRatePlan();

  // Fee mutations
  const createFee = useCreateFee();
  const updateFee = useUpdateFee();
  const deleteFee = useDeleteFee();

  // Rate plan dialog
  const [rpDialogOpen, setRpDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RatePlan | null>(null);
  const [filterProperty, setFilterProperty] = useState('all');

  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  const [rpForm, setRpForm] = useState<RatePlanFormData>({
    property_id: '', name: '', description: null, rate_type: 'standard',
    base_rate: 0, min_stay: 1, max_stay: null,
    valid_from: format(today, 'yyyy-MM-dd'), valid_until: format(nextYear, 'yyyy-MM-dd'),
    member_tier_required: null, cancellation_policy: 'moderate', is_active: true,
  });

  const resetRpForm = () => {
    setRpForm({
      property_id: '', name: '', description: null, rate_type: 'standard',
      base_rate: 0, min_stay: 1, max_stay: null,
      valid_from: format(today, 'yyyy-MM-dd'), valid_until: format(nextYear, 'yyyy-MM-dd'),
      member_tier_required: null, cancellation_policy: 'moderate', is_active: true,
    });
    setEditingPlan(null);
  };

  const openRpCreate = () => { resetRpForm(); setRpDialogOpen(true); };
  const openRpEdit = (plan: RatePlan) => {
    setEditingPlan(plan);
    setRpForm({
      property_id: plan.property_id, name: plan.name, description: plan.description,
      rate_type: plan.rate_type, base_rate: plan.base_rate, min_stay: plan.min_stay,
      max_stay: plan.max_stay, valid_from: plan.valid_from, valid_until: plan.valid_until,
      member_tier_required: plan.member_tier_required, cancellation_policy: plan.cancellation_policy, is_active: plan.is_active,
    });
    setRpDialogOpen(true);
  };

  const handleRpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rpForm.property_id) { toast({ title: 'Select a property', variant: 'destructive' }); return; }
    try {
      if (editingPlan) { await updateRatePlan.mutateAsync({ id: editingPlan.id, ...rpForm }); toast({ title: 'Rate plan updated' }); }
      else { await createRatePlan.mutateAsync(rpForm); toast({ title: 'Rate plan created' }); }
      setRpDialogOpen(false); resetRpForm();
    } catch (err) { toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' }); }
  };

  const handleRpDelete = async (id: string) => { try { await deleteRatePlan.mutateAsync(id); toast({ title: 'Deleted' }); } catch { toast({ title: 'Error', variant: 'destructive' }); } };
  const handleRpDuplicate = async (id: string) => { try { await duplicateRatePlan.mutateAsync(id); toast({ title: 'Duplicated' }); } catch { toast({ title: 'Error', variant: 'destructive' }); } };
  const handleRpToggle = async (plan: RatePlan) => { try { await updateRatePlan.mutateAsync({ id: plan.id, is_active: !plan.is_active }); toast({ title: plan.is_active ? 'Deactivated' : 'Activated' }); } catch { toast({ title: 'Error', variant: 'destructive' }); } };

  // Seasonal rates
  const [selectedPropertyForSeasons, setSelectedPropertyForSeasons] = useState('');
  const [seasonalDialogOpen, setSeasonalDialogOpen] = useState(false);
  const [editingSeasonalRate, setEditingSeasonalRate] = useState<SeasonalRate | null>(null);
  const { data: seasonalRates } = useSeasonalRates(selectedPropertyForSeasons);
  const createSeasonalRate = useCreateSeasonalRate();
  const updateSeasonalRate = useUpdateSeasonalRate();
  const deleteSeasonalRate = useDeleteSeasonalRate();
  const selectedProperty = properties?.find(p => p.id === selectedPropertyForSeasons);

  const handleSeasonalSubmit = async (data: Omit<SeasonalRate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingSeasonalRate) { await updateSeasonalRate.mutateAsync({ id: editingSeasonalRate.id, ...data }); toast({ title: 'Seasonal rate updated' }); }
      else { await createSeasonalRate.mutateAsync(data); toast({ title: 'Seasonal rate created' }); }
      setSeasonalDialogOpen(false); setEditingSeasonalRate(null);
    } catch (err) { toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' }); }
  };

  const handleSeasonalDelete = async (id: string) => {
    try { await deleteSeasonalRate.mutateAsync({ id, propertyId: selectedPropertyForSeasons }); toast({ title: 'Deleted' }); } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  // Fees dialog
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeTax | null>(null);
  const [feeForm, setFeeForm] = useState<FeeFormData>({
    property_id: null, name: '', fee_type: 'fixed', amount: 0, is_tax: false, is_mandatory: true, applies_to: 'all', is_active: true,
  });

  const resetFeeForm = () => { setFeeForm({ property_id: null, name: '', fee_type: 'fixed', amount: 0, is_tax: false, is_mandatory: true, applies_to: 'all', is_active: true }); setEditingFee(null); };
  const openFeeCreate = () => { resetFeeForm(); setFeeDialogOpen(true); };
  const openFeeEdit = (fee: FeeTax) => {
    setEditingFee(fee);
    setFeeForm({ property_id: fee.property_id, name: fee.name, fee_type: fee.fee_type, amount: fee.amount, is_tax: fee.is_tax, is_mandatory: fee.is_mandatory, applies_to: fee.applies_to, is_active: fee.is_active });
    setFeeDialogOpen(true);
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFee) { await updateFee.mutateAsync({ id: editingFee.id, ...feeForm }); toast({ title: 'Fee updated' }); }
      else { await createFee.mutateAsync(feeForm); toast({ title: 'Fee created' }); }
      setFeeDialogOpen(false); resetFeeForm();
    } catch (err) { toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' }); }
  };

  const handleFeeDelete = async (id: string) => { try { await deleteFee.mutateAsync(id); toast({ title: 'Deleted' }); } catch { toast({ title: 'Error', variant: 'destructive' }); } };
  const handleFeeToggle = async (fee: FeeTax) => { try { await updateFee.mutateAsync({ id: fee.id, is_active: !fee.is_active }); toast({ title: fee.is_active ? 'Deactivated' : 'Activated' }); } catch { toast({ title: 'Error', variant: 'destructive' }); } };

  // Import state
  const [csvContent, setCsvContent] = useState('');
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }, []);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { toast({ title: 'Invalid File', description: 'Upload a CSV file.', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setCsvContent(e.target?.result as string); setValidationResults(null); setImportResults(null); setImportStep(2); };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `property_slug,season_name,start_date,end_date,nightly_rate,price_multiplier\nvilla-example,High Season,2026-07-01,2026-08-31,450,\nvilla-example,Low Season,2026-11-01,2026-12-20,,0.75`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'seasonal-rates-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const validateCSV = async () => {
    if (!csvContent.trim()) return;
    setIsValidating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seasonal-rates-import`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'validate', csvContent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Validation failed');
      setValidationResults(result.results);
      if (result.invalidRows === 0) setImportStep(3);
      toast({ title: 'Validation Complete', description: `${result.validRows} valid, ${result.invalidRows} invalid` });
    } catch (err) { toast({ title: 'Validation Failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }); }
    finally { setIsValidating(false); }
  };

  const importRates = async () => {
    if (!csvContent.trim()) return;
    setIsImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seasonal-rates-import`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'import', csvContent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Import failed');
      setImportResults(result.results);
      toast({ title: result.failedCount === 0 ? 'Import Successful' : 'Import with Errors', description: `${result.successCount} imported, ${result.failedCount} failed` });
      if (result.failedCount === 0) { setCsvContent(''); setImportStep(1); }
    } catch (err) { toast({ title: 'Import Failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' }); }
    finally { setIsImporting(false); }
  };

  // Helpers
  const getSeasonStatus = (startDate: string, endDate: string) => {
    const start = parseISO(startDate); const end = parseISO(endDate); const now = new Date();
    if (isWithinInterval(now, { start, end })) return { label: 'Active', className: 'bg-green-100 text-green-700' };
    if (isBefore(now, start)) return { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' };
    return { label: 'Expired', className: 'bg-muted text-muted-foreground' };
  };

  const getRateTypeBadge = (rateType: string) => {
    const type = RATE_TYPES.find(t => t.value === rateType);
    const colors: Record<string, string> = { standard: 'bg-secondary text-secondary-foreground', member: 'bg-primary/10 text-primary', promotional: 'bg-accent/20 text-accent-foreground' };
    return <Badge className={colors[rateType] || 'bg-secondary'}>{type?.label || rateType}</Badge>;
  };

  const formatFeeAmount = (fee: FeeTax) => fee.fee_type === 'percentage' ? `${fee.amount}%` : formatCurrency(fee.amount);
  const getPropertyName = (id: string | null) => id ? properties?.find(p => p.id === id)?.name || 'Unknown' : 'All Properties';

  // Filtered rate plans — sorted: active first, then by property
  const sortedPlans = useMemo(() => {
    const filtered = ratePlans?.filter(p => filterProperty === 'all' || p.property_id === filterProperty) || [];
    return [...filtered].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return (a.property?.name || '').localeCompare(b.property?.name || '');
    });
  }, [ratePlans, filterProperty]);

  // Fees separated
  const portfolioFees = fees?.filter(f => !f.property_id) || [];
  const propertyFees = fees?.filter(f => f.property_id) || [];

  // Consistency indicator: check if properties of same type have different fee structures
  const feeConsistencyWarnings = useMemo(() => {
    if (!properties || !fees) return [];
    const warnings: string[] = [];
    const propTypeFees = new Map<string, Set<string>>();
    properties.forEach(p => {
      const key = p.property_type;
      const propSpecificFees = fees.filter(f => f.property_id === p.id).map(f => f.name).sort().join(',');
      if (!propTypeFees.has(key)) propTypeFees.set(key, new Set());
      propTypeFees.get(key)!.add(propSpecificFees);
    });
    propTypeFees.forEach((feeStructures, type) => {
      if (feeStructures.size > 1) warnings.push(`${type} properties have inconsistent fee structures`);
    });
    return warnings;
  }, [properties, fees]);

  const activeSeasons = seasonalRates?.filter(r => getSeasonStatus(r.start_date, r.end_date).label === 'Active').length || 0;
  const validCount = validationResults?.filter(r => r.valid).length || 0;
  const invalidCount = validationResults?.filter(r => !r.valid).length || 0;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-semibold flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary" />
              Pricing Control Center
            </h1>
            <p className="text-muted-foreground mt-1">Manage rate plans, seasonal pricing, fees, and bulk imports.</p>
          </div>

          <Tabs defaultValue="rate-plans" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="rate-plans">Base Rate Plans</TabsTrigger>
              <TabsTrigger value="seasonal">Seasonal Rates</TabsTrigger>
              <TabsTrigger value="fees">Fees & Taxes</TabsTrigger>
              <TabsTrigger value="import">Import / Bulk</TabsTrigger>
            </TabsList>

            {/* ── TAB 1: BASE RATE PLANS ── */}
            <TabsContent value="rate-plans" className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <Select value={filterProperty} onValueChange={setFilterProperty}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Properties" /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={openRpCreate}><Plus className="h-4 w-4 mr-1" />Add Rate Plan</Button>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Base Rate</TableHead>
                      <TableHead>Min Stay</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Date Window</TableHead>
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPlans ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                    ) : sortedPlans.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No rate plans yet</TableCell></TableRow>
                    ) : sortedPlans.map(plan => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium text-sm">{plan.property?.name || '—'}</TableCell>
                        <TableCell>{plan.name}</TableCell>
                        <TableCell>{getRateTypeBadge(plan.rate_type)}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCurrency(plan.base_rate)}/nt</TableCell>
                        <TableCell>{plan.min_stay}{plan.max_stay ? `–${plan.max_stay}` : '+'} nights</TableCell>
                        <TableCell><Switch checked={plan.is_active} onCheckedChange={() => handleRpToggle(plan)} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(parseISO(plan.valid_from), 'MMM d')} – {format(parseISO(plan.valid_until), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openRpEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRpDuplicate(plan.id)}><Copy className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete "{plan.name}"?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRpDelete(plan.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── TAB 2: SEASONAL RATES ── */}
            <TabsContent value="seasonal" className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Select value={selectedPropertyForSeasons} onValueChange={setSelectedPropertyForSeasons}>
                    <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedPropertyForSeasons && (
                    <span className="text-sm text-muted-foreground">{activeSeasons} active season{activeSeasons !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <Button size="sm" onClick={() => { if (!selectedPropertyForSeasons) { toast({ title: 'Select a property first', variant: 'destructive' }); return; } setEditingSeasonalRate(null); setSeasonalDialogOpen(true); }} disabled={!selectedPropertyForSeasons}>
                  <Plus className="h-4 w-4 mr-1" />Add Season
                </Button>
              </div>

              {selectedPropertyForSeasons ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Season Name</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Rate Override</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!seasonalRates?.length ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No seasonal rates for this property</TableCell></TableRow>
                      ) : seasonalRates.map(rate => {
                        const status = getSeasonStatus(rate.start_date, rate.end_date);
                        const effectiveRate = rate.nightly_rate || (selectedProperty?.base_price || 0) * rate.price_multiplier;
                        return (
                          <TableRow key={rate.id}>
                            <TableCell className="font-medium">{rate.name}</TableCell>
                            <TableCell className="text-sm">{format(parseISO(rate.start_date), 'MMM d, yyyy')} – {format(parseISO(rate.end_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {rate.nightly_rate ? `${formatCurrency(rate.nightly_rate)}/nt (fixed)` : `${rate.price_multiplier}× → ${formatCurrency(effectiveRate)}/nt`}
                            </TableCell>
                            <TableCell><Badge className={status.className}>{status.label}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingSeasonalRate(rate); setSeasonalDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete "{rate.name}"?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleSeasonalDelete(rate.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">Select a property to manage seasonal rates.</div>
              )}
            </TabsContent>

            {/* ── TAB 3: FEES & TAXES ── */}
            <TabsContent value="fees" className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{fees?.filter(f => f.is_active).length || 0} active fees & taxes</span>
                <Button size="sm" onClick={openFeeCreate}><Plus className="h-4 w-4 mr-1" />Add Fee or Tax</Button>
              </div>

              {feeConsistencyWarnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Fee Inconsistency</AlertTitle>
                  <AlertDescription>{feeConsistencyWarnings.join('. ')}</AlertDescription>
                </Alert>
              )}

              {/* Portfolio-Level */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Portfolio-Level</h3>
                <FeesTable fees={portfolioFees} onEdit={openFeeEdit} onDelete={handleFeeDelete} onToggle={handleFeeToggle} getPropertyName={getPropertyName} formatAmount={formatFeeAmount} loading={loadingFees} />
              </div>

              {/* Property-Specific */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Property-Specific</h3>
                <FeesTable fees={propertyFees} onEdit={openFeeEdit} onDelete={handleFeeDelete} onToggle={handleFeeToggle} getPropertyName={getPropertyName} formatAmount={formatFeeAmount} loading={loadingFees} />
              </div>
            </TabsContent>

            {/* ── TAB 4: IMPORT / BULK ── */}
            <TabsContent value="import" className="space-y-6">
              {/* 3-step wizard */}
              <div className="flex items-center gap-2 text-sm">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold',
                      importStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>{step}</div>
                    <span className={cn(importStep >= step ? 'text-foreground' : 'text-muted-foreground')}>
                      {step === 1 ? 'Upload' : step === 2 ? 'Validate' : 'Import'}
                    </span>
                    {step < 3 && <div className="w-8 h-px bg-border" />}
                  </div>
                ))}
              </div>

              {importStep === 1 && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4 mr-1" />Download Template</Button>
                  </div>
                  <div
                    className={cn('border-2 border-dashed rounded-lg p-8 text-center transition-colors', dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50')}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  >
                    <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drop CSV file here or click to browse</p>
                    </label>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{csvContent.split('\n').length - 1} rows loaded</span>
                    <Button size="sm" onClick={validateCSV} disabled={isValidating}>
                      {isValidating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Validate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setCsvContent(''); setValidationResults(null); setImportStep(1); }}>Clear</Button>
                  </div>

                  {validationResults && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge variant={invalidCount > 0 ? 'destructive' : 'default'}>{validCount} valid</Badge>
                        {invalidCount > 0 && <Badge variant="destructive">{invalidCount} invalid</Badge>}
                      </div>
                      <div className="rounded-lg border max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Row</TableHead>
                              <TableHead className="w-12">OK</TableHead>
                              <TableHead>Property</TableHead>
                              <TableHead>Season</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>Issues</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationResults.map(r => (
                              <TableRow key={r.row} className={!r.valid ? 'bg-destructive/5' : ''}>
                                <TableCell className="font-mono text-xs">{r.row}</TableCell>
                                <TableCell>{r.valid ? <CheckCircle className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}</TableCell>
                                <TableCell className="text-sm">{r.property_name || r.property_slug}</TableCell>
                                <TableCell className="text-sm">{r.season_name}</TableCell>
                                <TableCell className="text-xs">{r.start_date} → {r.end_date}</TableCell>
                                <TableCell className="text-sm">{r.nightly_rate ? `€${r.nightly_rate}/nt` : r.price_multiplier ? `${r.price_multiplier}×` : '—'}</TableCell>
                                <TableCell>{r.errors.length > 0 && <ul className="text-xs text-destructive list-disc list-inside">{r.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {invalidCount === 0 && <Button size="sm" onClick={() => setImportStep(3)}>Proceed to Import</Button>}
                    </div>
                  )}
                </div>
              )}

              {importStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm">{validCount} rate{validCount !== 1 ? 's' : ''} ready to import.</p>
                  <div className="flex gap-2">
                    <Button onClick={importRates} disabled={isImporting}>
                      {isImporting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Import {validCount} Rates
                    </Button>
                    <Button variant="ghost" onClick={() => setImportStep(2)}>Back</Button>
                  </div>

                  {importResults && (
                    <div className="rounded-lg border max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Row</TableHead>
                            <TableHead className="w-12">OK</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Season</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResults.map(r => (
                            <TableRow key={r.row} className={!r.success ? 'bg-destructive/5' : ''}>
                              <TableCell className="font-mono text-xs">{r.row}</TableCell>
                              <TableCell>{r.success ? <CheckCircle className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}</TableCell>
                              <TableCell>{r.property_slug}</TableCell>
                              <TableCell>{r.season_name}</TableCell>
                              <TableCell className="text-xs text-destructive">{r.error || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Rate Plan Dialog ── */}
        <Dialog open={rpDialogOpen} onOpenChange={setRpDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">{editingPlan ? 'Edit Rate Plan' : 'Create Rate Plan'}</DialogTitle></DialogHeader>
            <form onSubmit={handleRpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select value={rpForm.property_id} onValueChange={v => setRpForm({ ...rpForm, property_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">{properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={rpForm.name} onChange={e => setRpForm({ ...rpForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={rpForm.rate_type} onValueChange={v => setRpForm({ ...rpForm, rate_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">{RATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={rpForm.description || ''} onChange={e => setRpForm({ ...rpForm, description: e.target.value || null })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Cancellation Policy</Label>
                  <Select value={rpForm.cancellation_policy} onValueChange={v => setRpForm({ ...rpForm, cancellation_policy: v as CancellationPolicyKey })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {Object.values(CANCELLATION_POLICIES).map(p => <SelectItem key={p.key} value={p.key}><div className="flex items-center gap-2"><Shield className="h-3 w-3" />{p.label}</div></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Base Rate (€/nt) *</Label><Input type="number" min="0" value={rpForm.base_rate} onChange={e => setRpForm({ ...rpForm, base_rate: parseFloat(e.target.value) || 0 })} required /></div>
                <div className="space-y-2"><Label>Min Stay</Label><Input type="number" min="1" value={rpForm.min_stay} onChange={e => setRpForm({ ...rpForm, min_stay: parseInt(e.target.value) || 1 })} /></div>
                <div className="space-y-2"><Label>Max Stay</Label><Input type="number" min="1" value={rpForm.max_stay || ''} onChange={e => setRpForm({ ...rpForm, max_stay: e.target.value ? parseInt(e.target.value) : null })} placeholder="∞" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From *</Label>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className={cn('w-full justify-start text-left font-normal')}><Calendar className="mr-2 h-4 w-4" />{rpForm.valid_from ? format(parseISO(rpForm.valid_from), 'PPP') : 'Pick date'}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start"><CalendarComponent mode="single" selected={rpForm.valid_from ? parseISO(rpForm.valid_from) : undefined} onSelect={d => d && setRpForm({ ...rpForm, valid_from: format(d, 'yyyy-MM-dd') })} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Valid Until *</Label>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className={cn('w-full justify-start text-left font-normal')}><Calendar className="mr-2 h-4 w-4" />{rpForm.valid_until ? format(parseISO(rpForm.valid_until), 'PPP') : 'Pick date'}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start"><CalendarComponent mode="single" selected={rpForm.valid_until ? parseISO(rpForm.valid_until) : undefined} onSelect={d => d && setRpForm({ ...rpForm, valid_until: format(d, 'yyyy-MM-dd') })} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Member Tier</Label>
                <Select value={rpForm.member_tier_required || 'none'} onValueChange={v => setRpForm({ ...rpForm, member_tier_required: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">{MEMBER_TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2 border-t">
                <div><Label>Active</Label><p className="text-xs text-muted-foreground">Available for booking</p></div>
                <Switch checked={rpForm.is_active} onCheckedChange={c => setRpForm({ ...rpForm, is_active: c })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRpDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createRatePlan.isPending || updateRatePlan.isPending}>{editingPlan ? 'Save' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Fee Dialog ── */}
        <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle className="font-serif">{editingFee ? 'Edit Fee/Tax' : 'Add Fee or Tax'}</DialogTitle></DialogHeader>
            <form onSubmit={handleFeeSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={feeForm.name} onChange={e => setFeeForm({ ...feeForm, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={feeForm.is_tax ? 'tax' : 'fee'} onValueChange={v => setFeeForm({ ...feeForm, is_tax: v === 'tax' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50"><SelectItem value="fee">Fee</SelectItem><SelectItem value="tax">Tax</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Calculation</Label>
                  <Select value={feeForm.fee_type} onValueChange={v => setFeeForm({ ...feeForm, fee_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">{FEE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount {feeForm.fee_type === 'percentage' ? '(%)' : '(€)'}</Label>
                <Input type="number" step={feeForm.fee_type === 'percentage' ? '0.01' : '1'} min="0" value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={feeForm.property_id || 'all'} onValueChange={v => setFeeForm({ ...feeForm, property_id: v === 'all' ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50"><SelectItem value="all">All Properties</SelectItem>{properties?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select value={feeForm.applies_to} onValueChange={v => setFeeForm({ ...feeForm, applies_to: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">{APPLIES_TO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2"><div><Label>Mandatory</Label></div><Switch checked={feeForm.is_mandatory} onCheckedChange={c => setFeeForm({ ...feeForm, is_mandatory: c })} /></div>
              <div className="flex items-center justify-between py-2"><div><Label>Active</Label></div><Switch checked={feeForm.is_active} onCheckedChange={c => setFeeForm({ ...feeForm, is_active: c })} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFeeDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createFee.isPending || updateFee.isPending}>{editingFee ? 'Save' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Seasonal Rate Dialog */}
        <SeasonalRateFormDialog
          open={seasonalDialogOpen}
          onOpenChange={setSeasonalDialogOpen}
          editingRate={editingSeasonalRate}
          propertyId={selectedPropertyForSeasons}
          propertyBasePrice={selectedProperty?.base_price || 0}
          onSubmit={handleSeasonalSubmit}
          isSubmitting={createSeasonalRate.isPending || updateSeasonalRate.isPending}
        />
      </AdminLayout>
    </AdminGuard>
  );
}

// ── Reusable Fees Table ──
function FeesTable({ fees, onEdit, onDelete, onToggle, getPropertyName, formatAmount, loading }: {
  fees: FeeTax[];
  onEdit: (f: FeeTax) => void;
  onDelete: (id: string) => void;
  onToggle: (f: FeeTax) => void;
  getPropertyName: (id: string | null) => string;
  formatAmount: (f: FeeTax) => string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Calculation</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Applies To</TableHead>
            <TableHead>Mandatory</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
          ) : fees.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">None configured</TableCell></TableRow>
          ) : fees.map(fee => (
            <TableRow key={fee.id}>
              <TableCell className="font-medium">{fee.name}</TableCell>
              <TableCell><Badge variant="outline">{fee.is_tax ? 'Tax' : 'Fee'}</Badge></TableCell>
              <TableCell className="text-sm">{FEE_TYPES.find(t => t.value === fee.fee_type)?.label || fee.fee_type}</TableCell>
              <TableCell className="font-mono text-sm">{formatAmount(fee)}</TableCell>
              <TableCell className="text-sm">{getPropertyName(fee.property_id)}</TableCell>
              <TableCell><Badge variant={fee.is_mandatory ? 'default' : 'secondary'}>{fee.is_mandatory ? 'Yes' : 'No'}</Badge></TableCell>
              <TableCell><Switch checked={fee.is_active} onCheckedChange={() => onToggle(fee)} /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(fee)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete "{fee.name}"?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(fee.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
