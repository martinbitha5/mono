import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { verifyOnSite, formatGeoNote, SITE_ZONES } from '../lib/geofence';
import { UserCheck, Clock, MapPin, CheckCircle2, CalendarOff, UserX } from 'lucide-react';

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

type AttStatus = 'present' | 'late' | 'absent' | 'off';

const statusColors: Record<AttStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  present: 'green', late: 'yellow', absent: 'red', off: 'gray',
};
const statusLabels: Record<AttStatus, string> = {
  present: 'Présent', late: 'En retard', absent: 'Absent', off: 'Off',
};

// ── Hook admin : tous les agents IT avec leur pointage du jour ──────────────
function useAllAgentsWithAttendance() {
  return useQuery({
    queryKey: ['all-it-agents-attendance'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [agentsRes, attRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, site, role, service')
          .in('service', ['it', 'both'])
          .eq('status', 'active')
          .order('full_name'),
        supabase
          .from('attendance')
          .select('*')
          .gte('check_in_time', today),
      ]);
      const agents = agentsRes.data ?? [];
      const attList = attRes.data ?? [];
      return agents.map((agent) => ({
        ...agent,
        record: attList.find((a) => a.user_id === agent.id) ?? null,
      }));
    },
    refetchInterval: 15_000,
  });
}

export function AttendancePage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isAdminOrSupervisor = profile?.role === 'admin' || profile?.role === 'supervisor';

  const { data: attendance, isLoading } = useTodayAttendance();
  const { data: myRecord } = useMyAttendanceToday(user?.id);
  const { data: allAgents, isLoading: isLoadingAll } = useAllAgentsWithAttendance();
  const [notes, setNotes] = useState('');

  const checkInMutation = useMutation({
    mutationFn: async () => {
      // ── Vérification GPS : l'agent doit être sur son site de travail ──
      const geo = await verifyOnSite(profile!.site);
      // Auto-détection du retard : après 9h30
      const now = new Date();
      const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 30);
      const { error } = await supabase.from('attendance').insert({
        user_id: user!.id,
        site: profile!.site,
        status: late ? 'late' : 'present',
        notes: [notes, formatGeoNote(geo)].filter(Boolean).join(' — ') || null,
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

  // Mutation admin : crée ou met à jour le pointage d'un agent
  const markAttendance = useMutation({
    mutationFn: async ({
      userId, site, status, existingId,
    }: { userId: string; site: string; status: AttStatus; existingId?: string }) => {
      if (existingId) {
        const { error } = await supabase
          .from('attendance')
          .update({ status } as any)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const now = new Date();
        const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 30);
        const finalStatus: AttStatus = status === 'present' ? (late ? 'late' : 'present') : status;
        const { error } = await supabase.from('attendance').insert({
          user_id: userId,
          site,
          status: finalStatus,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['attendance-today'] }),
        queryClient.refetchQueries({ queryKey: ['all-it-agents-attendance'] }),
        queryClient.refetchQueries({ queryKey: ['my-attendance-today'] }),
      ]);
    },
  });

  const nowDate = new Date();
  const isLate = nowDate.getHours() > 9 || (nowDate.getHours() === 9 && nowDate.getMinutes() >= 30);
  const now = nowDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-zinc-900 tracking-tight">Présences</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Check-in widget */}
      <div className="border border-[#E6E8F0] rounded-xl bg-white">
        <div className="px-5 py-4 border-b border-[#E6E8F0]">
          <h2 className="text-[13px] font-semibold text-zinc-800">Mon pointage</h2>
        </div>

        <div className="px-5 py-4">
          {myRecord ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-zinc-800">Présence enregistrée</p>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  {new Date(myRecord.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  <span className={myRecord.status === 'present' ? 'text-emerald-600' : myRecord.status === 'late' ? 'text-amber-600' : 'text-red-600'}>
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
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  Votre position GPS sera vérifiée — le pointage n'est possible que sur site
                  {SITE_ZONES[profile?.site ?? ''] && <> ({SITE_ZONES[profile!.site].label})</>}
                </p>
                <Button
                  onClick={() => checkInMutation.mutate()}
                  loading={checkInMutation.isPending}
                  className="w-full justify-center"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {checkInMutation.isPending ? 'Vérification de votre position…' : 'Je suis présent'}
                </Button>
                {checkInMutation.isError && (
                  <p className="text-[12px] text-red-600 font-medium flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {(checkInMutation.error as Error).message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance table ─────────────────────────────────────────────── */}
      <div className="border border-[#E6E8F0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E8F0] bg-[#FAFBFE]">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-zinc-800">Présences du jour</h2>
            {isAdminOrSupervisor
              ? !!allAgents?.length && (
                  <span className="text-[11px] font-bold bg-[#F4F5FA] text-zinc-500 px-1.5 py-0.5 rounded-md">
                    {allAgents.length}
                  </span>
                )
              : !!attendance?.length && (
                  <span className="text-[11px] font-bold bg-[#F4F5FA] text-zinc-500 px-1.5 py-0.5 rounded-md">
                    {attendance.length}
                  </span>
                )}
          </div>
        </div>

        {/* ── Admin / Supervisor : tous les agents ─────────────────────────── */}
        {isAdminOrSupervisor ? (
          <>
            {/* header */}
            <div className="hidden sm:grid sm:grid-cols-[32px_1fr_100px_100px_72px_80px] gap-3 px-4 py-2 border-b border-[#E6E8F0] bg-[#FAFBFE]">
              <span />
              {['Agent', 'Site', 'Statut', 'Heure', ''].map((h) => (
                <span key={h} className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">{h}</span>
              ))}
            </div>

            {isLoadingAll ? (
              <div className="divide-y divide-[#EEF0F6]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#EEF0F7] animate-pulse flex-shrink-0" />
                    <div className="flex-1 h-4 bg-[#EEF0F7] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#EEF0F6]">
                {allAgents?.map((agent) => {
                  const initial = agent.full_name.charAt(0).toUpperCase();
                  const rec = agent.record;
                  const color = rec ? (statusColors[rec.status as AttStatus] ?? 'gray') : 'gray';
                  const label = rec ? (statusLabels[rec.status as AttStatus] ?? rec.status) : '—';
                  const time = rec
                    ? new Date(rec.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  return (
                    <div
                      key={agent.id}
                      className="group flex sm:grid sm:grid-cols-[32px_1fr_100px_100px_72px_80px] items-center gap-3 px-4 py-3 hover:bg-[#FAFBFE] transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-[#EEF0F7] flex items-center justify-center text-[11px] font-bold text-zinc-700 flex-shrink-0">
                        {initial}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-800 truncate">{agent.full_name}</p>
                        <p className="text-[12px] text-zinc-400 sm:hidden">{agent.site} · {time}</p>
                      </div>

                      {/* Site */}
                      <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{agent.site}</span>

                      {/* Status badge */}
                      <span>
                        {rec ? (
                          <Badge color={color} dot>{label}</Badge>
                        ) : (
                          <span className="text-[12px] text-zinc-400">Non pointé</span>
                        )}
                      </span>

                      {/* Time */}
                      <span className="hidden sm:block text-[11px] text-zinc-400 font-mono tabular-nums">{time}</span>

                      {/* Action buttons */}
                      <span
                        className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Présent — hide if already present/late */}
                        {(!rec || (rec.status as AttStatus) === 'absent' || (rec.status as AttStatus) === 'off') && (
                          <button
                            onClick={() => markAttendance.mutate({ userId: agent.id, site: agent.site, status: 'present', existingId: rec?.id })}
                            className="p-1 rounded-md hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 transition-colors"
                            title="Marquer présent"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Absent — hide if already absent */}
                        {(!rec || (rec.status as AttStatus) !== 'absent') && (
                          <button
                            onClick={() => markAttendance.mutate({ userId: agent.id, site: agent.site, status: 'absent', existingId: rec?.id })}
                            className="p-1 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                            title="Marquer absent"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Off — hide if already off */}
                        {(!rec || (rec.status as AttStatus) !== 'off') && (
                          <button
                            onClick={() => markAttendance.mutate({ userId: agent.id, site: agent.site, status: 'off', existingId: rec?.id })}
                            className="p-1 rounded-md hover:bg-zinc-500/10 text-zinc-400 hover:text-zinc-700 transition-colors"
                            title="Marquer Off"
                          >
                            <CalendarOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ── Agent régulier : seulement ceux qui ont pointé ──────────────── */
          <>
            {/* header */}
            <div className="hidden sm:grid sm:grid-cols-[32px_1fr_100px_90px_72px] gap-3 px-4 py-2 border-b border-[#E6E8F0] bg-[#FAFBFE]">
              <span />
              {['Agent', 'Site', 'Statut', 'Heure'].map((h) => (
                <span key={h} className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">{h}</span>
              ))}
            </div>

            {isLoading ? (
              <div className="divide-y divide-[#EEF0F6]">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#EEF0F7] animate-pulse flex-shrink-0" />
                    <div className="flex-1 h-4 bg-[#EEF0F7] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : attendance?.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="w-7 h-7 text-zinc-300 mx-auto mb-3" />
                <p className="text-[13px] text-zinc-500">Aucun pointage aujourd'hui</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF0F6]">
                {attendance?.map((record) => {
                  const name = (record.profiles as { full_name: string } | null)?.full_name ?? '—';
                  const initial = name.charAt(0).toUpperCase();
                  const color = statusColors[record.status as AttStatus] ?? 'gray';
                  const label = statusLabels[record.status as AttStatus] ?? record.status;
                  const time = new Date(record.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={record.id}
                      className="flex sm:grid sm:grid-cols-[32px_1fr_100px_90px_72px] items-center gap-3 px-4 py-3 hover:bg-[#FAFBFE] transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#EEF0F7] flex items-center justify-center text-[11px] font-bold text-zinc-700 flex-shrink-0">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-800 truncate">{name}</p>
                        <p className="text-[12px] text-zinc-400 sm:hidden">{record.site} · {time}</p>
                      </div>
                      <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{record.site}</span>
                      <span><Badge color={color} dot>{label}</Badge></span>
                      <span className="hidden sm:block text-[11px] text-zinc-400 font-mono tabular-nums">{time}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
