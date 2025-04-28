import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Explore from "./pages/Explore";
import SubjectDetails from "./pages/SubjectDetails";
import NoteView from "./pages/NoteView";
import PDFView from "./pages/PDFView";
import OnboardingForm from "./components/OnboardingForm";
import { AuthProvider } from "./auth/AuthContext";
import React, { Suspense } from "react";

// Create a client with cache persistence configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

console.log("[APP] Initializing application with QueryClient");

// Lazy load heavy pages
const Admin = React.lazy(() => import("./pages/Admin"));
const Explore = React.lazy(() => import("./pages/Explore"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Upload = React.lazy(() => import("./pages/Upload"));
const PDFView = React.lazy(() => import("./pages/PDFView"));
const NoteView = React.lazy(() => import("./pages/NoteView"));
const SubjectDetails = React.lazy(() => import("./pages/SubjectDetails"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-lg">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<Auth />} />
              <Route path="/onboarding" element={<OnboardingForm />} />
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/subjects/:id" element={<SubjectDetails />} />
              <Route path="/notes/:id" element={<NoteView />} />
              <Route path="/page-view/:id" element={<PDFView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
