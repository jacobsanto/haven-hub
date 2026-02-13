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
import { Shield, Trash2, Plus, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUserRoles() {
  const { roles, isLoading, addRole, removeRole } = useUserRoles();
  const { user } = useAuth();
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('admin');

  const handleAddRole = () => {
    const trimmedId = newUserId.trim();
    if (!trimmedId) return;
    addRole.mutate({ userId: trimmedId, role: newRole }, {
      onSuccess: () => setNewUserId(''),
    });
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">User Roles</h1>
            <p className="text-muted-foreground mt-1">Manage staff access and permissions</p>
          </div>

          {/* Add Role Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Assign Role
              </CardTitle>
              <CardDescription>
                Enter the user's auth ID to assign them a role. Users can find their ID in their profile or you can look it up in the backend.
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
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Current Role Assignments
              </CardTitle>
              <CardDescription>
                {roles.length} role{roles.length !== 1 ? 's' : ''} assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No roles assigned yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((r) => {
                        const isSelf = r.user_id === user?.id;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.full_name || <span className="text-muted-foreground italic">Unknown</span>}
                              {isSelf && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                              {r.user_id}
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.role === 'admin' ? 'default' : 'secondary'}>
                                {r.role}
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
                                      This will revoke the <strong>{r.role}</strong> role from this user. They will lose access to the associated features immediately.
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
