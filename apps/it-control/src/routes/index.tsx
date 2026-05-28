import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import { ITLandingPage } from '../pages/Landing';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: '/dashboard' });
  },
  component: ITLandingPage,
});
