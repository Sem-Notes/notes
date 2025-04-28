
import React, { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Auth = () => {
  const [loading, setLoading] = React.useState(false);
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    // console.log("[AUTH PAGE] Auth page loaded, checking user:", user?.id);
    if (user) {
      // console.log("[AUTH PAGE] User is logged in, redirecting to home");
      navigate('/home');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      // console.log("[AUTH PAGE] Attempting Google sign in");
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      console.error('[AUTH PAGE] Google auth error:', error);
      toast.error(error.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 neo-blur p-8 rounded-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gradient-primary mb-2">
            Welcome to SemNotes
          </h2>
          <p className="text-gray-400">
            Sign in to access your notes and resources
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 text-base"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z" fill="currentColor"></path>
                  </g>
                </svg>
                Continue with Google
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-gray-400">
            By continuing, you agree to SemNotes' Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
