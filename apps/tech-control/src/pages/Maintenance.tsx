import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import { AlertTriangle, Clock, CheckCircle2, Wrench, RefreshCw } from 'lucide-react';

type GseRow = {
  id: string; name: string; serie: string; marque: string; type: string;
  site: string; horametre_actuel: number; horametre_revision: number;
  intervalle: number; horametre_prochain: number; delta: number;
  statut: 'op' | 'inop'; obs: string; updated_at: string;
};

function useGse(site: string) {
  return useQuery({
    queryKey: ['gse-maintenance', site],
    queryFn: async () => {
      let q = supabase.from('gse_equipment').select('*').order('delta', { ascending: false });
      if (site !== 'all') q = q.eq('site', site);
      const { data } = await q;
      return (data ?? []) as GseRow[];
    },
    refetchInterval: 30_000,
  });
}

function deltaColor(delta: number) {
  if (delta > 0)   return 'text-red-500';
  if (delta > -50) return 'text-amber-500';
  return 'text-emerald-500';
}

function EqCard({ eq, isAdmin, onRevision }: {
  eq: GseRow; isAdmin: boolean; onRevision: (eq: GseRow) => void;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(
    ((eq.horametre_actuel - eq.horametre_revision) / eq.intervalle) * 100
  )));
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500';
  const lastRevDate = eq.updated_at
    ? new Date(eq.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 hover:bg-[#F4F5FA] transition-colors">
      {/* Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-semibold text-zinc-800">
            {eq.name} <span className="text-zinc-500 font-normal">{eq.serie}</span>
          </p>
          {eq.statut === 'inop' && (
            <span className="text-[10px] font-bold bg-red-50 text-red-600 ring-1 ring-red-500/20 px-1.5 py-0.5 rounded-full">INOP</span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">{[eq.marque, eq.site].filter(Boolean).join(' · ')}</p>
        {eq.obs && <p className="text-[11px] text-zinc-400 mt-0.5 italic truncate">{eq.obs}</p>}
        {/* Mini bar */}
        <div className="mt-2 hidden sm:block">
          <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5">
            <span>Progression révision</span><span>{pct}%</span>
          </div>
          <div className="h-1 w-36 bg-[#EEF0F7] rounded-full overflow-hidden">
            <div className={['h-full rounded-full', barColor].join(' ')} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="hidden sm:flex items-center gap-5 text-[12px]">
        <div className="text-right">
          <p className="text-zinc-400 text-[10px] uppercase tracking-[0.06em] mb-0.5">Horamètre</p>
          <p className="font-mono text-zinc-700 font-semibold">{eq.horametre_actuel.toLocaleString()}h</p>
        </div>
        <div className="text-right">
          <p className="text-zinc-400 text-[10px] uppercase tracking-[0.06em] mb-0.5">Intervalle</p>
          <p className="font-mono text-zinc-500">{eq.intervalle.toLocaleString()}h</p>
        </div>
        <div className="text-right">
          <p className="text-zinc-400 text-[10px] uppercase tracking-[0.06em] mb-0.5">Prochaine rév.</p>
          <p className="font-mono text-zinc-700">{eq.horametre_prochain.toLocaleString()}h</p>
        </div>
        <div className="text-right min-w-[56px]">
          <p className="text-zinc-400 text-[10px] uppercase tracking-[0.06em] mb-0.5">Delta</p>
          <p className={['font-mono font-bold', deltaColor(eq.delta)].join(' ')}>
            {eq.delta > 0 ? '+' : ''}{eq.delta}h
          </p>
        </div>
        <div className="text-right hidden lg:block">
          <p className="text-zinc-400 text-[10px] uppercase tracking-[0.06em] mb-0.5">Dernière maj.</p>
          <p className="text-zinc-500 text-[11px]">{lastRevDate}</p>
        </div>
      </div>

      {/* Action */}
      {isAdmin && (
        <Button size="sm" variant="secondary" onClick={() => onRevision(eq)} className="flex-shrink-0">
          <Wrench className="w-3 h-3" /> Révision faite
        </Button>
      )}
    </div>
  );
}

export function MaintenancePage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [site, setSite] = useState(profile?.site ?? 'all');
  const [revisionItem, setRevisionItem] = useState<GseRow | null>(null);
  const [newRevisionH, setNewRevisionH] = useState('');

  const { data: gse, isLoading, refetch, isFetching } = useGse(site);

  const critical = (gse ?? []).filter((g) => g.delta > 0 || g.statut === 'inop');
  const warning  = (gse ?? []).filter((g) => g.delta <= 0 && g.delta > -50 && g.statut === 'op');
  const ok       = (gse ?? []).filter((g) => g.delta <= -50 && g.statut === 'op');

  const markRevisionMutation = useMutation({
    mutationFn: async () => {
      if (!revisionItem) return;
      const h = parseInt(newRevisionH) || revisionItem.horametre_actuel;
      const { error } = await supabase.from('gse_equipment').update({
        horametre_revision: h,
        statut: 'op',
        updated_at: new Date().toISOString(),
      }).eq('id', revisionItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gse-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['gse'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
      setRevisionItem(null);
      setNewRevisionH('');
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">Suivi Maintenance</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            Alertes basées sur les horamètres · {critical.length} critique(s), {warning.length} à surveiller
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2 rounded-lg border border-[#E6E8F0] text-zinc-500 hover:text-zinc-700 hover:bg-white transition-colors disabled:opacity-40">
            <RefreshCw className={['w-3.5 h-3.5', isFetching ? 'animate-spin' : ''].join(' ')} />
          </button>
          {isAdmin && (
            <select value={site} onChange={(e) => setSite(e.target.value)} className="select-base py-1.5 w-auto text-[12px]">
              <option value="all">Tous les sites</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#E6E8F0] border-l-4 border-l-red-500 rounded-xl px-5 py-4 shadow-card">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Critique / INOP</p>
          <p className="text-[32px] font-bold text-red-500 tabular-nums mt-1">{critical.length}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Révision dépassée ou INOP</p>
        </div>
        <div className="bg-white border border-[#E6E8F0] border-l-4 border-l-amber-400 rounded-xl px-5 py-4 shadow-card">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">À surveiller</p>
          <p className="text-[32px] font-bold text-amber-500 tabular-nums mt-1">{warning.length}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Révision dans moins de 50h</p>
        </div>
        <div className="bg-white border border-[#E6E8F0] border-l-4 border-l-emerald-400 rounded-xl px-5 py-4 shadow-card">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">OP — OK</p>
          <p className="text-[32px] font-bold text-emerald-500 tabular-nums mt-1">{ok.length}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Aucune alerte maintenance</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white border border-[#E6E8F0] rounded-xl animate-pulse" />)}
        </div>
      )}

      {/* All clear state */}
      {!isLoading && critical.length === 0 && warning.length === 0 && (
        <div className="border border-[#E6E8F0] rounded-xl py-14 text-center bg-white shadow-card">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-zinc-700">Tous les équipements sont à jour</p>
          <p className="text-[13px] text-zinc-400 mt-1">Aucune alerte maintenance en cours</p>
        </div>
      )}

      {/* Critical */}
      {critical.length > 0 && (
        <div className="border border-[#E6E8F0] rounded-xl overflow-hidden shadow-card bg-white border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E6E8F0] bg-[#F4F5FA]">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-[13px] font-semibold text-zinc-800">
              Critiques — Révision dépassée / INOP
            </h3>
            <span className="ml-auto text-[12px] font-bold text-red-600">{critical.length}</span>
          </div>
          <div className="divide-y divide-[#EEF0F6]">
            {critical.map((eq) => (
              <EqCard key={eq.id} eq={eq} isAdmin={isAdmin} onRevision={(e) => {
                setRevisionItem(e);
                setNewRevisionH(e.horametre_actuel.toString());
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
      {warning.length > 0 && (
        <div className="border border-[#E6E8F0] rounded-xl overflow-hidden shadow-card bg-white border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E6E8F0] bg-[#F4F5FA]">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-[13px] font-semibold text-zinc-800">À surveiller — Révision proche</h3>
            <span className="ml-auto text-[12px] font-bold text-amber-600">{warning.length}</span>
          </div>
          <div className="divide-y divide-[#EEF0F6]">
            {warning.map((eq) => (
              <EqCard key={eq.id} eq={eq} isAdmin={isAdmin} onRevision={(e) => {
                setRevisionItem(e);
                setNewRevisionH(e.horametre_actuel.toString());
              }} />
            ))}
          </div>
        </div>
      )}

      {/* OK */}
      {ok.length > 0 && (
        <div className="border border-[#E6E8F0] rounded-xl overflow-hidden shadow-card bg-white">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E6E8F0] bg-[#F4F5FA]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-[13px] font-semibold text-zinc-800">OP — Aucune alerte</h3>
            <span className="ml-auto text-[12px] text-zinc-500">{ok.length}</span>
          </div>
          <div className="divide-y divide-[#EEF0F6]">
            {ok.map((eq) => (
              <EqCard key={eq.id} eq={eq} isAdmin={isAdmin} onRevision={(e) => {
                setRevisionItem(e);
                setNewRevisionH(e.horametre_actuel.toString());
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Revision modal */}
      <Modal open={!!revisionItem} onClose={() => setRevisionItem(null)} title="Enregistrer une révision" size="sm">
        {revisionItem && (
          <div className="space-y-4">
            <div className="bg-[#F4F5FA] border border-[#E6E8F0] rounded-xl px-4 py-3">
              <p className="text-[14px] font-bold text-zinc-900">{revisionItem.name} <span className="text-zinc-500">{revisionItem.serie}</span></p>
              <p className="text-[12px] text-zinc-500 mt-0.5">{[revisionItem.marque, revisionItem.site].filter(Boolean).join(' · ')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="bg-[#F4F5FA] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                <p className="text-zinc-400 text-[10px] uppercase tracking-[0.06em] mb-0.5">Horamètre actuel</p>
                <p className="font-mono font-bold text-zinc-800">{revisionItem.horametre_actuel.toLocaleString()}h</p>
              </div>
              <div className="bg-[#F4F5FA] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                <p className="text-zinc-400 text-[10px] uppercase tracking-[0.06em] mb-0.5">Intervalle</p>
                <p className="font-mono font-bold text-zinc-800">{revisionItem.intervalle.toLocaleString()}h</p>
              </div>
            </div>

            <div>
              <label className="label-base">Horamètre à la révision</label>
              <input type="number" value={newRevisionH}
                onChange={(e) => setNewRevisionH(e.target.value)}
                className="input-base"
                placeholder={revisionItem.horametre_actuel.toString()} />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Prochaine révision prévue à{' '}
                <span className="font-semibold text-emerald-600">
                  {((parseInt(newRevisionH) || revisionItem.horametre_actuel) + revisionItem.intervalle).toLocaleString()}h
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setRevisionItem(null)}>Annuler</Button>
              <Button onClick={() => markRevisionMutation.mutate()} loading={markRevisionMutation.isPending}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmer la révision
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
