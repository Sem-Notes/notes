// Import pdfjs
import { pdfjs } from 'react-pdf';

// Configure PDF.js options
export const configurePdfJs = () => {
  console.log("PDF.js version:", pdfjs.version);
  
  // Use a local worker file to avoid CORS issues
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.js';
  
  // Return simplified options for PDF rendering
  return {
    // Disable features that might require external resources
    disableStream: true,
    disableAutoFetch: true
  };
}; 