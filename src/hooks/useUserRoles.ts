import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  email?: string;
  full_name?: string;
}

export function useUserRoles() {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      // Fetch roles with profile info
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role');

      if (error) throw error;

      // Fetch profiles for all users with roles
      const userIds = rolesData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return rolesData.map(r => ({
        ...r,
        full_name: profileMap.get(r.user_id)?.full_name || null,
      })) as UserRole[];
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Role assigned successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message?.includes('duplicate') ? 'User already has this role' : `Failed to assign role: ${err.message}`);
    },
  });

  const removeRole = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Role removed successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to remove role: ${err.message}`);
    },
  });

  return { roles, isLoading, addRole, removeRole };
}
