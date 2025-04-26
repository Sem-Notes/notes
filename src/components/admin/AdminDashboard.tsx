
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Book, Users, Upload, Eye } from 'lucide-react';

const AdminDashboard = () => {
  // Get total statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStatistics'],
    queryFn: async () => {
      // Get total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;
      
      // Get total notes count
      const { count: notesCount, error: notesError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true });
      
      if (notesError) throw notesError;
      
      // Get total views count
      const { data: viewsData, error: viewsError } = await supabase
        .from('notes')
        .select('views');
      
      if (viewsError) throw viewsError;
      
      const totalViews = viewsData.reduce((sum, note) => sum + (note.views || 0), 0);
      
      // Get pending approvals count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);
      
      if (pendingError) throw pendingError;
      
      return {
        usersCount: usersCount || 0,
        notesCount: notesCount || 0,
        totalViews: totalViews || 0,
        pendingCount: pendingCount || 0
      };
    }
  });

  // Get notes by branches
  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['notesByBranch'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          subject:subjects(
            branch
          )
        `);
      
      if (error) throw error;
      
      const branches: Record<string, number> = {};
      
      data.forEach(note => {
        if (note.subject && note.subject.branch) {
          const branch = note.subject.branch;
          branches[branch] = (branches[branch] || 0) + 1;
        }
      });
      
      return Object.entries(branches).map(([name, value]) => ({ name, value }));
    }
  });

  // Get notes by year
  const { data: yearData, isLoading: yearLoading } = useQuery({
    queryKey: ['notesByYear'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          id,
          subject:subjects(
            academic_year
          )
        `);
      
      if (error) throw error;
      
      const years: Record<string, number> = {
        "Year 1": 0,
        "Year 2": 0,
        "Year 3": 0,
        "Year 4": 0
      };
      
      data.forEach(note => {
        if (note.subject && note.subject.academic_year) {
          const year = `Year ${note.subject.academic_year}`;
          years[year] = (years[year] || 0) + 1;
        }
      });
      
      return Object.entries(years).map(([name, value]) => ({ name, value }));
    }
  });

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : statistics?.usersCount}
                </h3>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <h3 className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : statistics?.notesCount}
                </h3>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Book className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <h3 className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : statistics?.totalViews}
                </h3>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <h3 className="text-3xl font-bold mt-1">
                  {statsLoading ? '...' : statistics?.pendingCount}
                </h3>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Notes by Branch</CardTitle>
            <CardDescription>Distribution of notes by department</CardDescription>
          </CardHeader>
          <CardContent>
            {branchLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={branchData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {branchData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Notes by Academic Year</CardTitle>
            <CardDescription>Distribution of notes by year</CardDescription>
          </CardHeader>
          <CardContent>
            {yearLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
