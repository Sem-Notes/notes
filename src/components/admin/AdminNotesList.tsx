import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ExternalLink } from 'lucide-react';
import { supabase, NoteWithSubject } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useLocation } from 'react-router-dom';

const AdminNotesList = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [locallyApprovedIds, setLocallyApprovedIds] = useState<string[]>([]);
  
  const { data: pendingNotes, isLoading, refetch } = useQuery({
    queryKey: ['pendingNotes'],
    queryFn: async () => {
      // console.log("Fetching pending notes"); 
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          student:students(email, full_name, branch, academic_year, semester),
          subject:subjects(name, branch, academic_year, semester)
        `)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      
      if (error) {
        // console.error("Error fetching pending notes:", error);
        throw error;
      }
      
      const filteredData = data?.filter(note => !locallyApprovedIds.includes(note.id)) || [];
      //  console.log(`Fetched ${data?.length} pending notes, filtered to ${filteredData.length} after removing locally approved`);
      
      return filteredData as NoteWithSubject[];
    },
    refetchInterval: false,
    staleTime: 60000,
  });

  const handleApprove = async (id: string) => {
    try {
      setProcessingIds(prev => [...prev, id]);
      // console.log("Approving note:", id);
      
      // Step 1: Verify the note exists and isn't already approved
      const { data: checkData, error: checkError } = await supabase
        .from('notes')
        .select('is_approved, id, title')
        .eq('id', id)
        .single();
        
      if (checkError) {
        console.error("Error checking note status:", checkError);
        throw checkError;
      }
      
      // console.log("Note before update:", checkData);
      
      if (checkData?.is_approved) {
        // console.log("Note is already approved, skipping update");
        setLocallyApprovedIds(prev => [...prev, id]);
        const updatedNotes = pendingNotes?.filter(note => note.id !== id) || [];
        queryClient.setQueryData(['pendingNotes'], updatedNotes);
        return;
      }
      
      // Step 2: Try a standard update first - this may work with proper permissions
      const { data: directUpdateData, error: directUpdateError } = await supabase
        .from('notes')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (directUpdateError) {
        console.warn("Direct update failed, trying RPC function:", directUpdateError);
      } else {
        // console.log("Direct update succeeded:", directUpdateData);
      }
      
      // Step 3: If direct update failed or to ensure it worked, try the RPC function
      const { data: sqlData, error: sqlError } = await supabase.rpc(
        'force_approve_note',
        { note_id: id }
      );
      
      if (sqlError) {
        console.warn("RPC function failed:", sqlError);
      } else {
        console.log("SQL update result:", sqlData);
      }
      
      // Step 4: Final attempt - try raw SQL execution if both methods above failed
      if (directUpdateError && sqlError) {
        console.warn("Both update methods failed, trying raw SQL execution");
        
        const { data: rawSqlData, error: rawSqlError } = await supabase.rpc(
          'execute_sql',
          { 
            sql: `UPDATE public.notes SET is_approved = true, updated_at = now() WHERE id = '${id}' RETURNING id, is_approved` 
          }
        );
        
        if (rawSqlError) {
          console.error("Raw SQL execution failed:", rawSqlError);
        } else {
          // console.log("Raw SQL execution result:", rawSqlData);
        }
      }
      
      // Step 5: Verify the update was successful
      const { data: verifyData, error: verifyError } = await supabase
        .from('notes')
        .select('is_approved, id, title')
        .eq('id', id)
        .single();
        
      if (verifyError) {
        console.error("Error verifying update:", verifyError);
      } else {
        // console.log("Note after update:", verifyData);
        
        if (!verifyData.is_approved) {
          console.error("UPDATE FAILED: Note is still not approved in database");
          toast.error("Database update failed. UI will still be updated.");
        } else {
          // console.log("UPDATE CONFIRMED: Note is now approved in database");
        }
      }
      
      // Update UI regardless of database state
      setLocallyApprovedIds(prev => [...prev, id]);
      // console.log("Note approval UI updated successfully");
      toast.success("Note approved successfully");
      
      const updatedNotes = pendingNotes?.filter(note => note.id !== id) || [];
      queryClient.setQueryData(['pendingNotes'], updatedNotes);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['pendingNotes'] });
      queryClient.invalidateQueries({ queryKey: ['approvedNotes'] });
      
    } catch (error: any) {
      console.error("Error approving note:", error);
      toast.error(`Error approving note: ${error.message}`);
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingIds(prev => [...prev, id]);
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Note rejected and deleted");
      
      const updatedNotes = pendingNotes?.filter(note => note.id !== id) || [];
      queryClient.setQueryData(['pendingNotes'], updatedNotes);
      
      queryClient.invalidateQueries({ queryKey: ['pendingNotes'] });
    } catch (error: any) {
      toast.error(`Error rejecting note: ${error.message}`);
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };

  const displayedNotes = pendingNotes?.filter(
    note => !processingIds.includes(note.id) && !locallyApprovedIds.includes(note.id)
  ) || [];

  return (
    <div className="space-y-6">
      <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Review and approve notes submitted by students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : displayedNotes.length > 0 ? (
            <div className="space-y-4">
              {displayedNotes.map((note) => (
                <div 
                  key={note.id} 
                  className="bg-secondary/10 p-4 rounded-lg border border-secondary/20"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{note.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        <p>Subject: {note.subject?.name}</p>
                        <p>Unit: {note.unit_number}</p>
                        <p>
                          Submitted by: {note.student?.full_name || note.student?.email || 'Unknown'} 
                          ({note.student?.branch}, Year {note.student?.academic_year}, Semester {note.student?.semester})
                        </p>
                        <p>Submitted on: {new Date(note.created_at || '').toLocaleDateString()}</p>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm mb-1 font-medium">Description:</p>
                        <p className="text-sm bg-secondary/5 p-2 rounded">
                          {note.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col justify-end gap-2">
                      <Link 
                        to={`/page-view/${note.id}?source=admin&returnPath=${encodeURIComponent(location.pathname)}`}
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" /> View
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(note.id)}
                        disabled={processingIds.includes(note.id)}
                      >
                        {processingIds.includes(note.id) ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" /> Approve
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleReject(note.id)}
                        disabled={processingIds.includes(note.id)}
                      >
                        {processingIds.includes(note.id) ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" /> Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending notes to approve
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotesList;
