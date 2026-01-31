import { useState } from 'react';
import { format, isPast, isFuture, isWithinInterval } from 'date-fns';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Tag,
  Sparkles,
  Clock,
  MousePointerClick,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Skeleton } from '@/components/ui/skeleton';
import { PromotionalCampaignFormDialog } from '@/components/admin/PromotionalCampaignFormDialog';
import {
  usePromotionalCampaigns,
  useDeleteCampaign,
  useToggleCampaignActive,
} from '@/hooks/usePromotionalCampaigns';
import type { PromotionalCampaign } from '@/hooks/useActivePromotion';

function getCampaignStatus(campaign: PromotionalCampaign): 'active' | 'scheduled' | 'expired' | 'paused' {
  const now = new Date();
  const startsAt = new Date(campaign.starts_at);
  const endsAt = new Date(campaign.ends_at);

  if (!campaign.is_active) return 'paused';
  if (isPast(endsAt)) return 'expired';
  if (isFuture(startsAt)) return 'scheduled';
  if (isWithinInterval(now, { start: startsAt, end: endsAt })) return 'active';
  return 'expired';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
    case 'scheduled':
      return <Badge className="bg-secondary/10 text-secondary-foreground border-secondary/20">Scheduled</Badge>;
    case 'expired':
      return <Badge className="bg-muted text-muted-foreground">Expired</Badge>;
    case 'paused':
      return <Badge className="bg-accent/10 text-accent-foreground border-accent/20">Paused</Badge>;
    default:
      return null;
  }
}

function getTriggerIcon(triggerType: string) {
  switch (triggerType) {
    case 'entry':
      return <MousePointerClick className="h-4 w-4" />;
    case 'exit':
      return <span className="text-xs">↗</span>;
    case 'both':
      return <span className="text-xs">↔</span>;
    case 'timed':
      return <Clock className="h-4 w-4" />;
    default:
      return null;
  }
}

export default function AdminPromotionalCampaigns() {
  const { data: campaigns, isLoading } = usePromotionalCampaigns();
  const deleteCampaign = useDeleteCampaign();
  const toggleActive = useToggleCampaignActive();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<PromotionalCampaign | null>(null);

  const handleEdit = (campaign: PromotionalCampaign) => {
    setEditingCampaign(campaign);
    setFormOpen(true);
  };

  const handleDelete = (campaign: PromotionalCampaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (campaignToDelete) {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleToggleActive = async (campaign: PromotionalCampaign) => {
    await toggleActive.mutateAsync({ id: campaign.id, is_active: !campaign.is_active });
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold">Promotional Campaigns</h1>
              <p className="text-muted-foreground mt-1">
                Create and schedule pop-up offers for your website
              </p>
            </div>
            <Button onClick={() => { setEditingCampaign(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          {/* Stats */}
          {campaigns && campaigns.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {campaigns.filter(c => getCampaignStatus(c) === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Active Now</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {campaigns.filter(c => getCampaignStatus(c) === 'scheduled').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + (c.impressions_count || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Impressions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{campaigns.length}</div>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaigns List */}
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-20 w-32 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid gap-4">
              {campaigns.map((campaign) => {
                const status = getCampaignStatus(campaign);
                return (
                  <Card key={campaign.id} className={status === 'expired' ? 'opacity-60' : ''}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Image */}
                        {campaign.image_url ? (
                          <img
                            src={campaign.image_url}
                            alt={campaign.title}
                            className="h-24 w-40 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="h-24 w-40 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tag className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{campaign.title}</h3>
                                {getStatusBadge(status)}
                              </div>
                              {campaign.subtitle && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {campaign.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Switch
                                checked={campaign.is_active}
                                onCheckedChange={() => handleToggleActive(campaign)}
                                disabled={toggleActive.isPending}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(campaign)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {campaign.description}
                            </p>
                          )}

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            {/* Discount */}
                            <div className="flex items-center gap-1">
                              {campaign.discount_method === 'coupon' ? (
                                <>
                                  <Tag className="h-4 w-4" />
                                  <span>{campaign.coupon?.code || 'No coupon'}</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4" />
                                  <span>{campaign.auto_discount_percent}% auto</span>
                                </>
                              )}
                            </div>

                            {/* Schedule */}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(campaign.starts_at), 'MMM d')} –{' '}
                                {format(new Date(campaign.ends_at), 'MMM d, yyyy')}
                              </span>
                            </div>

                            {/* Trigger */}
                            <div className="flex items-center gap-1">
                              {getTriggerIcon(campaign.trigger_type)}
                              <span className="capitalize">{campaign.trigger_type}</span>
                              {campaign.trigger_delay_seconds > 0 && (
                                <span>({campaign.trigger_delay_seconds}s delay)</span>
                              )}
                            </div>

                            {/* Impressions */}
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>
                                {campaign.impressions_count.toLocaleString()}
                                {campaign.max_impressions && (
                                  <> / {campaign.max_impressions.toLocaleString()}</>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first promotional pop-up campaign
                </p>
                <Button onClick={() => { setEditingCampaign(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form Dialog */}
        <PromotionalCampaignFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          campaign={editingCampaign}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{campaignToDelete?.title}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
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
}
