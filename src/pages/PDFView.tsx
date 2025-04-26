import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Maximize, Minimize, RotateCw, Book, User, Calendar, Info, RefreshCw, Smartphone, Tablets, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthContext';
// Import our PDF worker configuration
import { configurePdfJs } from '@/utils/pdfjs-worker';

// Setup PDF.js worker once at the module level
const pdfOptions = configurePdfJs();
console.log('PDF.js configured, version:', pdfjs.version);

// Add function to detect mobile devices
const isMobileDevice = () => {
  return (
    typeof window !== 'undefined' &&
    (window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ))
  );
};

const PDFView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get source type from URL query params
  const searchParams = new URLSearchParams(location.search);
  const source = searchParams.get('source') || 'normal';
  const returnPath = searchParams.get('returnPath') || '';

  // PDF viewing state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [useIframeViewer, setUseIframeViewer] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfFallbackMode, setPdfFallbackMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showDirectDownloadPrompt, setShowDirectDownloadPrompt] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  // Detect mobile on component mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    
    // Check on mount
    checkMobile();
    
    // Set up resize listener
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Function to create an object URL for direct rendering
  const createObjectUrlFromBlob = (blob) => {
    try {
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
      setUseIframeViewer(false);
      return objectUrl;
    } catch (error) {
      console.error("Error creating object URL:", error);
      return null;
    }
  };
  
  // Function to use file object URL instead of data URL
  const handleBlobSuccess = (blob) => {
    setPdfBlob(blob);
    
    // Try object URL first (more efficient)
    const objectUrl = createObjectUrlFromBlob(blob);
    if (!objectUrl) {
      // Fallback to data URL if object URL fails
      const reader = new FileReader();
      reader.onloadend = () => {
        // Use type assertion to fix type error
        const result = reader.result as string;
        setPdfUrl(result);
        setUseIframeViewer(false);
      };
      reader.onerror = () => {
        setPdfError("Failed to read PDF file");
        setUseIframeViewer(true);
      };
      reader.readAsDataURL(blob);
    }
    
    setIsDownloading(false);
  };

  // Function to fetch PDF as blob and create data URL
  const fetchPdfAsBlob = async (url: string) => {
    try {
      setIsDownloading(true);
      setPdfError(null);
      console.log('Attempting to fetch PDF from:', url);
      
      // On mobile devices, always default to iframe for better compatibility
      if (isMobile) {
        console.log('Mobile device detected, using iframe viewer');
        setPdfUrl(url);
        setUseIframeViewer(true);
        setIsDownloading(false);
        return true;
      }
      
      // Extract the path from the URL to use with Supabase API
      let path = '';
      try {
        const urlObj = new URL(url);
        console.log('URL pathname:', urlObj.pathname);
        
        // Try to extract the path after "notes/"
        const matches = urlObj.pathname.match(/\/object\/public\/notes\/(.+)/i) || 
                       urlObj.pathname.match(/\/notes\/(.+)/i);
        
        if (matches && matches[1]) {
          path = decodeURIComponent(matches[1]);
          console.log('Extracted path:', path);
        } else {
          throw new Error('Could not parse file path from URL');
        }
      } catch (pathError) {
        console.error('Error parsing URL:', pathError);
        // Continue anyway, we'll try direct fetch as fallback
      }
      
      // First attempt - Try using a signed URL (best for CORS)
      if (path) {
        try {
          console.log('Attempt 1: Creating a signed URL');
          
          const { data: signedURL, error: signError } = await supabase.storage
            .from('notes')
            .createSignedUrl(path, 300); // 5 minute expiry
            
          if (!signError && signedURL?.signedUrl) {
            console.log('Using signed URL:', signedURL.signedUrl);
            const signedResponse = await fetch(signedURL.signedUrl, {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              },
            });
            
            if (signedResponse.ok) {
              const signedBlob = await signedResponse.blob();
              handleBlobSuccess(signedBlob);
              setIsDownloading(false);
              return true;
            } else {
              console.error('Signed URL fetch failed:', signedResponse.status);
            }
          } else {
            console.error('Signed URL creation failed:', signError);
          }
        } catch (signedError) {
          console.error('Signed URL approach failed:', signedError);
          // Continue to next approach
        }
      }
      
      // Second attempt - Try direct fetch without credentials
      try {
        console.log('Attempt 2: Direct fetch without credentials');
        const response = await fetch(url, {
          method: 'GET',
          // No credentials: 'include' to avoid CORS issues
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        if (response.ok) {
          console.log('Direct fetch successful');
          const blob = await response.blob();
          handleBlobSuccess(blob);
          setIsDownloading(false);
          return true;
        } else {
          console.log('Direct fetch failed with status:', response.status);
        }
      } catch (directError) {
        console.log('Direct fetch error:', directError);
      }
      
      // Third attempt - Try Supabase download API if we have a path
      if (path) {
        try {
          console.log('Attempt 3: Using Supabase storage download API');
          
          const { data, error } = await supabase.storage
            .from('notes')
            .download(path);
            
          if (error) {
            console.error('Supabase download error:', error);
            throw error;
          }
          
          if (!data) {
            throw new Error('No data received from Supabase');
          }
          
          console.log('Supabase download successful!');
          handleBlobSuccess(data);
          setIsDownloading(false);
          return true;
        } catch (supabaseError) {
          console.error('Supabase download approach failed:', supabaseError);
        }
      }
      
      // If all attempts failed, show iframe as fallback
      console.log('All direct download attempts failed, falling back to iframe');
      setPdfUrl(url);
      setUseIframeViewer(true);
      setIsDownloading(false);
      return false;
      
    } catch (error) {
      console.error("Failed to fetch PDF after all attempts:", error);
      setPdfError(`Failed to fetch PDF: ${error.message}`);
      setPdfUrl(url); // Still set the URL for iframe fallback
      setUseIframeViewer(true);
      setIsDownloading(false);
      return false;
    }
  };

  // Fetch note details
  const { data: note, isLoading: isNoteLoading } = useQuery({
    queryKey: ['pdf-note', id, source],
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select(`
          *,
          subject:subjects(id, name, branch, academic_year, semester, is_common),
          student:students(id, email, full_name, branch, academic_year, semester)
        `)
        .eq('id', id);
      
      // Only filter for approved notes if not admin view
      if (source !== 'admin') {
        query = query.eq('is_approved', true);
      }
      
      const { data, error } = await query.single();

      if (error) throw error;
      
      // Fetch the PDF file as blob if URL exists
      if (data?.file_url) {
        try {
          // Try to bypass CORS by using direct iframe
          // We'll try to fetch it as a blob first
          await fetchPdfAsBlob(data.file_url);
        } catch (error) {
          console.error("Error fetching PDF blob:", error);
          // On failure, we'll set the URL directly for iframe
          setPdfUrl(data.file_url);
          setUseIframeViewer(true);
        }
      }
      
      return data;
    },
    enabled: !!id
  });

  // Simplified approach for PDF viewing
  useEffect(() => {
    if (pdfBlob) {
      try {
        // Create a URL from the blob for the iframe
        const objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
        setLoading(false);
        
        // Clean up the URL when component unmounts
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (error) {
        console.error("Error creating object URL:", error);
        setPdfError("Failed to create PDF viewer");
        setLoading(false);
      }
    }
  }, [pdfBlob]);

  // Track view
  useEffect(() => {
    const recordView = async () => {
      if (!id || !user?.id || source === 'admin') return;

      try {
        // Increment note views
        await supabase.rpc('increment_note_views', { note_id: id });

        // Check if history entry exists
        const { data: existingEntry } = await supabase
          .from('history')
          .select('id')
          .eq('user_id', user.id)
          .eq('note_id', id)
          .single();
          
        // Handle history update based on whether entry exists
        if (existingEntry) {
          // Update existing entry
          const { error: updateError } = await supabase
            .from('history')
            .update({ viewed_at: new Date().toISOString() })
            .eq('id', existingEntry.id);
            
          if (updateError) {
            console.error("Error updating history:", updateError);
          }
        } else {
          // Insert new entry
          const { error: insertError } = await supabase
            .from('history')
            .insert({
              user_id: user.id,
              note_id: id,
              viewed_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error("Error inserting history:", insertError);
          }
        }
      } catch (error) {
        console.error("Error recording view:", error);
      }
    };

    recordView();
  }, [id, user?.id, source]);

  // Store current page in session storage to preserve on reload
  useEffect(() => {
    if (id) {
      // Save current page to session storage
      sessionStorage.setItem(`pdf-page-${id}`, pageNumber.toString());
      // Save current scale to session storage
      sessionStorage.setItem(`pdf-scale-${id}`, scale.toString());
    }
  }, [pageNumber, scale, id]);

  // Restore page from session storage on component mount
  useEffect(() => {
    if (id) {
      const savedPage = sessionStorage.getItem(`pdf-page-${id}`);
      if (savedPage) {
        setPageNumber(parseInt(savedPage, 10));
      }
      
      const savedScale = sessionStorage.getItem(`pdf-scale-${id}`);
      if (savedScale) {
        setScale(parseFloat(savedScale));
      }
    }
  }, [id]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    };
  }, []);

  // Document load success handler
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setPdfError(null);
  };

  // Page navigation
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  
  // Handle input change for page number
  const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= (numPages || 1)) {
      setPageNumber(value);
    }
  };

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setScale(1.0);

  // Rotate document
  const rotateDocument = () => setRotation(prev => (prev + 90) % 360);

  // Modified to strongly discourage external viewing
  const openInAlternateViewer = async () => {
    if (!note?.file_url) {
      toast.error('File URL not available');
      return;
    }

    // Show a warning message
    toast.warning('Using the in-app viewer is recommended for the best experience and to protect our content.');
    
    // Ask for confirmation
    const confirmed = window.confirm(
      'For the best experience and to protect our content, we recommend viewing documents within the app. Are you sure you want to open in a new tab?'
    );
    
    if (!confirmed) {
      toast.info('Thank you for using our in-app viewer!');
      return;
    }
    
    // Track if we're attempting to handle the file
    let handled = false;
    
    try {
      // First check if the URL is valid by making a HEAD request
      const checkResponse = await fetch(note.file_url, {
        method: 'HEAD',
        cache: 'no-cache'
      }).catch(() => null); // Catch network errors
      
      if (checkResponse && checkResponse.ok) {
        // URL is valid, open it directly
        window.open(note.file_url, '_blank');
        toast.success('Opening PDF in a new tab');
        handled = true;
      } else {
        console.log('URL check failed, status:', checkResponse?.status);
        // Try to get a fresh signed URL
        await tryGetSignedUrl();
      }
    } catch (error) {
      console.error('Error checking URL:', error);
      await tryGetSignedUrl();
    }
    
    // Function to try getting a signed URL
    async function tryGetSignedUrl() {
      try {
        // Try to extract the path
        const urlParts = note.file_url.split('/notes/');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          console.log('Getting signed URL for path:', path);
          
          const { data: signedURL, error } = await supabase.storage
            .from('notes')
            .createSignedUrl(path, 300); // 5 minutes
          
          if (error) {
            console.error('Failed to create signed URL:', error);
            throw error;
          }
          
          if (signedURL && signedURL.signedUrl) {
            window.open(signedURL.signedUrl, '_blank');
            toast.success('Opening PDF with secure link');
            handled = true;
          }
        }
      } catch (signedError) {
        console.error('Failed to get signed URL:', signedError);
      }
    }
    
    // If we couldn't handle the file, show error
    if (!handled) {
      toast.error('Could not open PDF in browser. Please use our app viewer.');
      setShowDirectDownloadPrompt(true);
    }
  };
  
  // Show mobile options on first load for mobile devices
  useEffect(() => {
    if (isMobile && note?.file_url && !sessionStorage.getItem(`pdf-viewed-${id}`)) {
      setShowMobileOptions(true);
      // Mark this PDF as having shown options already
      sessionStorage.setItem(`pdf-viewed-${id}`, 'true');
    }
  }, [isMobile, note, id]);
  
  // Handle viewing in system viewer (for mobile)
  const viewInSystemViewer = async () => {
    if (!note?.file_url) {
      toast.error('File URL not available');
      return;
    }
    
    try {
      // Try to use a signed URL for better compatibility
      const urlParts = note.file_url.split('/notes/');
      if (urlParts.length > 1) {
        const path = urlParts[1];
        
        const { data: signedURL, error } = await supabase.storage
          .from('notes')
          .createSignedUrl(path, 3600); // 1 hour expiry for better viewing experience
        
        if (!error && signedURL?.signedUrl) {
          window.open(signedURL.signedUrl, '_blank');
          toast.success('Opening in your system viewer');
          return;
        }
      }
      
      // Fallback to direct URL
      window.open(note.file_url, '_blank');
      toast.success('Opening in your system viewer');
    } catch (error) {
      console.error('Error opening in system viewer:', error);
      toast.error('Could not open in system viewer');
    }
  };
  
  // Use in-app viewer (continue with iframe)
  const useInAppViewer = () => {
    setShowMobileOptions(false);
    toast.success('Using in-app viewer');
  };
  
  // Render mobile options dialog
  const renderMobileOptions = () => {
    if (!showMobileOptions) return null;
    
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg max-w-sm w-full p-6">
          <h3 className="text-xl font-semibold mb-2">Choose Viewing Option</h3>
          <p className="text-muted-foreground mb-6">
            Select how you'd like to view this document on your mobile device:
          </p>
          
          <div className="space-y-4">
            <Button
              className="w-full justify-start"
              onClick={useInAppViewer}
              variant="outline"
            >
              <Tablets className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div>In-App Viewer</div>
                <div className="text-xs text-muted-foreground">View within the app (recommended)</div>
              </div>
            </Button>
            
            <Button
              className="w-full justify-start"
              onClick={viewInSystemViewer}
            >
              <ExternalLink className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div>Open in System Viewer</div>
                <div className="text-xs text-muted-foreground">Use your device's built-in PDF viewer</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Function to render PDF using different methods
  const renderPDF = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }
    
    if (pdfError || showDirectDownloadPrompt) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-red-500/20 p-4 mb-4">
            <Info className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">
            {showDirectDownloadPrompt ? 'Viewing Issue' : 'Error Loading PDF'}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            We're having trouble displaying this document. You can try again or use your device's built-in viewer.
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            {isMobile && (
              <Button onClick={() => setShowMobileOptions(true)}>
                View Options
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    if (isMobile) {
      // For mobile, provide PDF directly in iframe with controls disabled
      if (note?.file_url) {
        // Create URL with disabled controls for iframe
        const enhancedUrl = note.file_url.includes('?') 
          ? `${note.file_url}#toolbar=0&navpanes=0&scrollbar=0` 
          : `${note.file_url}#toolbar=0&navpanes=0&scrollbar=0`;
          
        return (
          <div className="w-full h-full relative">
            <iframe 
              ref={iframeRef}
              src={enhancedUrl}
              className="w-full h-full border-0"
              title={note?.title || "PDF Document"}
              onLoad={() => {
                setLoading(false);
                console.log("Mobile iframe loaded successfully");
              }}
              onError={(e) => {
                console.error("Mobile iframe error:", e);
                setPdfError("Failed to load PDF in viewer");
              }}
            />
            
            {/* Floating button to show options again */}
            <Button 
              className="absolute bottom-4 right-4 shadow-lg"
              size="sm"
              onClick={() => setShowMobileOptions(true)}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              View Options
            </Button>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-blue-500/20 p-4 mb-4">
              <Info className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Document Unavailable</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              We couldn't find the document file. Please try again later or contact support.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        );
      }
    }
    
    if (pdfUrl) {
      // Regular iframe for desktop with PDF viewer controls disabled
      const enhancedUrl = pdfUrl.includes('?') 
        ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0` 
        : `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`;
        
      return (
        <iframe 
          ref={iframeRef}
          src={enhancedUrl}
          className="w-full h-full border-0"
          title={note?.title || "PDF Document"}
          onLoad={() => {
            setLoading(false);
            console.log("Iframe loaded successfully");
          }}
          onError={(e) => {
            console.error("Iframe error:", e);
            setPdfError("Failed to load PDF in viewer");
            setLoading(false);
          }}
        />
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No PDF document to display</p>
      </div>
    );
  };

  if (isNoteLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <Book className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
          <p className="text-muted-foreground mb-6">The document you're looking for doesn't exist or has been removed.</p>
          <Link to="/home">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {renderMobileOptions()}
      <main className={`container mx-auto px-4 ${isFullscreen ? 'pt-0' : 'pt-24'} pb-16`}>
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* New side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer - Takes up 2/3 of the space on large screens */}
          <div className="lg:col-span-2">
            <Card className={`border border-white/10 bg-black/40 backdrop-blur-sm ${isFullscreen ? 'h-screen' : ''}`}>
              <CardHeader className="p-4 border-b border-white/10 flex-row justify-between items-center">
                <CardTitle className="text-lg font-medium flex items-center">
                  {note?.title || 'Document Viewer'}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleFullscreen}
                    title="Toggle fullscreen"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className={`p-0 ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[70vh]'} overflow-auto flex items-center justify-center bg-black/30`}>
                {isDownloading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                      <p className="text-sm text-muted-foreground">Loading PDF...</p>
                    </div>
                  </div>
                )}
                
                {renderPDF()}
              </CardContent>
              
              <CardFooter className="p-4 border-t border-white/10 flex justify-between flex-wrap gap-4">
                <div className="w-full flex justify-center gap-4">
                  {isDownloading ? (
                    <Button variant="default" disabled>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Preparing PDF...
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => fetchPdfAsBlob(note?.file_url)}
                      disabled={!note?.file_url || isDownloading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Details Section - Takes up 1/3 of the space on large screens */}
          <div className="lg:col-span-1">
            {note && (
              <Card className="h-full border border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Note Details</CardTitle>
                  <CardDescription>Information about this document</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-2">
                      <Book className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Subject</h4>
                        <p className="text-sm text-muted-foreground">{note.subject?.name || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Added By</h4>
                        <p className="text-sm text-muted-foreground">{note.student?.full_name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">Date Added</h4>
                        <p className="text-sm text-muted-foreground">
                          {note.created_at 
                            ? new Date(note.created_at).toLocaleDateString() 
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>
                    {note.unit_number && (
                      <div className="flex items-start gap-2">
                        <Book className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">Unit</h4>
                          <p className="text-sm text-muted-foreground">Unit {note.unit_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {note.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{note.description}</p>
                    </div>
                  )}
                  
                  {/* Information about in-app viewing */}
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <h4 className="font-medium mb-3">Note</h4>
                    <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
                      <p className="text-sm text-muted-foreground">
                        This document is available for viewing exclusively within our app. We hope you enjoy the content and find it useful for your studies.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PDFView; 