export async function forceApproveNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.rpc('force_approve_note', { note_id: noteId });
    
    if (error) {
      console.error('Error force approving note:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Exception in force approving note:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
} 