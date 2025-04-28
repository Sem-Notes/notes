import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const UserAvatar: React.FC = () => {
  const { user } = useAuth();
  
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    retry: 2,
    refetchOnMount: true
  });
  
  useEffect(() => {
    // Force a refresh on component mount
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);
  
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <Avatar className="h-8 w-8 border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-all">
      <AvatarImage
        src={user?.user_metadata?.avatar_url}
        alt={profile?.full_name || user?.email || 'User avatar'}
      />
      <AvatarFallback className="bg-primary/10 text-primary">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
