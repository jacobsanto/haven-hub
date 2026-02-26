import { useState } from 'react';
import { Instagram, Linkedin, Globe, Plus, Trash2, ToggleLeft, ToggleRight, Facebook, Twitter } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  useSocialAccounts,
  useCreateSocialAccount,
  useUpdateSocialAccount,
  useDeleteSocialAccount,
  getPlatformLabel,
  type SocialPlatform,
  type CreateSocialAccountInput,
} from '@/hooks/useSocialAccounts';

const platformIcons: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Globe,
  google_business: Globe,
  twitter: Twitter,
  reddit: Globe,
  pinterest: Globe,
  facebook: Facebook,
};

const platformColors: Record<SocialPlatform, string> = {
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  tiktok: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  google_business: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  twitter: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  reddit: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  pinterest: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  facebook: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export default function AdminSocialAccounts() {
  const { data: accounts, isLoading } = useSocialAccounts();
  const createMutation = useCreateSocialAccount();
  const updateMutation = useUpdateSocialAccount();
  const deleteMutation = useDeleteSocialAccount();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateSocialAccountInput>({
    platform: 'instagram',
    account_name: '',
    account_id: '',
    access_token: '',
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync(form);
    setDialogOpen(false);
    setForm({ platform: 'instagram', account_name: '', account_id: '', access_token: '' });
  };

  const toggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, is_active: !currentActive });
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Social Accounts
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Connect your social media accounts for content publishing.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Connect Account
            </Button>
          </div>

          {isLoading ? (
            <AdminLoadingSkeleton variant="cards" />
          ) : !accounts || accounts.length === 0 ? (
            <AdminEmptyState
              icon={Globe}
              title="No accounts connected"
              description="Connect your social media accounts to start scheduling posts."
              actionLabel="Connect Account"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const Icon = platformIcons[account.platform];
                return (
                  <Card key={account.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platformColors[account.platform]}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{account.account_name}</p>
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {getPlatformLabel(account.platform)}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={account.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1"
                          onClick={() => toggleActive(account.id, account.is_active)}
                        >
                          {account.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          {account.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive gap-1">
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Account</AlertDialogTitle>
                              <AlertDialogDescription>This will disconnect the account. Posts won't be deleted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(account.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Connect Account Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Social Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v as SocialPlatform })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="pinterest">Pinterest</SelectItem>
                    <SelectItem value="reddit">Reddit</SelectItem>
                    <SelectItem value="google_business">Google Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account Name</Label>
                <Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="e.g. @yourbrand" />
              </div>
              <div>
                <Label>Account / Page ID</Label>
                <Input value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} placeholder="Platform account ID" />
              </div>
              <div>
                <Label>Access Token (optional)</Label>
                <Input type="password" value={form.access_token || ''} onChange={(e) => setForm({ ...form, access_token: e.target.value })} placeholder="API access token" />
                <p className="text-xs text-muted-foreground mt-1">Stored securely. Required for auto-publishing.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.account_name || createMutation.isPending}>
                {createMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminGuard>
  );
}
