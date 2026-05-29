import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import { AppShell } from '../components/AppShell';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: '/login' });

    // Vérifier l'accès au Service IT (une seule fois par session)
    const cacheKey = `itc_service_${session.user.id}`;
    if (!sessionStorage.getItem(cacheKey)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('service')
        .eq('id', session.user.id)
        .single();

      // Un agent Technique-only (service='tech') ne peut pas accéder à IT Control
      if (profile?.service === 'tech') {
        await supabase.auth.signOut();
        sessionStorage.removeItem(cacheKey);
        throw redirect({ to: '/login' });
      }
      sessionStorage.setItem(cacheKey, '1');
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
