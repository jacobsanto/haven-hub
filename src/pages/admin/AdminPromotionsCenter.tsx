import { useState, useMemo } from 'react';
import { format, isPast, isFuture, isWithinInterval } from 'date-fns';
import {
  Plus, Pencil, Trash2, Tag, Percent, Gift, Filter, Calendar,
  Building2, Layers, Copy, Megaphone, MousePointerClick, Clock,
  Eye, Sparkles, Bell, Settings, Loader2, BarChart3,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useAdminCoupons, useAdminSpecialOffers, useCreateCoupon,
  useUpdateCoupon, useDeleteCoupon, useUpdateSpecialOffer,
  useDeleteSpecialOffer, CouponPromo, SpecialOffer,
} from '@/hooks/useAdminPromotions';
import {
  usePromotionalCampaigns, useDeleteCampaign, useToggleCampaignActive,
} from '@/hooks/usePromotionalCampaigns';
import {
  useExitIntentSettings, useUpdateExitIntentSettings, useExitIntentAnalytics,
} from '@/hooks/useExitIntentSettings';
import { useProperties } from '@/hooks/useProperties';
import { CouponFormDialog } from '@/components/admin/CouponFormDialog';
import { SpecialOfferFormDialog } from '@/components/admin/SpecialOfferFormDialog';
import { PromotionalCampaignFormDialog } from '@/components/admin/PromotionalCampaignFormDialog';
import type { PromotionalCampaign } from '@/hooks/useActivePromotion';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';

// --- Helpers ---
const isExpired = (d: string) => new Date(d) < new Date();
const isUpcoming = (d: string) => new Date(d) > new Date();
const isActiveDate = (from: string, until: string, active: boolean) =>
  active && !isExpired(until) && !isUpcoming(from);

function getStatusBadge(from: string, until: string, active: boolean, maxUses?: number | null, usesCount?: number) {
  if (maxUses && usesCount != null && usesCount >= maxUses) return <Badge variant="destructive">Limit Reached</Badge>;
  if (!active) return <Badge variant="outline">Inactive</Badge>;
  if (isExpired(until)) return <Badge variant="secondary">Expired</Badge>;
  if (isUpcoming(from)) return <Badge className="bg-secondary/10 text-secondary-foreground border-secondary/20">Upcoming</Badge>;
  return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
}

function getCampaignStatus(c: PromotionalCampaign): string {
  const now = new Date();
  if (!c.is_active) return 'paused';
  if (isPast(new Date(c.ends_at))) return 'expired';
  if (isFuture(new Date(c.starts_at))) return 'scheduled';
  if (isWithinInterval(now, { start: new Date(c.starts_at), end: new Date(c.ends_at) })) return 'active';
  return 'expired';
}

function campaignStatusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
    case 'scheduled': return <Badge className="bg-secondary/10 text-secondary-foreground border-secondary/20">Scheduled</Badge>;
    case 'expired': return <Badge variant="secondary">Expired</Badge>;
    case 'paused': return <Badge variant="outline">Paused</Badge>;
    default: return null;
  }
}

export default function AdminPromotionsCenter() {
  // --- Coupons ---
  const { data: coupons, isLoading: couponsLoading } = useAdminCoupons();
  const updateCoupon = useUpdateCoupon();
  const createCoupon = useCreateCoupon();
  const deleteCouponMut = useDeleteCoupon();
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponPromo | null>(null);
  const [couponFilter, setCouponFilter] = useState<'all' | 'active' | 'expired' | 'upcoming'>('all');

  // --- Special Offers ---
  const { data: offers, isLoading: offersLoading } = useAdminSpecialOffers();
  const updateOffer = useUpdateSpecialOffer();
  const deleteOfferMut = useDeleteSpecialOffer();
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);

  // --- Campaigns ---
  const { data: campaigns, isLoading: campaignsLoading } = usePromotionalCampaigns();
  const deleteCampaignMut = useDeleteCampaign();
  const toggleCampaignActive = useToggleCampaignActive();
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null);

  // --- Exit Intent / Triggers ---
  const { data: exitSettings, isLoading: exitLoading } = useExitIntentSettings();
  const { data: exitAnalytics, isLoading: exitAnalyticsLoading } = useExitIntentAnalytics();
  const updateExitSettings = useUpdateExitIntentSettings();
  const [localExitSettings, setLocalExitSettings] = useState<typeof exitSettings | null>(null);
  const exitForm = localExitSettings || exitSettings;

  // Sync local state when settings load (in useEffect to avoid hook ordering issues)
  if (exitSettings && !localExitSettings) {
    setLocalExitSettings(exitSettings);
  }

  // --- Shared ---
  const { data: properties } = useProperties();
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'coupon' | 'offer' | 'campaign'; id: string; label: string } | null>(null);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    if (!coupons) return [];
    return coupons.filter(c => {
      if (couponFilter === 'all') return true;
      if (couponFilter === 'active') return isActiveDate(c.valid_from, c.valid_until, c.is_active);
      if (couponFilter === 'expired') return isExpired(c.valid_until);
      if (couponFilter === 'upcoming') return isUpcoming(c.valid_from);
      return true;
    });
  }, [coupons, couponFilter]);

  const getPropertyName = (id: string) => properties?.find(p => p.id === id)?.name || 'Unknown';

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      if (deleteDialog.type === 'coupon') await deleteCouponMut.mutateAsync(deleteDialog.id);
      else if (deleteDialog.type === 'offer') await deleteOfferMut.mutateAsync(deleteDialog.id);
      else if (deleteDialog.type === 'campaign') await deleteCampaignMut.mutateAsync(deleteDialog.id);
      toast.success(`${deleteDialog.label} deleted`);
    } catch { toast.error('Failed to delete'); }
    setDeleteDialog(null);
  };

  const handleDuplicateCoupon = async (c: CouponPromo) => {
    try {
      await createCoupon.mutateAsync({
        code: `${c.code}_COPY`,
        name: `${c.name} (Copy)`,
        description: c.description,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        min_nights: c.min_nights,
        min_booking_value: c.min_booking_value,
        max_uses: c.max_uses,
        valid_from: c.valid_from,
        valid_until: c.valid_until,
        applicable_properties: c.applicable_properties,
        stackable: c.stackable,
        is_active: false,
      });
      toast.success('Coupon duplicated');
    } catch { toast.error('Failed to duplicate'); }
  };

  const saveExitSettings = () => {
    if (!exitForm) return;
    updateExitSettings.mutate(exitForm);
  };

  const updateExitField = <K extends keyof NonNullable<typeof exitSettings>>(
    field: K, value: NonNullable<typeof exitSettings>[K]
  ) => {
    if (!exitForm) return;
    setLocalExitSettings({ ...exitForm, [field]: value });
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-serif font-medium">Promotions Control Center</h1>
            <p className="text-muted-foreground">
              Manage coupons, special offers, campaigns, and exit-intent triggers
            </p>
          </div>

          <Tabs defaultValue="coupons">
            <TabsList>
              <TabsTrigger value="coupons" className="gap-2">
                <Tag className="h-4 w-4" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-2">
                <Gift className="h-4 w-4" />
                Special Offers
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="triggers" className="gap-2">
                <Settings className="h-4 w-4" />
                Triggers
              </TabsTrigger>
            </TabsList>

            {/* ═══════ TAB 1: COUPONS ═══════ */}
            <TabsContent value="coupons" className="space-y-4 mt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={couponFilter} onValueChange={(v) => setCouponFilter(v as typeof couponFilter)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => { setEditingCoupon(null); setCouponDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Coupon
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {couponsLoading ? (
                    <div className="p-6 space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : filteredCoupons.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      {couponFilter !== 'all' ? `No ${couponFilter} coupons.` : 'No coupons yet.'}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Date Window</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCoupons.map(c => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <code className="font-mono font-semibold">{c.code}</code>
                              <p className="text-xs text-muted-foreground">{c.name}</p>
                            </TableCell>
                            <TableCell className="capitalize">{c.discount_type}</TableCell>
                            <TableCell className="text-right font-medium">
                              {c.discount_type === 'percentage' ? `${c.discount_value}%` :
                               c.discount_type === 'free_addon' ? 'Free' :
                               `€${c.discount_value}`}
                            </TableCell>
                            <TableCell>
                              {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(c.valid_from), 'MMM d')} – {format(new Date(c.valid_until), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(c.valid_from, c.valid_until, c.is_active, c.max_uses, c.uses_count)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={c.is_active}
                                onCheckedChange={() => updateCoupon.mutateAsync({ id: c.id, is_active: !c.is_active }).then(() => toast.success('Updated'))}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingCoupon(c); setCouponDialogOpen(true); }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateCoupon(c)}>
                                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateCoupon.mutateAsync({ id: c.id, is_active: false }).then(() => toast.success('Deactivated'))}>
                                    <Tag className="h-4 w-4 mr-2" /> Deactivate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDeleteDialog({ type: 'coupon', id: c.id, label: 'Coupon' })} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB 2: SPECIAL OFFERS ═══════ */}
            <TabsContent value="offers" className="space-y-4 mt-6">
              <div className="flex items-center justify-end">
                <Button onClick={() => { setEditingOffer(null); setOfferDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Offer
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {offersLoading ? (
                    <div className="p-6 space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : !offers || offers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No special offers yet.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead className="text-right">Discount</TableHead>
                          <TableHead>Date Window</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offers.map(o => (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium">{o.title}</TableCell>
                            <TableCell className="text-muted-foreground">{o.property?.name || 'Unknown'}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">{o.discount_percent}%</TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(o.valid_from), 'MMM d')} – {format(new Date(o.valid_until), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(o.valid_from, o.valid_until, o.is_active)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={o.is_active}
                                onCheckedChange={() => updateOffer.mutateAsync({ id: o.id, is_active: !o.is_active }).then(() => toast.success('Updated'))}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingOffer(o); setOfferDialogOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ type: 'offer', id: o.id, label: 'Offer' })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB 3: CAMPAIGNS ═══════ */}
            <TabsContent value="campaigns" className="space-y-4 mt-6">
              <div className="flex items-center justify-end">
                <Button onClick={() => { setEditingCampaign(null); setCampaignFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> New Campaign
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {campaignsLoading ? (
                    <div className="p-6 space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : !campaigns || campaigns.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No campaigns yet.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Trigger</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Impressions</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map(c => {
                          const status = getCampaignStatus(c);
                          const highImprLowConv = c.impressions_count > 100; // flag for visibility
                          return (
                            <TableRow key={c.id} className={status === 'expired' ? 'opacity-60' : ''}>
                              <TableCell>
                                <p className="font-medium">{c.title}</p>
                                {c.subtitle && <p className="text-xs text-muted-foreground">{c.subtitle}</p>}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 capitalize">
                                  {c.trigger_type === 'entry' && <MousePointerClick className="h-3.5 w-3.5" />}
                                  {c.trigger_type === 'timed' && <Clock className="h-3.5 w-3.5" />}
                                  {c.trigger_type === 'exit' && <span className="text-xs">↗</span>}
                                  {c.trigger_type}
                                  {c.trigger_delay_seconds > 0 && <span className="text-xs text-muted-foreground">({c.trigger_delay_seconds}s)</span>}
                                </div>
                              </TableCell>
                              <TableCell>
                                {c.discount_method === 'coupon' ? (
                                  <span className="text-xs">{c.coupon?.code || '—'}</span>
                                ) : (
                                  <span>{c.auto_discount_percent}% auto</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  {c.impressions_count.toLocaleString()}
                                  {c.max_impressions && <span className="text-muted-foreground">/ {c.max_impressions.toLocaleString()}</span>}
                                </div>
                                {highImprLowConv && (
                                  <p className="text-xs text-destructive/80 mt-0.5">High impressions</p>
                                )}
                              </TableCell>
                              <TableCell>{campaignStatusBadge(status)}</TableCell>
                              <TableCell>
                                <Switch
                                  checked={c.is_active}
                                  onCheckedChange={() => toggleCampaignActive.mutateAsync({ id: c.id, is_active: !c.is_active })}
                                  disabled={toggleCampaignActive.isPending}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setEditingCampaign(c); setCampaignFormOpen(true); }}>
                                      <Pencil className="h-4 w-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeleteDialog({ type: 'campaign', id: c.id, label: 'Campaign' })} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB 4: TRIGGERS (EXIT INTENT) ═══════ */}
            <TabsContent value="triggers" className="space-y-6 mt-6">
              {exitLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : exitForm ? (
                <>
                  {/* Analytics Summary */}
                  {!exitAnalyticsLoading && exitAnalytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Leads</p>
                          <p className="text-2xl font-semibold">{exitAnalytics.total}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Discount Signups</p>
                          <p className="text-2xl font-semibold">
                            {exitAnalytics.discountCount}
                            {exitAnalytics.total > 0 && (
                              <span className="text-sm text-muted-foreground ml-1">
                                ({Math.round((exitAnalytics.discountCount / exitAnalytics.total) * 100)}%)
                              </span>
                            )}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Price Drop Signups</p>
                          <p className="text-2xl font-semibold">
                            {exitAnalytics.priceDropCount}
                            {exitAnalytics.total > 0 && (
                              <span className="text-sm text-muted-foreground ml-1">
                                ({Math.round((exitAnalytics.priceDropCount / exitAnalytics.total) * 100)}%)
                              </span>
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Settings Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Exit Intent Settings</CardTitle>
                      <CardDescription>Configure when and how the exit intent modal appears</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Exit Intent Enabled</TableCell>
                            <TableCell className="text-right">
                              <Switch checked={exitForm.is_enabled} onCheckedChange={(v) => updateExitField('is_enabled', v)} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Delay (seconds)</TableCell>
                            <TableCell className="text-right">
                              <Input type="number" min={0} className="w-24 ml-auto" value={exitForm.delay_seconds} onChange={(e) => updateExitField('delay_seconds', parseInt(e.target.value) || 0)} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Cooldown (days)</TableCell>
                            <TableCell className="text-right">
                              <Input type="number" min={1} className="w-24 ml-auto" value={exitForm.cooldown_days} onChange={(e) => updateExitField('cooldown_days', parseInt(e.target.value) || 7)} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Discount Offer</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Checkbox checked={exitForm.discount_offer_enabled} onCheckedChange={(v) => updateExitField('discount_offer_enabled', !!v)} />
                                <Input type="number" min={1} max={100} className="w-20" value={exitForm.discount_percent} onChange={(e) => updateExitField('discount_percent', parseInt(e.target.value) || 10)} disabled={!exitForm.discount_offer_enabled} />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Price Drop Alerts</TableCell>
                            <TableCell className="text-right">
                              <Checkbox checked={exitForm.price_drop_offer_enabled} onCheckedChange={(v) => updateExitField('price_drop_offer_enabled', !!v)} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Headline</TableCell>
                            <TableCell className="text-right">
                              <Input className="max-w-sm ml-auto" value={exitForm.headline} onChange={(e) => updateExitField('headline', e.target.value)} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Subheadline</TableCell>
                            <TableCell className="text-right">
                              <Input className="max-w-sm ml-auto" value={exitForm.subheadline} onChange={(e) => updateExitField('subheadline', e.target.value)} />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <div className="flex justify-end mt-4">
                        <Button onClick={saveExitSettings} disabled={updateExitSettings.isPending}>
                          {updateExitSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <CouponFormDialog
          open={couponDialogOpen}
          onOpenChange={(open) => { setCouponDialogOpen(open); if (!open) setEditingCoupon(null); }}
          coupon={editingCoupon}
        />
        <SpecialOfferFormDialog
          open={offerDialogOpen}
          onOpenChange={(open) => { setOfferDialogOpen(open); if (!open) setEditingOffer(null); }}
          offer={editingOffer}
        />
        <PromotionalCampaignFormDialog
          open={campaignFormOpen}
          onOpenChange={setCampaignFormOpen}
          campaign={editingCampaign}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteDialog?.label}</AlertDialogTitle>
              <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </AdminGuard>
  );
}
