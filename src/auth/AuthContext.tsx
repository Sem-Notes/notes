import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // console.log("[AUTH] Setting up auth context and session handling");
    
    // Flag to track if session restoration is in progress
    let isRestoringSession = false;
    let lastActiveTime = Date.now();
    let justBecameVisible = false;
    
    // Store current path for restoration after reload
    const currentPath = window.location.pathname + window.location.search;
    const isPDFViewPath = currentPath.startsWith('/page-view/');
    const isNotePath = currentPath.startsWith('/notes/');
    const isSubjectPath = currentPath.startsWith('/subjects/');
    const isAdminPath = currentPath.startsWith('/admin');
    const isHomePath = currentPath.startsWith('/home');
    const isProfilePath = currentPath.startsWith('/profile');
    const isProtectedPath = currentPath !== '/' && 
                           currentPath !== '/auth' && 
                           !currentPath.includes('/auth/callback');
    
    if (isProtectedPath) {
      sessionStorage.setItem('lastPath', currentPath);
      // console.log("[AUTH] Stored current path for possible restoration:", currentPath);
    }

    // Explicit flag to prevent reload when switching tabs
    window.sessionStorage.setItem('app_active', 'true');

    // Helper function to handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // console.log("[AUTH] Tab became visible again, checking session...");
        
        // Flag to prevent navigation on auth state refresh
        justBecameVisible = true;
        
        // Calculate time since last activity
        const timeInactive = Date.now() - lastActiveTime;
        // console.log("[AUTH] Time inactive:", timeInactive, "ms");
        
        // Update activity timestamp
        lastActiveTime = Date.now();
        
        // Prevent any default browser reload behavior
        window.sessionStorage.setItem('app_active', 'true');
        window.sessionStorage.setItem('skip_navigation', 'true');
        
        // Only verify session if we were inactive for a while but not too long
        if (timeInactive > 1000 && timeInactive < 30 * 60 * 1000) {
          // Just verify the session is still valid without triggering a full reload
          supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
              // console.log("[AUTH] Session still valid after tab switch");
              
              // Refresh user data to ensure everything is current
              if (data.session.user && !isRestoringSession) {
                setSession(data.session);
                setUser(data.session.user);
              }
            }
          });
        }
        
        // Clear this flag after 3 seconds
        setTimeout(() => {
          justBecameVisible = false;
          window.sessionStorage.removeItem('skip_navigation');
          // console.log("[AUTH] Navigation prevention cleared");
        }, 3000);
      } else {
        // Tab is hidden, update last active time
        lastActiveTime = Date.now();
        window.sessionStorage.setItem('last_active_time', lastActiveTime.toString());
        // console.log("[AUTH] Tab hidden, storing timestamp");
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // console.log("[AUTH] Auth state changed:", event, newSession?.user?.id);
        
        // Check if we should skip navigation after tab switch
        const skipNavigation = justBecameVisible || 
          window.sessionStorage.getItem('skip_navigation') === 'true';
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          // console.log("[AUTH] Session updated:", newSession.user?.id);
          
          // Use setTimeout to prevent auth deadlocks
          if (newSession.user && (event === 'SIGNED_IN') && !skipNavigation) {
            setTimeout(async () => {
              // Only proceed if we're not already restoring a session
              if (isRestoringSession) return;
              
              try {
                // Check if user has completed onboarding
                const { data: profile, error } = await supabase
                  .from('students')
                  .select('branch, academic_year, semester')
                  .eq('id', newSession.user.id)
                  .single();

                // console.log("[AUTH] User profile data:", profile, error);
                  
                // If profile doesn't exist or is missing required fields, redirect to onboarding
                if (!profile || !profile.branch || !profile.academic_year || !profile.semester) {
                  // console.log("[AUTH] User needs onboarding, redirecting...");
                  navigate('/onboarding');
                } else if (event === 'SIGNED_IN' && !skipNavigation) {
                  // console.log("[AUTH] User has completed onboarding, redirecting to home...");
                  navigate('/home');
                  toast.success('Successfully signed in!');
                } else {
                  // console.log("[AUTH] Skipping navigation after tab switch");
                }
              } catch (error) {
                // console.error("[AUTH] Error checking user profile:", error);
                // If there's an error or no profile found, direct to onboarding
                navigate('/onboarding');
              }
            }, 0);
          } else if (skipNavigation) {
            // console.log("[AUTH] Skipping navigation after tab focus change");
          }
        } else {
          setSession(null);
          setUser(null);
          // console.log("[AUTH] Session cleared");
          
          if (event === 'SIGNED_OUT') {
            navigate('/');
            toast.success('Successfully signed out!');
          }
        }
      }
    );

    // Then check for existing session
    const checkExistingSession = async () => {
      isRestoringSession = true;
      try {
        // console.log("[AUTH] Checking for existing session...");
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        // console.log("[AUTH] Existing session check result:", !!existingSession, existingSession?.user?.id);
        
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          // console.log("[AUTH] Existing session restored:", existingSession.user?.id);
          
          // Check if user has a profile
          const { data: profile, error } = await supabase
            .from('students')
            .select('branch, academic_year, semester, is_admin')
            .eq('id', existingSession.user.id)
            .single();
            
          // console.log("[AUTH] Existing user profile check:", profile);
          
          if (!profile || !profile.branch || !profile.academic_year || !profile.semester) {
            navigate('/onboarding');
          } else if (isPDFViewPath || isNotePath || isSubjectPath) {
            // Stay on the current page for specific content views
            // console.log("[AUTH] Staying on current content view page");
          } else {
            // Check for stored path after reload
            const lastPath = sessionStorage.getItem('lastPath');
            if (lastPath && lastPath !== '/') {
              // Only restore significant paths (admin, profile, etc.)
              const shouldRestore = 
                lastPath.startsWith('/admin') || 
                lastPath.startsWith('/profile') || 
                lastPath.startsWith('/subjects') ||
                lastPath.startsWith('/notes') ||
                lastPath.startsWith('/home');
                
              if (shouldRestore) {
                // console.log("[AUTH] Restoring previous path:", lastPath);
                navigate(lastPath);
              }
            }
          }
        }
      } catch (error) {
        // console.error("[AUTH] Error checking existing session:", error);
      } finally {
        setLoading(false);
        isRestoringSession = false;
      }
    };
    
    checkExistingSession();

    // Add a heartbeat to keep the session alive
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && user) {
        // Silently refresh the session to keep it alive
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            setSession(data.session);
          }
        });
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      // console.log("[AUTH] Cleaning up auth subscription");
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) toast.error(error.message);
    else toast.success('Check your email to confirm your account!');
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`
      }
    });
    if (error) console.error("[AUTH] Google sign in error:", error);
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      signInWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
