import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { AIRLINES } from '@ats/types';
import { Plus, MonitorCheck, CheckCircle2, XCircle } from 'lucide-react';

function useInstallations() {
  return useQuery({
    queryKey: ['installations'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('installations')
        .select('*, profiles(full_name, site)')
        .gte('created_at', today)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    refetchInterval: 20_000,
  });
}

const statusConfig = {
  validated: { color: 'green', label: 'Validée', dot: 'bg-emerald-400' },
  not_validated: { color: 'red', label: 'Non validée', dot: 'bg-red-400' },
  issue_detected: { color: 'yellow', label: 'Problème', dot: 'bg-amber-400' },
} as const;

export function InstallationsPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: installations, isLoading } = useInstallations();
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    airline: AIRLINES[0] as string,
    network_ok: false,
    machines_ok: false,
    software_ok: false,
    comment: '',
  });

  const status = form.network_ok && form.machines_ok && form.software_ok
    ? 'validated'
    : (form.network_ok || form.machines_ok || form.software_ok)
    ? 'issue_detected'
    : 'not_validated';

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('installations').insert({
        user_id: user!.id,
        site: profile!.site,
        airline: form.airline,
        network_ok: form.network_ok,
        machines_ok: form.machines_ok,
        software_ok: form.software_ok,
        status,
        comment: form.comment || null,
        validated_at: status === 'validated' ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setModalOpen(false);
      setForm({ airline: AIRLINES[0], network_ok: false, machines_ok: false, software_ok: false, comment: '' });
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-zinc-900 tracking-tight">Installations</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Validations pré-opératoires du jour</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5" />
          Nouvelle validation
        </Button>
      </div>

      {/* Table */}
      <div className="border border-[#E6E8F0] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid sm:grid-cols-[16px_1fr_80px_80px_80px_90px_72px] gap-4 px-4 py-2.5 border-b border-[#E6E8F0] bg-[#FAFBFE]">
          <span />
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Compagnie</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Réseau</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Machines</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Logiciels</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Statut</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Heure</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-[#EEF0F6]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EEF0F7] animate-pulse" />
                <div className="flex-1 h-4 bg-[#EEF0F7] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : installations?.length === 0 ? (
          <div className="py-16 text-center">
            <MonitorCheck className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Aucune installation enregistrée aujourd'hui</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0F6]">
            {installations?.map((inst) => {
              const cfg = statusConfig[inst.status as keyof typeof statusConfig] ?? statusConfig.not_validated;
              const time = new Date(inst.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={inst.id}
                  className="flex sm:grid sm:grid-cols-[16px_1fr_80px_80px_80px_90px_72px] items-center gap-4 px-4 py-3.5 hover:bg-[#FAFBFE] transition-colors"
                >
                  {/* Status dot */}
                  <div className="flex-shrink-0 flex items-center">
                    <div className={['w-2 h-2 rounded-full', cfg.dot].join(' ')} />
                  </div>

                  {/* Airline + site */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 truncate">{inst.airline}</p>
                    {inst.comment && (
                      <p className="text-[12px] text-zinc-400 truncate mt-0.5 hidden sm:block">{inst.comment}</p>
                    )}
                    <p className="text-[12px] text-zinc-400 sm:hidden">{inst.site}</p>
                  </div>

                  {/* Check indicators */}
                  <CheckIndicator ok={inst.network_ok} />
                  <CheckIndicator ok={inst.machines_ok} />
                  <CheckIndicator ok={inst.software_ok} />

                  {/* Status */}
                  <span>
                    <Badge color={cfg.color as 'green' | 'red' | 'yellow'}>{cfg.label}</Badge>
                  </span>

                  {/* Time */}
                  <span className="hidden sm:block text-[11px] text-zinc-400 font-mono tabular-nums">{time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Validation installation">
        <div className="space-y-5">
          <div>
            <label className="label-base">Compagnie aérienne</label>
            <select
              value={form.airline}
              onChange={(e) => setForm({ ...form, airline: e.target.value })}
              className="select-base"
            >
              {AIRLINES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="label-base">Checklist</label>
            <div className="space-y-2 mt-1">
              <ChecklistItem
                checked={form.network_ok}
                onChange={(v) => setForm({ ...form, network_ok: v })}
                label="Réseau"
                desc="Connectivité et accès réseau opérationnels"
              />
              <ChecklistItem
                checked={form.machines_ok}
                onChange={(v) => setForm({ ...form, machines_ok: v })}
                label="Machines"
                desc="Postes de travail et périphériques fonctionnels"
              />
              <ChecklistItem
                checked={form.software_ok}
                onChange={(v) => setForm({ ...form, software_ok: v })}
                label="Logiciels"
                desc="Applications métier accessibles et opérationnelles"
              />
            </div>
          </div>

          <div>
            <label className="label-base">Observations</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={2}
              className="input-base resize-none"
              placeholder="Notes éventuelles..."
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className={['w-1.5 h-1.5 rounded-full', statusConfig[status].dot].join(' ')} />
              <span className="text-[12px] text-zinc-500">{statusConfig[status].label}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>Enregistrer</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CheckIndicator({ ok }: { ok: boolean }) {
  return (
    <span className="hidden sm:flex items-center">
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        : <XCircle className="w-4 h-4 text-red-500/40" />}
    </span>
  );
}

function ChecklistItem({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <label className={[
      'flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all',
      checked
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-[#FAFBFE] border-[#E6E8F0] hover:border-[#E6E8F0]',
    ].join(' ')}>
      <div className={[
        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
        checked
          ? 'bg-emerald-600 border-emerald-600'
          : 'border-[#E6E8F0] bg-transparent',
      ].join(' ')}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-[13px] font-medium text-zinc-800">{label}</p>
        <p className="text-[12px] text-zinc-400 mt-0.5">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  );
}
