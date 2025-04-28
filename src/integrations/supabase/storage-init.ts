import { supabase } from './client';

// This function checks if the notes bucket exists and safely uses it
export async function ensureNotesBucket() {
  try {
    // Try to use the bucket without creating it
    // If we get permission denied, the bucket might not exist or we might not have permissions
    const { data: files, error } = await supabase.storage
      .from('notes')
      .list('', { limit: 1 });
    
    if (!error) {
      // console.log("[STORAGE] Notes bucket is accessible");
      return true;
    }
    
    // If there's an error but it's not 404 (not found), we log it but continue
    if (error.message && !error.message.includes('not found')) {
      console.warn("[STORAGE] Access issue with notes bucket:", error.message);
    }
    
    return false;
  } catch (error) {
    console.error('[STORAGE] Error checking notes bucket:', error);
    return false;
  }
}

// Call this function to initialize the storage module
export async function initStorage() {
  const bucketAccessible = await ensureNotesBucket();
  
  if (!bucketAccessible) {
    // console.log("[STORAGE] Notes bucket may need to be created by an admin in the Supabase dashboard");
    // console.log("[STORAGE] Create a bucket named 'notes' with public access and 20MB file limit");
  }
} 