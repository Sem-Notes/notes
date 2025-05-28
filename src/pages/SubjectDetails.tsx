import React from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Eye, FileText, ArrowLeft } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { Helmet } from "react-helmet-async";

const SubjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    navigate(-1);
  };

  const { data: subject, isLoading: loadingSubject } = useQuery({
    queryKey: ['subject', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ['subjectNotes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          student:students(email, full_name, branch, academic_year, semester)
        `)
        .eq('subject_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (loadingSubject) {
    return (
      <>
        <Helmet>
          <title>Subject Details | SemNotes</title>
          <meta name="description" content="Explore detailed information and notes for this subject on SemNotes." />
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 pt-24 pb-16">
            <div className="animate-pulse h-8 w-48 bg-primary/20 rounded mb-4"></div>
            <div className="animate-pulse h-4 w-64 bg-primary/10 rounded mb-8"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!subject) {
    return (
      <>
        <Helmet>
          <title>Subject Details | SemNotes</title>
          <meta name="description" content="Explore detailed information and notes for this subject on SemNotes." />
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 pt-24 pb-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Subject Not Found</h2>
            <p className="text-muted-foreground mb-6">The subject you're looking for doesn't exist or has been removed.</p>
            <Link to="/explore">
              <Button>Browse All Subjects</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Subject Details | SemNotes</title>
        <meta name="description" content="Explore detailed information and notes for this subject on SemNotes." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-8">
            <button 
              onClick={goBack}
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gradient mb-1">{subject.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Year {subject.academic_year}, Semester {subject.semester}</span>
                  <span>•</span>
                  <span>{subject.branch}</span>
                  {subject.is_common && <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">Common</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" /> Available Notes
            </h2>
            
            {loadingNotes ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
              </div>
            ) : notes && notes.length > 0 ? (
              <div className="grid gap-4">
                {notes.map((note) => (
                  <Card key={note.id} className="border border-white/10 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-all">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg font-medium">{note.title}</CardTitle>
                      <div className="text-sm text-muted-foreground flex items-center justify-between mt-1">
                        <span>
                          By {note.student?.full_name || 'Unknown'} • 
                          {note.unit_number ? ` Unit ${note.unit_number}` : ''}
                        </span>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 text-blue-400 mr-1" />
                            <span>{note.views || 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {note.description && (
                      <CardContent className="px-4 py-0 text-sm text-muted-foreground">
                        {note.description}
                      </CardContent>
                    )}
                    <CardFooter className="p-4 flex justify-end">
                      <Link to={`/page-view/${note.id}?returnPath=${encodeURIComponent(location.pathname)}`}>
                        <Button size="sm">
                          View Notes
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-black/20 rounded-lg border border-white/5">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Notes Available</h3>
                <p className="text-muted-foreground mb-6">
                  There are no notes available for this subject yet.
                </p>
                <Link to="/upload">
                  <Button>
                    Upload Notes
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default SubjectDetails;
