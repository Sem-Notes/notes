/**
 * Basic PDF.js worker shim
 * This allows the PDF viewer to work without external dependencies
 */

self.pdfjsWorker = {
  initialized: true
};

// Let the main thread know this worker is ready
self.postMessage({ type: 'ready' });

// Handle messages from the main thread
self.onmessage = function(event) {
  const data = event.data;
  
  // Simulate a successful response
  if (data && data.type) {
    self.postMessage({
      type: data.type + 'Response',
      success: true,
      messageId: data.messageId
    });
  }
}; 