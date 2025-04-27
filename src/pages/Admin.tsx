import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Check, X, UserCircle, Book, Clock, BarChart2, BookOpen, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNotesList from '@/components/admin/AdminNotesList';
import AdminUsersList from '@/components/admin/AdminUsersList';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminMultiUpload from '@/components/admin/AdminMultiUpload';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('is_admin')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data?.is_admin || false;
    },
  });

  // If not admin, redirect to home
  React.useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      navigate('/home');
    }
  }, [isAdmin, checkingAdmin, navigate]);

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, review notes, and view analytics</p>
        </div>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="w-full bg-secondary/10 border border-secondary/30 mb-8">
            <TabsTrigger value="dashboard" className="flex-1 data-[state=active]:bg-primary/30">
              <BarChart2 className="h-4 w-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-primary/30">
              <BookOpen className="h-4 w-4 mr-2" /> Notes Approval
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-primary/30">
              <UserCircle className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex-1 data-[state=active]:bg-primary/30">
              <Layers className="h-4 w-4 mr-2" /> Subjects
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          
          <TabsContent value="notes">
            <AdminNotesList />
          </TabsContent>
          
          <TabsContent value="users">
            <AdminUsersList />
          </TabsContent>
          
          <TabsContent value="subjects">
            <div className="grid grid-cols-1 gap-6">
              <AdminMultiUpload />
              
              <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Manage Subjects</span>
                    <Button size="sm">
                      <Book className="h-4 w-4 mr-2" /> Add Subject
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Add, edit, or remove subjects from the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-8 text-muted-foreground">
                    Subject management functionality coming soon
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
