import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Clock, Upload, Search, BookOpen, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { Helmet } from "react-helmet-async";
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';

const Home = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch user's profile
  const { data: userProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('academic_year, semester, branch, full_name')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch subjects based on user's profile
  const { data: mySubjects, isLoading: loadingMySubjects } = useQuery({
    queryKey: ['mySubjects', userProfile],
    queryFn: async () => {
      if (!userProfile) return [];
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('academic_year', userProfile.academic_year)
        .eq('semester', userProfile.semester)
        .or(`branch.eq.${userProfile.branch},is_common.eq.true`);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile
  });

  // Fetch recent history
  const { data: recentHistory } = useQuery({
    queryKey: ['recentHistory', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('history')
        .select(`
          *,
          note:notes(
            id, 
            title, 
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

  // Filter subjects based on search term
  const filteredMySubjects = mySubjects?.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Home | SemNotes</title>
        <meta name="description" content="Your personalized dashboard for SemNotes." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gradient mb-2">Welcome, {userProfile?.full_name || 'Student'}</h1>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-balance"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              {userProfile ? `Viewing notes for Year ${userProfile.academic_year}, Semester ${userProfile.semester}` : 'Loading your profile...'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="pl-10 pr-4 py-2 bg-secondary/20 border border-secondary/30 rounded-full w-full sm:w-auto min-w-[250px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Link to="/upload">
              <Button className="bg-primary">
                <Upload className="mr-2 h-4 w-4" /> Upload Notes
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="my-subjects">
            <TabsList className="mb-6 bg-secondary/10 border border-secondary/30">
              <TabsTrigger value="my-subjects" className="data-[state=active]:bg-primary/30">
                <Book className="h-4 w-4 mr-2" /> My Subjects
              </TabsTrigger>
              {recentHistory && recentHistory.length > 0 && (
                <TabsTrigger value="recent" className="data-[state=active]:bg-primary/30">
                  <Clock className="h-4 w-4 mr-2" /> Recent
                </TabsTrigger>
              )}
              
            </TabsList>

            <TabsContent value="my-subjects">
              {loadingMySubjects ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredMySubjects && filteredMySubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMySubjects.map((subject) => (
                    <Link key={subject.id} to={`/subjects/${subject.id}`} className="group">
                      <Card className="border border-white/10 bg-gradient-to-br from-black/60 to-primary/10 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-hidden h-full">
                        <CardHeader className="pb-2 relative">
                          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-primary/10 opacity-50 blur-xl group-hover:bg-primary/20 transition-all"></div>
                          <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors">{subject.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 text-muted-foreground">
                            <Book className="h-4 w-4" />
                            {subject.branch} • Year {subject.academic_year} • Semester {subject.semester}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-300">
                            {subject.is_common ? 'Common subject for all branches' : `Specific to ${subject.branch} branch`}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between text-sm text-muted-foreground border-t border-white/5 pt-4">
                          <Button variant="outline" size="sm" className="group-hover:border-primary/50 group-hover:text-balance">
                            View Notes
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No subjects found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm 
                      ? `No subjects matching "${searchTerm}" found. Try a different search term.` 
                      : "It looks like we don't have any subjects for your current year and semester yet."}
                  </p>
                  <Link to="/explore">
                    <Button>Explore All Subjects</Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              <div className="text-center py-8">
                <Link to="/explore" className="inline-block">
                  <Button size="lg" className="px-8">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Browse All Subjects
                  </Button>
                </Link>
              </div>
            </TabsContent>

            {recentHistory && recentHistory.length > 0 && (
              <TabsContent value="recent">
                <div>
                  <h2 className="text-xl font-bold mb-4">Recently Viewed</h2>
                  <div className="space-y-4">
                    {recentHistory.map((item) => (
                      <Link key={item.id} to={`/notes/${item.note?.id}`}>
                        <Card className="border border-white/10 bg-black/40 hover:bg-black/50 transition-all">
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
                      </Link>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </main>

        {/* Edit Profile Dialog */}
        {userProfile && (
          <EditProfileDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            initialData={{
              full_name: userProfile.full_name || '',
              academic_year: userProfile.academic_year || 1,
              semester: userProfile.semester || 1,
              branch: userProfile.branch || 'CSE'
            }}
          />
        )}
      </div>
    </>
  );
};

export default Home;
