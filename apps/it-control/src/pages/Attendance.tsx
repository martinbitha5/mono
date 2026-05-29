import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { UserCheck, Clock, MapPin, CheckCircle2 } from 'lucide-react';

function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance')
        .select('*, profiles(full_name, role, site, photo_url, service)')
        .gte('check_in_time', today)
        .order('check_in_time', { ascending: false });
      // Afficher uniquement les agents du service IT (service = 'it' ou 'both')
      return (data ?? []).filter((r) => {
        const p = r.profiles as { service?: string } | null;
        return p?.service !== 'tech';
      });
    },
    refetchInterval: 15_000,
  });
}

function useMyAttendanceToday(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-attendance-today', userId],
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

export function AttendancePage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: attendance, isLoading } = useTodayAttendance();
  const { data: myRecord } = useMyAttendanceToday(user?.id);
  const [notes, setNotes] = useState('');

  const checkInMutation = useMutation({
    mutationFn: async () => {
      // Auto-détection du retard : après 9h30
      const now = new Date();
      const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 30);
      const { error } = await supabase.from('attendance').insert({
        user_id: user!.id,
        site: profile!.site,
        status: late ? 'late' : 'present',
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setNotes('');
    },
  });

  const nowDate = new Date();
  const isLate = nowDate.getHours() > 9 || (nowDate.getHours() === 9 && nowDate.getMinutes() >= 30);
  const now = nowDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-zinc-50 tracking-tight">Présences</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Check-in widget */}
      <div className="border border-white/[0.06] rounded-xl bg-zinc-900">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-[13px] font-semibold text-zinc-200">Mon pointage</h2>
        </div>

        <div className="px-5 py-4">
          {myRecord ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-zinc-200">Présence enregistrée</p>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  {new Date(myRecord.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  <span className={myRecord.status === 'present' ? 'text-emerald-400' : myRecord.status === 'late' ? 'text-amber-400' : 'text-red-400'}>
                    {statusLabels[myRecord.status as keyof typeof statusLabels]}
                  </span>
                  {myRecord.notes && <> · {myRecord.notes}</>}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Location + time */}
              <div className="flex items-center gap-4 text-[12px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile?.site ?? '...'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {now}
                </span>
                {isLate && (
                  <span className="text-amber-500 font-medium">Après 09h00</span>
                )}
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optionnel)"
                rows={2}
                className="input-base resize-none text-[13px]"
              />

              {/* Actions */}
              <div className="space-y-2">
                {isLate && (
                  <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Après 09h30 — sera marqué <strong>En retard</strong> automatiquement
                  </p>
                )}
                <Button
                  onClick={() => checkInMutation.mutate()}
                  loading={checkInMutation.isPending}
                  className="w-full justify-center"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Je suis présent
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance table */}
      <div className="border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-white/[0.015]">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-zinc-200">
              Présences du jour
            </h2>
            {!!attendance?.length && (
              <span className="text-[11px] font-bold bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded-md">
                {attendance.length}
              </span>
            )}
          </div>
        </div>

        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-[32px_1fr_100px_90px_72px] gap-3 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01]">
          <span />
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Agent</span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Site</span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Statut</span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Heure</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-white/[0.04]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : attendance?.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-7 h-7 text-zinc-700 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500">Aucun pointage aujourd'hui</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {attendance?.map((record) => {
              const name = (record.profiles as { full_name: string } | null)?.full_name ?? '—';
              const initial = name.charAt(0).toUpperCase();
              const color = statusColors[record.status as keyof typeof statusColors] ?? 'gray';
              const label = statusLabels[record.status as keyof typeof statusLabels] ?? record.status;
              const time = new Date(record.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={record.id}
                  className="flex sm:grid sm:grid-cols-[32px_1fr_100px_90px_72px] items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300 flex-shrink-0">
                    {initial}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-200 truncate">{name}</p>
                    <p className="text-[12px] text-zinc-600 sm:hidden">
                      {record.site} · {time}
                    </p>
                  </div>

                  {/* Site */}
                  <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{record.site}</span>

                  {/* Status */}
                  <span>
                    <Badge color={color} dot>
                      {label}
                    </Badge>
                  </span>

                  {/* Time */}
                  <span className="hidden sm:block text-[11px] text-zinc-600 font-mono tabular-nums">{time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
