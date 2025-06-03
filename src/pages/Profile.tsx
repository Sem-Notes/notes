import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, NoteWithSubject } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';
import { Link } from 'react-router-dom';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { Edit, Upload, Clock, Medal, Settings, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Helmet } from "react-helmet-async";

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // console.log("[PROFILE] Profile page rendered, user:", user?.id);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      // console.log("[PROFILE] Fetching user profile for:", user?.id);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.error("[PROFILE] Error fetching profile:", error);
        throw error;
      }
      // console.log("[PROFILE] Profile data:", data);
      return data;
    },
    enabled: !!user,
    refetchOnMount: 'always',
    staleTime: 1000 // Very short stale time to ensure fresh data
  });

  useEffect(() => {
    // console.log("[PROFILE] Profile data from query:", profile);
  }, [profile]);

  // Fetch user's uploads
  const { data: uploads } = useQuery({
    queryKey: ['userUploads', user?.id],
    queryFn: async () => {
      // console.log("[PROFILE] Fetching user uploads for:", user?.id);
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          subject:subjects(name, branch, academic_year, semester)
        `)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as NoteWithSubject[];
    },
    enabled: !!user
  });

  // Fetch user's history
  const { data: history } = useQuery({
    queryKey: ['userHistory', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('history')
        .select(`
          *,
          note:notes(
            id, 
            title, 
            student_id,
            subject_id,
            subject:subjects(name, branch, academic_year, semester)
          )
        `)
        .eq('user_id', user?.id)
        .order('viewed_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const openEditDialog = () => {
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  // Calculate statistics
  const uploadsCount = uploads?.length || 0;
  const viewsCount = uploads?.reduce((sum, note) => sum + (note.views || 0), 0) || 0;
  const approvedCount = uploads?.filter(note => note.is_approved).length || 0;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : (user?.email ? user.email.substring(0, 2).toUpperCase() : 'UN');

  return (
    <>
      <Helmet>
        <title>Profile | SemNotes</title>
        <meta name="description" content="View and edit your profile details on SemNotes." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="md:w-1/3 space-y-6">
              {/* Profile Card */}
              <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
                {isLoading ? (
                  <CardSkeleton />
                ) : (
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl mb-4 overflow-hidden">
                          {user?.user_metadata?.avatar_url ? (
                            <img 
                              src={user.user_metadata.avatar_url} 
                              alt={profile?.full_name || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <button 
                          className="absolute bottom-4 right-0 bg-primary text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Change profile picture"
                          title="Change profile picture"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="group relative mb-1">
                        <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
                      </div>
                      
                      <p className="text-muted-foreground">
                        {profile?.branch || 'No Branch'} • Year {profile?.academic_year || '?'}
                      </p>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Settings className="h-4 w-4" /> Settings
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={openEditDialog}
                        >
                          <Edit className="h-4 w-4" /> Edit Profile
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center">
                        <div className="bg-black/30 p-3 rounded-md">
                          <div className="text-xl font-bold">{uploadsCount}</div>
                          <div className="text-xs text-muted-foreground">Uploads</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-md">
                          <div className="text-xl font-bold">{viewsCount}</div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-md">
                          <div className="text-xl font-bold">{approvedCount}</div>
                          <div className="text-xs text-muted-foreground">Approved</div>
                        </div>
                      </div>
                      
                      {profile?.is_admin && (
                        <div className="mt-6 w-full">
                          <Link to="/admin">
                            <Button variant="default" className="w-full">
                              <Medal className="h-4 w-4 mr-2" /> Admin Dashboard
                            </Button>
                          </Link>
                        </div>
                      )}
                      
                      <div className="mt-6 w-full">
                        <h3 className="text-sm font-medium mb-2 text-muted-foreground">ACHIEVEMENTS</h3>
                        <div className="flex flex-wrap gap-2">
                          {uploadsCount > 0 && (
                            <div className="bg-primary/20 p-2 rounded-md flex items-center">
                              <Medal className="h-4 w-4 mr-1 text-primary" />
                              <span className="text-xs">Contributor</span>
                            </div>
                          )}
                          {approvedCount > 2 && (
                            <div className="bg-primary/20 p-2 rounded-md flex items-center">
                              <Medal className="h-4 w-4 mr-1 text-primary" />
                              <span className="text-xs">Top Contributor</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
            
            <div className="md:w-2/3">
              <Tabs defaultValue="uploads">
                <TabsList className="w-full bg-secondary/10 border border-secondary/30">
                  <TabsTrigger value="uploads" className="flex-1 data-[state=active]:bg-primary/30">
                    <Upload className="h-4 w-4 mr-2" /> My Uploads
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-primary/30">
                    <Clock className="h-4 w-4 mr-2" /> History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="uploads" className="mt-6">
                  {uploads ? (
                    <div className="space-y-4">
                      {uploads.map((note) => (
                        <Card key={note.id} className="border border-white/10 bg-black/40">
                          <CardHeader className="p-4">
                            <CardTitle className="flex justify-between text-base font-medium">
                              <span>{note.title}</span>
                              <div className="flex items-center">
                                {note.is_approved ? (
                                  <span className="text-green-500 text-lg">✅</span>
                                ) : (
                                  <span className="text-red-500 text-lg">❌</span>
                                )}
                              </div>
                            </CardTitle>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <div>{note.subject?.name} • Year {note.subject?.academic_year}, Semester {note.subject?.semester}</div>
                              <div className="flex items-center gap-2">
                                {note.is_approved ? (
                                  <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs">Approved</span>
                                ) : (
                                  <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs">Pending</span>
                                )}
                                <span>Uploaded {new Date(note.created_at || '').toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't uploaded any notes yet.
                      <div className="mt-4">
                        <Link to="/upload">
                          <Button>
                            <Upload className="h-4 w-4 mr-2" /> Upload Notes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="history" className="mt-6">
                  {history && history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((item) => (
                        <Card key={item.id} className="border border-white/10 bg-black/40">
                          <CardHeader className="p-4">
                            <CardTitle className="flex justify-between text-base font-medium">
                              <span>{item.note?.title}</span>
                            </CardTitle>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <div>{item.note?.subject?.name} • Year {item.note?.subject?.academic_year}, Semester {item.note?.subject?.semester}</div>
                              <div>Viewed {new Date(item.viewed_at).toLocaleDateString()}</div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Your history will appear here when you view notes.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        {/* Edit Profile Dialog */}
        {profile && (
          <EditProfileDialog
            isOpen={isEditDialogOpen}
            onClose={closeEditDialog}
            initialData={{
              full_name: profile.full_name || '',
              academic_year: profile.academic_year || 1,
              semester: profile.semester || 1,
              branch: profile.branch || 'CSE'
            }}
          />
        )}
      </div>
    </>
  );
};

export default Profile;
