import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { UserCheck, Clock, CheckCircle2 } from 'lucide-react';

function useTodayAttendance() {
  return useQuery({
    queryKey: ['tech-attendance-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance')
        .select('*, profiles(full_name, role, site, service)')
        .gte('check_in_time', today)
        .order('check_in_time', { ascending: false });

      // Filtrer uniquement les agents du service technique (service != 'it')
      return (data ?? []).filter((r) => {
        const p = r.profiles as { service?: string } | null;
        return p?.service !== 'it';
      });
    },
    refetchInterval: 15_000,
  });
}

function useMyAttendanceToday(userId: string | undefined) {
  return useQuery({
    queryKey: ['tech-my-attendance-today', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId!)
        .gte('check_in_time', today)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });
}

const statusColors = { present: 'green', late: 'yellow', absent: 'red' } as const;
const statusLabels = { present: 'Présent', late: 'En retard', absent: 'Absent' };
const roleLabels: Record<string, string> = {
  admin: 'Administrateur', supervisor: 'Superviseur', tech_agent: 'Agent Technique',
};

export function AttendancePage() {
  const { user, profile }   = useAuth();
  const queryClient         = useQueryClient();
  const { data: attendance, isLoading } = useTodayAttendance();
  const { data: myRecord }  = useMyAttendanceToday(user?.id);
  const [notes, setNotes]   = useState('');

  const checkInMutation = useMutation({
    mutationFn: async (status: 'present' | 'late') => {
      const { error } = await supabase.from('attendance').insert({
        user_id: user!.id,
        site: profile!.site,
        status,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['tech-my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
      setNotes('');
    },
  });

  const alreadyCheckedIn = !!myRecord;
  const presentCount = attendance?.filter((a) => a.status === 'present' || a.status === 'late').length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">Présences</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          Pointage du jour — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Check-in card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-card">
        {alreadyCheckedIn ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-200">Vous êtes pointé</p>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                <Badge color={statusColors[myRecord.status as keyof typeof statusColors] ?? 'gray'} dot>
                  {statusLabels[myRecord.status as keyof typeof statusLabels] ?? myRecord.status}
                </Badge>
                {' '}à {new Date(myRecord.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-zinc-200">Pointer votre présence</p>
                <p className="text-[12px] text-zinc-500">Site : {profile?.site}</p>
              </div>
            </div>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="Notes (optionnel)"
              className="input-base resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={() => checkInMutation.mutate('present')} loading={checkInMutation.isPending} className="flex-1">
                Présent
              </Button>
              <Button variant="secondary" onClick={() => checkInMutation.mutate('late')} loading={checkInMutation.isPending} className="flex-1">
                En retard
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[12px] text-zinc-500">
        <Clock className="w-3.5 h-3.5" />
        <span>{presentCount} agent(s) technique(s) présent(s) aujourd'hui</span>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
        <div className="hidden sm:grid sm:grid-cols-[1fr_120px_90px_100px] gap-4 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950">
          <span className="th">Agent</span>
          <span className="th">Site</span>
          <span className="th">Statut</span>
          <span className="th">Heure</span>
        </div>
        {isLoading ? (
          <div className="divide-y divide-zinc-800">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex gap-3">
                <div className="flex-1 h-4 bg-zinc-800 rounded animate-pulse" />
                <div className="w-20 h-4 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : attendance?.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Aucun pointage aujourd'hui</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {attendance?.map((r) => {
              const p   = r.profiles as { full_name: string; role: string; site: string } | null;
              const cfg = statusColors[r.status as keyof typeof statusColors] ?? 'gray';
              const time = new Date(r.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={r.id} className="flex sm:grid sm:grid-cols-[1fr_120px_90px_100px] items-center gap-4 px-4 py-3 hover:bg-zinc-950 transition-colors">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-200 truncate">{p?.full_name ?? '—'}</p>
                    <p className="text-[11px] text-zinc-500 hidden sm:block">{roleLabels[p?.role ?? ''] ?? p?.role}</p>
                  </div>
                  <span className="hidden sm:block text-[12px] text-zinc-500">{r.site}</span>
                  <Badge color={cfg} dot>{statusLabels[r.status as keyof typeof statusLabels] ?? r.status}</Badge>
                  <span className="text-[11px] text-zinc-600 font-mono tabular-nums">{time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
