import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Book } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { Helmet } from "react-helmet-async";

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all subjects
  const { data: allSubjects, isLoading: loadingAllSubjects } = useQuery({
    queryKey: ['allSubjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Filter subjects based on search term
  const filteredSubjects = allSubjects?.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `Year ${subject.academic_year}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `Semester ${subject.semester}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Explore Subjects | SemNotes</title>
        <meta name="description" content="Browse and discover all available subjects and notes on SemNotes." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gradient mb-2">Explore All Subjects</h1>
            <p className="text-muted-foreground">
              Browse through all available subjects across years and branches
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search subjects..."
                className="pl-10 pr-4 py-2 bg-secondary/20 border border-secondary/30 rounded-full w-full sm:w-auto min-w-[250px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loadingAllSubjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filteredSubjects && filteredSubjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <Card 
                  key={subject.id} 
                  className="border border-white/10 bg-gradient-to-br from-black/60 to-primary/10 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-hidden group"
                >
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
                    <Link to={`/subjects/${subject.id}`}>
                      <Button variant="outline" size="sm" className="group-hover:border-primary/50 group-hover:text-primary">
                        View Subject
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No subjects found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? `No subjects matching "${searchTerm}" found. Try a different search term.` 
                  : "It looks like we don't have any subjects in our database yet."}
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Explore;
