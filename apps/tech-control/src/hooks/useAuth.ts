import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import type { Profile } from '@ats/types';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    staleTime: Infinity,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => fetchProfile(session!.user.id),
    enabled: !!session?.user.id,
    // Le profil ne change pas pendant la session → jamais re-fetché automatiquement
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    await navigate({ to: '/login' });
  };

  return {
    user: session?.user ?? null,
    profile: profile ?? null,
    loading: sessionLoading || profileLoading,
    signOut,
  };
}
