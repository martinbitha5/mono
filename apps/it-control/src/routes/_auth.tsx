import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import { AppShell } from '../components/AppShell';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: '/login' });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
