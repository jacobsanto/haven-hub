import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, Trash2, Plus, Users, Check, X, Filter, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Visual-only role labels mapped from actual DB roles
const ROLE_DISPLAY: Record<string, { label: string; color: string; description: string }> = {
  admin: {
    label: 'Super Admin',
    color: 'default',
    description: 'Full access to all system features including user management, pricing, content, properties, and analytics.',
  },
  user: {
    label: 'Viewer',
    color: 'secondary',
    description: 'Read-only access to dashboards and analytics. Cannot modify any data.',
  },
};

// Visual-only permission matrix (does NOT alter actual RLS policies)
const PERMISSION_MATRIX: Record<string, Record<string, boolean>> = {
  admin: {
    'Manage pricing': true,
    'Manage content': true,
    'Manage properties': true,
    'View analytics': true,
    'Manage users': true,
    'Manage bookings': true,
  },
  user: {
    'Manage pricing': false,
    'Manage content': false,
    'Manage properties': false,
    'View analytics': true,
    'Manage users': false,
    'Manage bookings': false,
  },
};

export default function AdminUserRoles() {
  const { roles, isLoading, addRole, removeRole } = useUserRoles();
  const { user } = useAuth();
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('admin');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showDefinitions, setShowDefinitions] = useState(false);

  const handleAddRole = () => {
    const trimmedId = newUserId.trim();
    if (!trimmedId) return;
    addRole.mutate({ userId: trimmedId, role: newRole }, {
      onSuccess: () => setNewUserId(''),
    });
  };

  const filteredRoles = filterRole === 'all'
    ? roles
    : roles.filter(r => r.role === filterRole);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">User Roles</h1>
              <p className="text-muted-foreground mt-1">Manage staff access and permissions</p>
            </div>
          </div>

          {/* Role Definitions Panel */}
          <Collapsible open={showDefinitions} onOpenChange={setShowDefinitions}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Info className="h-4 w-4" />
                {showDefinitions ? 'Hide' : 'Show'} Role Definitions
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(ROLE_DISPLAY).map(([key, def]) => (
                  <Card key={key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {def.label}
                        <Badge variant={def.color as any} className="text-xs">{key}</Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">{def.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1.5">
                        {Object.entries(PERMISSION_MATRIX[key] || {}).map(([perm, allowed]) => (
                          <div key={perm} className="flex items-center gap-2 text-sm">
                            {allowed ? (
                              <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                            )}
                            <span className={allowed ? 'text-foreground' : 'text-muted-foreground'}>{perm}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Assign Role Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Assign Role
              </CardTitle>
              <CardDescription>
                Enter the user's auth ID to assign them a role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="User ID (UUID)"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="flex-1"
                />
                <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'user')}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Super Admin</SelectItem>
                    <SelectItem value="user">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddRole} disabled={!newUserId.trim() || addRole.isPending}>
                  <Plus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Roles Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Current Assignments
                  </CardTitle>
                  <CardDescription>
                    {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''} shown
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Super Admin</SelectItem>
                      <SelectItem value="user">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No roles assigned yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.map((r) => {
                        const isSelf = r.user_id === user?.id;
                        const display = ROLE_DISPLAY[r.role] || { label: r.role, color: 'outline' };
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="font-medium flex items-center gap-2">
                                  {r.full_name || <span className="text-muted-foreground italic">Unknown</span>}
                                  {isSelf && <Badge variant="outline" className="text-xs">You</Badge>}
                                </div>
                                <div className="font-mono text-xs text-muted-foreground truncate max-w-[240px]">
                                  {r.user_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={display.color as any}>
                                {display.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isSelf}
                                    title={isSelf ? "You can't remove your own role" : 'Remove role'}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will revoke the <strong>{display.label}</strong> role from this user. They will lose access immediately.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeRole.mutate(r.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
