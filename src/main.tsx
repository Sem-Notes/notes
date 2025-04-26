import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initStorage } from './integrations/supabase/storage-init'

// Initialize storage without blocking app rendering
initStorage().catch(err => {
  console.error("Storage initialization error:", err);
});

createRoot(document.getElementById("root")!).render(<App />);
