import { supabase } from '@/integrations/supabase/client';

// Hardcoded security settings
const PDF_STORAGE_BUCKET = 'notes';
const PDF_URL_EXPIRY = 300; // 5 minutes (in seconds)
const PDF_MOBILE_URL_EXPIRY = 3600; // 1 hour (in seconds)
const PDF_DIRECT_ACCESS = false; // Don't allow direct PDF URLs
const PDF_ALLOW_DOWNLOADS = false; // Don't allow PDF downloads

/**
 * Extracts the file path from a PDF URL
 */
export const extractPathFromUrl = (url: string): string | null => {
  try {
    // Try to extract the path after bucket name
    const patterns = [
      new RegExp(`/object/public/${PDF_STORAGE_BUCKET}/(.+)`, 'i'),
      new RegExp(`/${PDF_STORAGE_BUCKET}/(.+)`, 'i')
    ];

    for (const pattern of patterns) {
      const matches = url.match(pattern);
      if (matches && matches[1]) {
        return decodeURIComponent(matches[1]);
      }
    }
    
    console.error('Could not extract path from URL:', url);
    return null;
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
};

/**
 * Gets a secure signed URL for a PDF file
 */
export const getSecurePdfUrl = async (
  fileUrl: string, 
  isMobile: boolean = false
): Promise<{ url: string; success: boolean; error?: string }> => {
  try {
    // Extract path from URL
    const path = extractPathFromUrl(fileUrl);
    if (!path) {
      return { 
        url: '', 
        success: false, 
        error: 'Could not extract path from file URL' 
      };
    }

    // Create a signed URL with appropriate expiry time
    const expiry = isMobile ? PDF_MOBILE_URL_EXPIRY : PDF_URL_EXPIRY;
    const { data, error } = await supabase.storage
      .from(PDF_STORAGE_BUCKET)
      .createSignedUrl(path, expiry);

    if (error) {
      console.error('Error creating signed URL:', error);
      
      // Fall back to direct URL if allowed by config
      if (PDF_DIRECT_ACCESS) {
        return { url: fileUrl, success: true };
      }
      
      return { 
        url: '', 
        success: false, 
        error: error.message 
      };
    }

    if (!data?.signedUrl) {
      return { 
        url: '', 
        success: false, 
        error: 'No signed URL returned' 
      };
    }

    // Add PDF viewer parameters to disable download options
    const enhancedUrl = !PDF_ALLOW_DOWNLOADS
      ? `${data.signedUrl}#toolbar=0&navpanes=0&scrollbar=0&download=0`
      : data.signedUrl;

    return { url: enhancedUrl, success: true };
  } catch (error) {
    console.error('Error getting secure PDF URL:', error);
    return { 
      url: '', 
      success: false, 
      error: error.message || 'Unknown error getting PDF URL' 
    };
  }
};

/**
 * Opens a PDF in a new tab with security controls
 */
export const openPdfInNewTab = async (
  fileUrl: string,
  isMobile: boolean = false
): Promise<boolean> => {
  try {
    // Only proceed if downloads are allowed or it's a mobile device
    if (!PDF_ALLOW_DOWNLOADS && !isMobile) {
      console.warn('Direct PDF access is disabled');
      return false;
    }

    const { url, success, error } = await getSecurePdfUrl(fileUrl, isMobile);
    
    if (!success || !url) {
      console.error('Failed to get secure URL for new tab:', error);
      return false;
    }
    
    // Open the PDF in a new tab
    window.open(url, '_blank');
    return true;
  } catch (error) {
    console.error('Error opening PDF in new tab:', error);
    return false;
  }
}; 