import { supabase } from "@/lib/supabase-client";

/**
 * Force approve a note
 * @param noteId UUID of the note to approve
 * @returns Result of the operation
 */
export async function forceApproveNote(noteId: string) {
  try {
    const { data, error } = await supabase
      .rpc('force_approve_note', { note_id: noteId });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error force-approving note:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to force-approve note' 
    };
  }
}

/**
 * Force reject a note
 * @param noteId UUID of the note to reject
 * @param rejectionReason Optional reason for rejection
 * @returns Result of the operation
 */
export async function forceRejectNote(noteId: string, rejectionReason?: string) {
  try {
    const params: any = { note_id: noteId };
    if (rejectionReason) {
      params.rejection_reason = rejectionReason;
    }
    
    const { data, error } = await supabase
      .rpc('force_reject_note', params);
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error force-rejecting note:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to force-reject note'
    };
  }
} 