import { useAuth } from '@/auth/AuthContext';
import { useRouter } from 'next/router';
import LyraChat from '@/components/LyraChat';
import { useEffect } from 'react';

export default function LyraPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading...</div>;
  }

  return <LyraChat user={user} />;
} 