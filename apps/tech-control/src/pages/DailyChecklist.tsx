import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, XCircle, ChevronRight, AlertCircle, Search } from 'lucide-react';

type GseRow = {
  id: string; name: string; serie: string; marque: string;
  type: string; horametre_actuel: number; site: string;
};

type CheckRow = {
  id: string; equipment_id: string; agent_id: string;
  final_status: 'op' | 'inop';
  horametre: number;
  created_at: string;
  equipment: { name: string; serie: string } | null;
  agent: { full_name: string } | null;
};

const CHECK_ITEMS = [
  { id: 'proprete',        label: 'Propreté'         },
  { id: 'carburant',       label: 'Carburant'        },
  { id: 'huile_moteur',    label: 'Huile moteur'     },
  { id: 'freins',          label: 'Freins'           },
  { id: 'pneus',           label: 'Pneus'            },
  { id: 'gyrophare',       label: 'Gyrophare'        },
  { id: 'cales',           label: 'Cales'            },
  { id: 'phare_clignotant',label: 'Phare / Clignotant'},
  { id: 'extincteur',      label: 'Extincteur'       },
  { id: 'hydraulique',     label: 'Hydraulique'      },
] as const;

type CheckId = typeof CHECK_ITEMS[number]['id'];

function useEquipment(site: string | undefined) {
  return useQuery({
    queryKey: ['gse-for-checklist', site],
    queryFn: async () => {
      const q = supabase.from('gse_equipment').select('id, name, serie, marque, type, horametre_actuel, site')
        .eq('statut', 'op').order('name');
      const { data } = site ? await q.eq('site', site) : await q;
      return (data ?? []) as GseRow[];
    },
  });
}

function useTodayChecklists(site: string | undefined) {
  return useQuery({
    queryKey: ['checklists-today', site],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const q = supabase.from('daily_checklists')
        .select('*, equipment:gse_equipment!equipment_id(name, serie), agent:profiles!agent_id(full_name)')
        .gte('created_at', today)
        .order('created_at', { ascending: false });
      const { data } = site ? await q.eq('site', site) : await q;
      return (data ?? []) as unknown as CheckRow[];
    },
    refetchInterval: 15_000,
  });
}

export function DailyChecklistPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEq, setSelectedEq] = useState<GseRow | null>(null);
  const [search, setSearch] = useState('');

  const { data: equipment, isLoading: eqLoading } = useEquipment(profile?.site);
  const { data: todayChecks } = useTodayChecklists(profile?.site);

  const defaultChecks: Record<CheckId, 'C' | 'NC'> = {
    proprete: 'C', carburant: 'C', huile_moteur: 'C', freins: 'C', pneus: 'C',
    gyrophare: 'C', cales: 'C', phare_clignotant: 'C', extincteur: 'C', hydraulique: 'C',
  };
  const [checks, setChecks] = useState<Record<CheckId, 'C' | 'NC'>>(defaultChecks);
  const [horametre, setHorametre] = useState('');
  const [observation, setObservation] = useState('');
  const [finalStatus, setFinalStatus] = useState<'op' | 'inop'>('op');

  const isChecked = (eqId: string) => todayChecks?.some((c) => c.equipment_id === eqId) ?? false;

  const filteredEq = (equipment ?? []).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.serie.toLowerCase().includes(q) || e.marque.toLowerCase().includes(q);
  });

  const pendingEq = filteredEq.filter((e) => !isChecked(e.id));
  const doneChecks = todayChecks ?? [];
  const ncCount = Object.values(checks).filter((v) => v === 'NC').length;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEq || !user) return;
      const { error } = await supabase.from('daily_checklists').insert({
        equipment_id: selectedEq.id,
        agent_id: user.id,
        site: profile?.site ?? '',
        ...checks,
        horametre: parseInt(horametre) || selectedEq.horametre_actuel,
        observation,
        final_status: finalStatus,
      });
      if (error) throw error;

      // Update horametre on equipment
      if (horametre && parseInt(horametre) !== selectedEq.horametre_actuel) {
        await supabase.from('gse_equipment')
          .update({ horametre_actuel: parseInt(horametre), updated_at: new Date().toISOString() })
          .eq('id', selectedEq.id);
      }
      if (finalStatus === 'inop') {
        await supabase.from('gse_equipment')
          .update({ statut: 'inop', updated_at: new Date().toISOString() })
          .eq('id', selectedEq.id);
      }
    },
    onSuccess: () => {
      // refetch immédiat (pas d'attente du staleTime) pour que la progression soit instantanée
      queryClient.refetchQueries({ queryKey: ['checklists-today'] });
      queryClient.refetchQueries({ queryKey: ['gse-for-checklist'] });
      // invalidation différée des autres pages liées
      queryClient.invalidateQueries({ queryKey: ['gse'] });
      queryClient.invalidateQueries({ queryKey: ['gse-for-fuel'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
      setSelectedEq(null);
      setChecks(defaultChecks);
      setHorametre('');
      setObservation('');
      setFinalStatus('op');
    },
  });

  const toggle = (id: CheckId) =>
    setChecks((prev) => ({ ...prev, [id]: prev[id] === 'C' ? 'NC' : 'C' }));

  // ── Form view ──────────────────────────────────────────────────────
  if (selectedEq) {
    return (
      <div className="space-y-5">
        <div>
          <button onClick={() => setSelectedEq(null)} className="text-[12px] text-orange-500 hover:text-orange-400 mb-3 flex items-center gap-1">
            ← Retour à la liste
          </button>
          <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">Check List</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {selectedEq.name} {selectedEq.serie} · {selectedEq.marque}
          </p>
        </div>

        <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Points de contrôle</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Cliquez pour basculer entre Conforme (C) et Non Conforme (NC)</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-zinc-800">
            {CHECK_ITEMS.map((item) => (
              <button key={item.id} type="button" onClick={() => toggle(item.id)}
                className={['flex items-center justify-between px-4 py-3 transition-colors',
                  checks[item.id] === 'NC'
                    ? 'bg-red-500/[0.08] hover:bg-red-500/[0.12]'
                    : 'bg-zinc-900 hover:bg-zinc-950'].join(' ')}>
                <span className={['text-[13px] font-medium', checks[item.id] === 'NC' ? 'text-red-400' : 'text-zinc-200'].join(' ')}>
                  {item.label}
                </span>
                {checks[item.id] === 'NC'
                  ? <XCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                  : <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-zinc-800 rounded-xl bg-zinc-900 px-5 py-4 space-y-4 shadow-card">
          <div>
            <label className="label-base">Horamètre actuel</label>
            <input type="number" value={horametre}
              onChange={(e) => setHorametre(e.target.value)}
              placeholder={selectedEq.horametre_actuel.toString()}
              className="input-base" />
            <p className="text-[11px] text-zinc-600 mt-1">Valeur précédente : {selectedEq.horametre_actuel.toLocaleString()}h</p>
          </div>
          <div>
            <label className="label-base">Observation</label>
            <textarea value={observation} onChange={(e) => setObservation(e.target.value)}
              rows={2} className="input-base resize-none" placeholder="Notes additionnelles..." />
          </div>
          <div>
            <label className="label-base">Statut final</label>
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => setFinalStatus('op')}
                className={['flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium text-[13px]',
                  finalStatus === 'op'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500'].join(' ')}>
                <CheckCircle2 className="w-4 h-4" /> OP
              </button>
              <button type="button" onClick={() => setFinalStatus('inop')}
                className={['flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium text-[13px]',
                  finalStatus === 'inop'
                    ? 'border-red-500 bg-red-500/10 text-red-500'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500'].join(' ')}>
                <XCircle className="w-4 h-4" /> INOP
              </button>
            </div>
          </div>
        </div>

        {ncCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl text-amber-500 text-[13px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{ncCount} point{ncCount > 1 ? 's' : ''} non conforme{ncCount > 1 ? 's' : ''}</span>
          </div>
        )}

        <Button onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}
          className="w-full py-3 text-[14px]">
          Enregistrer la check list
        </Button>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────
  const total = filteredEq.length;
  const done  = filteredEq.filter((e) => isChecked(e.id)).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">Check List Journalière</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">
          {done}/{total} inspections effectuées · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Progress */}
      <div className="border border-zinc-800 rounded-xl bg-zinc-900 px-5 py-4 shadow-card">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] font-medium text-zinc-400">Progression</span>
          <span className="text-[12px] font-bold text-zinc-200">{pct}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-zinc-600">{done} effectuées</span>
          <span className="text-[11px] text-zinc-600">{total - done} en attente</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un équipement..." className="input-base pl-9" />
      </div>

      {/* Pending */}
      {pendingEq.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-[0.08em] mb-2">À inspecter ({pendingEq.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingEq.map((eq) => (
              <button key={eq.id} onClick={() => {
                setSelectedEq(eq);
                setChecks(defaultChecks);
                setHorametre(eq.horametre_actuel.toString());
              }}
                className="group flex items-center justify-between px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-orange-500/50 hover:bg-zinc-950 transition-colors text-left shadow-card">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-200 group-hover:text-orange-500 transition-colors">
                    {eq.name} {eq.serie}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{eq.marque} · {eq.horametre_actuel.toLocaleString()}h</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {doneChecks.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-[0.08em] mb-2">Déjà inspectés</p>
          <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
            <div className="divide-y divide-zinc-800">
              {doneChecks.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-[13px] font-medium text-zinc-300">
                      {(c.equipment as { name: string; serie: string } | null)?.name}{' '}
                      {(c.equipment as { name: string; serie: string } | null)?.serie}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Par {(c.agent as { full_name: string } | null)?.full_name ?? '—'}
                      {' '}· {new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={['text-[11px] font-bold px-2.5 py-1 rounded-full',
                    c.final_status === 'op'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'].join(' ')}>
                    {c.final_status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {eqLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
