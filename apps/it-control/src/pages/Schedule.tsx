import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import { Plus, Calendar, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';

function useSchedules(week: string) {
  return useQuery({
    queryKey: ['schedules', week],
    queryFn: async () => {
      const start = new Date(week);
      const end = new Date(week);
      end.setDate(end.getDate() + 7);
      const { data } = await supabase
        .from('schedules')
        .select('*, profiles(full_name, site, role)')
        .gte('start_time', start.toISOString())
        .lt('start_time', end.toISOString())
        .order('start_time');
      return data ?? [];
    },
  });
}

function useAllAgents() {
  return useQuery({
    queryKey: ['all-agents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, site')
        .eq('status', 'active');
      return data ?? [];
    },
  });
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function SchedulePage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [week, setWeek] = useState(() => getWeekStart(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const { data: schedules, isLoading } = useSchedules(week);
  const { data: agents } = useAllAgents();

  const [form, setForm] = useState({
    user_id: '',
    site: profile?.site ?? SITES[0],
    start_time: '',
    end_time: '',
    shift_type: 'day' as 'day' | 'night',
    notes: '',
  });

  const canCreate = profile?.role === 'admin' || profile?.role === 'supervisor';

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('schedules').insert({
        user_id: form.user_id || user!.id,
        site: form.site,
        start_time: form.start_time,
        end_time: form.end_time,
        shift_type: form.shift_type,
        notes: form.notes || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setModalOpen(false);
      setForm({ user_id: '', site: profile?.site ?? SITES[0], start_time: '', end_time: '', shift_type: 'day', notes: '' });
    },
  });

  const prevWeek = () => {
    const d = new Date(week);
    d.setDate(d.getDate() - 7);
    setWeek(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(week);
    d.setDate(d.getDate() + 7);
    setWeek(d.toISOString().split('T')[0]);
  };

  const weekLabel = new Date(week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">Planning</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Gestion des vacations</p>
        </div>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-2">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded-lg border border-[#E6E8F0] bg-white hover:bg-[#F4F5FA]
            text-zinc-500 hover:text-zinc-700 transition-colors shadow-card"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-4 py-1.5 text-[13px] font-semibold text-zinc-800 bg-white border border-[#E6E8F0] rounded-lg shadow-card">
          Semaine du {weekLabel}
        </span>
        <button
          onClick={nextWeek}
          className="p-1.5 rounded-lg border border-[#E6E8F0] bg-white hover:bg-[#F4F5FA]
            text-zinc-500 hover:text-zinc-700 transition-colors shadow-card"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white border border-[#E6E8F0] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : schedules?.length === 0 ? (
        <div className="border border-[#E6E8F0] rounded-xl py-16 text-center bg-white shadow-card">
          <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-500 font-medium">Aucune vacation cette semaine</p>
          <p className="text-[12px] text-zinc-400 mt-1">Utilisez le bouton Ajouter pour planifier une vacation</p>
        </div>
      ) : (
        <div className="border border-[#E6E8F0] rounded-xl overflow-hidden shadow-card">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[32px_1fr_120px_100px_100px_90px] gap-4 px-4 py-2.5
            border-b border-[#E6E8F0] bg-[#F4F5FA]">
            <span />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Agent</span>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Site</span>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Début</span>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Fin</span>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Type</span>
          </div>

          <div className="divide-y divide-[#EEF0F6]">
            {schedules?.map((s) => (
              <div
                key={s.id}
                className="flex sm:grid sm:grid-cols-[32px_1fr_120px_100px_100px_90px] items-center gap-4 px-4 py-3.5 hover:bg-[#F4F5FA] transition-colors bg-white"
              >
                {/* Icon */}
                <div className={[
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                  s.shift_type === 'day'
                    ? 'bg-amber-50 text-amber-500'
                    : 'bg-blue-50 text-blue-500',
                ].join(' ')}>
                  {s.shift_type === 'day'
                    ? <Sun className="w-3.5 h-3.5" />
                    : <Moon className="w-3.5 h-3.5" />}
                </div>

                {/* Agent */}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-800 truncate">
                    {(s.profiles as { full_name: string })?.full_name ?? '—'}
                  </p>
                  <p className="text-[11px] text-zinc-500 sm:hidden truncate">{s.site}</p>
                </div>

                {/* Site */}
                <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{s.site}</span>

                {/* Start */}
                <span className="hidden sm:block text-[12px] text-zinc-500 font-mono tabular-nums">
                  {new Date(s.start_time).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                  {' '}
                  {new Date(s.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* End */}
                <span className="hidden sm:block text-[12px] text-zinc-500 font-mono tabular-nums">
                  {new Date(s.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Type badge */}
                <Badge color={s.shift_type === 'day' ? 'yellow' : 'blue'}>
                  {s.shift_type === 'day' ? 'Jour' : 'Nuit'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle vacation"
        description="Planifier un horaire pour un agent"
        size="md"
      >
        <div className="space-y-4">
          {/* Agent */}
          {agents && (
            <div>
              <label className="label-base">Agent</label>
              <select
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="select-base"
              >
                <option value="">Moi-même</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Site */}
            <div>
              <label className="label-base">Site</label>
              <select
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="select-base"
              >
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="label-base">Type de vacation</label>
              <select
                value={form.shift_type}
                onChange={(e) => setForm({ ...form, shift_type: e.target.value as 'day' | 'night' })}
                className="select-base"
              >
                <option value="day">Jour</option>
                <option value="night">Nuit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start */}
            <div>
              <label className="label-base">Début</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="input-base"
              />
            </div>

            {/* End */}
            <div>
              <label className="label-base">Fin</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="input-base"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-base">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="input-base resize-none"
              placeholder="Informations complémentaires..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.start_time || !form.end_time}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
