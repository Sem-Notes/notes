
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, UserX, UserCheck, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminUsersList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAdminStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_admin: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`User ${currentStatus ? 'removed from' : 'added to'} admin role`);
      refetch();
    } catch (error: any) {
      toast.error(`Error updating user: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Users</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 bg-secondary/20 border border-secondary/30 rounded-full w-full min-w-[250px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardTitle>
          <CardDescription>
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary/20">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Branch</th>
                    <th className="text-left px-4 py-3">Year & Semester</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="border-b border-secondary/10 hover:bg-secondary/5"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.branch || 'Not set'}</td>
                      <td className="px-4 py-3">
                        {user.academic_year ? `Year ${user.academic_year}` : 'Not set'}
                        {user.semester ? `, Sem ${user.semester}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_admin ? (
                          <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded text-xs flex items-center w-fit">
                            <Crown className="h-3 w-3 mr-1" /> Admin
                          </span>
                        ) : (
                          <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs flex items-center w-fit">
                            Student
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant={user.is_admin ? "destructive" : "outline"} 
                          size="sm"
                          onClick={() => toggleAdminStatus(user.id, user.is_admin || false)}
                        >
                          {user.is_admin ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" /> Remove Admin
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" /> Make Admin
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersList;
