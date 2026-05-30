import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import {
  Droplets, Plus, TrendingDown, AlertTriangle, Fuel,
  CalendarDays, PackagePlus, X, History, Edit2, Trash2,
} from 'lucide-react';

type FuelType   = 'gasoil' | 'essence' | 'huile';
type ApproPeriod = 'today' | 'week' | 'month' | 'all';

type FuelLog = {
  id: string; equipment_id: string; fuel_type: FuelType;
  quantity: number; horametre_at_fill: number; site: string;
  agent_id: string | null; notes: string; created_at: string;
  equipment: { name: string; serie: string } | null;
  agent:     { full_name: string }           | null;
};

type FuelApproLog = {
  id: string; site: string; fuel_type: FuelType;
  quantity: number; notes: string; agent_id: string | null;
  created_at: string;
  agent: { full_name: string } | null;
};

type FuelStock = {
  id: string; site: string; fuel_type: FuelType;
  quantity: number; threshold: number; updated_at: string;
};

const FUEL_CFG: Record<FuelType, { label: string; color: string; dot: string; bg: string; border: string }> = {
  gasoil:  { label: 'Gasoil',  color: 'text-amber-500',   dot: 'bg-amber-400',   bg: 'bg-amber-500/[0.08]',   border: 'border-amber-500/20'  },
  essence: { label: 'Essence', color: 'text-blue-400',    dot: 'bg-blue-400',    bg: 'bg-blue-500/[0.08]',    border: 'border-blue-500/20'   },
  huile:   { label: 'Huile',   color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/20'},
};

const PERIOD_LABELS: Record<ApproPeriod, string> = {
  today: "Aujourd'hui",
  week:  'Cette semaine',
  month: 'Ce mois',
  all:   'Tout',
};

/* ── Helpers ── */
function stockForType(stock: FuelStock[], type: FuelType) {
  return stock.filter((s) => s.fuel_type === type).reduce((sum, s) => sum + Number(s.quantity), 0);
}
function thresholdForType(stock: FuelStock[], type: FuelType) {
  const rows = stock.filter((s) => s.fuel_type === type);
  return rows.length > 0 ? Number(rows[0].threshold) : 200;
}
function weekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/* ── Hooks ── */
function useFuelLogs(site: string) {
  return useQuery({
    queryKey: ['fuel-logs', site],
    queryFn: async () => {
      let q = supabase
        .from('fuel_logs')
        .select('*, equipment:gse_equipment!equipment_id(name, serie), agent:profiles!agent_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (site !== 'all') q = q.eq('site', site);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as FuelLog[];
    },
    refetchInterval: 15_000,
  });
}

function useFuelApproLogs(site: string) {
  return useQuery({
    queryKey: ['fuel-appro-logs', site],
    queryFn: async () => {
      let q = supabase
        .from('fuel_appro_logs')
        .select('*, agent:profiles!agent_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (site !== 'all') q = q.eq('site', site);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as FuelApproLog[];
    },
    refetchInterval: 20_000,
  });
}

function useFuelStock(site: string) {
  return useQuery({
    queryKey: ['fuel-stock', site],
    queryFn: async () => {
      let q = supabase.from('fuel_stock').select('*').order('fuel_type');
      if (site !== 'all') q = q.eq('site', site);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FuelStock[];
    },
    refetchInterval: 20_000,
  });
}

function useGseEquipment(site: string) {
  return useQuery({
    queryKey: ['gse-for-fuel', site],
    queryFn: async () => {
      let q = supabase.from('gse_equipment')
        .select('id, name, serie, horametre_actuel, site')
        .eq('statut', 'op')
        .order('name');
      if (site !== 'all') q = q.eq('site', site);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; serie: string; horametre_actuel: number; site: string }[];
    },
  });
}

/* ── Sub-components ── */
function StatCard({ label, value, unit, sub, icon: Icon, accent }: {
  label: string; value: string | number; unit?: string; sub?: string;
  icon: typeof Droplets; accent?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">{label}</p>
        <Icon className={['w-4 h-4', accent ?? 'text-zinc-600'].join(' ')} />
      </div>
      <p className="text-[26px] font-bold text-zinc-50 leading-none tabular-nums">
        {value}<span className="text-[14px] font-normal text-zinc-500 ml-1">{unit}</span>
      </p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1.5">{sub}</p>}
    </div>
  );
}

function StockCard({ type, stock }: { type: FuelType; stock: FuelStock[] }) {
  const qty       = stockForType(stock, type);
  const threshold = thresholdForType(stock, type);
  const cfg       = FUEL_CFG[type];
  const isAlert   = qty <= threshold;
  const isWarning = !isAlert && qty <= threshold * 1.5;
  const maxRef    = Math.max(threshold * 4, qty, 1);
  const pct       = Math.min(100, Math.round((qty / maxRef) * 100));

  return (
    <div className={[
      'bg-zinc-900 border rounded-xl px-5 py-4 shadow-card',
      isAlert   ? 'border-zinc-800 border-l-4 border-l-red-500'
      : isWarning ? 'border-zinc-800 border-l-4 border-l-amber-400'
      : 'border-zinc-800',
    ].join(' ')}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={['w-2 h-2 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
          <p className="text-[12px] font-semibold text-zinc-300">{cfg.label}</p>
        </div>
        {isAlert   && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
      </div>
      <p className={[
        'text-[26px] font-bold leading-none tabular-nums',
        isAlert ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-50',
      ].join(' ')}>
        {qty.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
        <span className="text-[13px] font-normal text-zinc-500 ml-1">L</span>
      </p>
      <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={['h-full rounded-full transition-all',
            isAlert ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-600 mt-1.5">
        Seuil alerte : {threshold.toLocaleString('fr-FR')} L
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export function CarburantPage() {
  const { user, profile } = useAuth();
  const queryClient       = useQueryClient();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [site,           setSite          ] = useState(profile?.site ?? 'all');
  const [logModal,       setLogModal      ] = useState(false);
  const [stockModal,     setStockModal    ] = useState(false);
  const [errorMsg,       setErrorMsg      ] = useState<string | null>(null);
  const [approPeriod,    setApproPeriod   ] = useState<ApproPeriod>('month');
  const [editApproModal,   setEditApproModal  ] = useState(false);
  const [editApproLog,     setEditApproLog    ] = useState<FuelApproLog | null>(null);
  const [editApproForm,    setEditApproForm   ] = useState({ quantity: '', notes: '' });
  const [confirmDeleteId,  setConfirmDeleteId ] = useState<string | null>(null);

  const openEditAppro = (log: FuelApproLog) => {
    setEditApproLog(log);
    setEditApproForm({ quantity: String(log.quantity), notes: log.notes || '' });
    setEditApproModal(true);
    setErrorMsg(null);
  };

  const { data: logs,       isLoading } = useFuelLogs(site);
  const { data: approLogs              } = useFuelApproLogs(site);
  const { data: stock                  } = useFuelStock(site);
  const { data: equipment              } = useGseEquipment(site);

  const defaultLog   = { equipment_id: '', fuel_type: 'gasoil' as FuelType, quantity: '', horametre_at_fill: '', notes: '' };
  const defaultStock = { fuel_type: 'gasoil' as FuelType, quantity: '', notes: '' };
  const [logForm,   setLogForm  ] = useState(defaultLog);
  const [stockForm, setStockForm] = useState(defaultStock);

  /* ── Date boundaries ── */
  const today      = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';

  /* ── Consumption stats ── */
  const todayLogs  = (logs ?? []).filter((l) => l.created_at.startsWith(today));
  const monthLogs  = (logs ?? []).filter((l) => l.created_at >= monthStart);
  const todayTotal = todayLogs.reduce((s, l) => s + Number(l.quantity), 0);
  const monthTotal = monthLogs.reduce((s, l) => s + Number(l.quantity), 0);

  /* ── Appro filtered by period ── */
  const ws = weekStart();
  const filteredAppro = (approLogs ?? []).filter((a) => {
    if (approPeriod === 'today')  return a.created_at.startsWith(today);
    if (approPeriod === 'week')   return a.created_at >= ws;
    if (approPeriod === 'month')  return a.created_at >= monthStart;
    return true;
  });

  /* ── Appro totals for period (per type) ── */
  function approTotal(type: FuelType) {
    return filteredAppro
      .filter((a) => a.fuel_type === type)
      .reduce((s, a) => s + Number(a.quantity), 0);
  }

  /* ── Stock alerts ── */
  const stockAlerts = (['gasoil', 'essence', 'huile'] as FuelType[]).filter((t) =>
    stockForType(stock ?? [], t) <= thresholdForType(stock ?? [], t),
  );

  const selectedEq = (equipment ?? []).find((e) => e.id === logForm.equipment_id);

  /* ── Mutation: saisie carburant ── */
  const createLog = useMutation({
    mutationFn: async () => {
      if (!logForm.equipment_id) throw new Error('Sélectionnez un équipement');
      if (!logForm.quantity || parseFloat(logForm.quantity) <= 0)
        throw new Error('La quantité doit être supérieure à 0');

      const { error } = await supabase.from('fuel_logs').insert({
        equipment_id:      logForm.equipment_id,
        fuel_type:         logForm.fuel_type,
        quantity:          parseFloat(logForm.quantity),
        horametre_at_fill: parseInt(logForm.horametre_at_fill) || selectedEq?.horametre_actuel || 0,
        site:              selectedEq?.site ?? profile?.site ?? 'Kinshasa',
        agent_id:          user!.id,
        notes:             logForm.notes,
      });
      if (error) throw error;
      // Stock deduction handled by DB trigger (trg_deduct_fuel_stock SECURITY DEFINER)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-stock'] });
      setLogModal(false);
      setLogForm(defaultLog);
      setErrorMsg(null);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message ?? 'Erreur lors de la saisie carburant');
    },
  });

  /* ── Mutation: approvisionnement ── */
  const addStock = useMutation({
    mutationFn: async () => {
      if (!stockForm.quantity || parseFloat(stockForm.quantity) <= 0)
        throw new Error('La quantité doit être supérieure à 0');

      const targetSite = profile?.site ?? 'Kinshasa';
      const qty = parseFloat(stockForm.quantity);

      // 1. Fetch fresh stock row — avoid stale-closure bugs
      const { data: freshRow, error: fetchErr } = await supabase
        .from('fuel_stock').select('*')
        .eq('site', targetSite).eq('fuel_type', stockForm.fuel_type)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      // 2. Update or create stock row
      if (freshRow) {
        const { error } = await supabase.from('fuel_stock')
          .update({ quantity: Number(freshRow.quantity) + qty, updated_at: new Date().toISOString() })
          .eq('id', freshRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fuel_stock').insert({
          site: targetSite, fuel_type: stockForm.fuel_type, quantity: qty, threshold: 200,
        });
        if (error) throw error;
      }

      // 3. Log into history table
      const { error: logErr } = await supabase.from('fuel_appro_logs').insert({
        site:      targetSite,
        fuel_type: stockForm.fuel_type,
        quantity:  qty,
        notes:     stockForm.notes,
        agent_id:  user!.id,
      });
      if (logErr) throw logErr;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['fuel-stock'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-appro-logs'] });
      setStockModal(false);
      setStockForm(defaultStock);
      setErrorMsg(null);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message ?? "Erreur lors de l'approvisionnement");
    },
  });

  /* ── Mutation: modifier un approvisionnement ── */
  const editAppro = useMutation({
    mutationFn: async () => {
      if (!editApproLog) return;
      const newQty = parseFloat(editApproForm.quantity);
      if (isNaN(newQty) || newQty <= 0) throw new Error('La quantité doit être supérieure à 0');
      const diff = newQty - Number(editApproLog.quantity);

      // 1. Mettre à jour le log
      const { error: logErr } = await supabase
        .from('fuel_appro_logs')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ quantity: newQty, notes: editApproForm.notes } as any)
        .eq('id', editApproLog.id);
      if (logErr) throw logErr;

      // 2. Ajuster le stock (ajoute ou retire la différence)
      if (diff !== 0) {
        const { data: stockRow, error: fetchErr } = await supabase
          .from('fuel_stock').select('*')
          .eq('site', editApproLog.site).eq('fuel_type', editApproLog.fuel_type)
          .maybeSingle();
        if (fetchErr) throw fetchErr;
        if (stockRow) {
          const { error } = await supabase.from('fuel_stock')
            .update({ quantity: Math.max(0, Number(stockRow.quantity) + diff), updated_at: new Date().toISOString() })
            .eq('id', stockRow.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['fuel-stock'] }),
        queryClient.refetchQueries({ queryKey: ['fuel-appro-logs'] }),
      ]);
      setEditApproModal(false);
      setEditApproLog(null);
      setErrorMsg(null);
    },
    onError: (err: Error) => setErrorMsg(err.message ?? "Erreur lors de la modification"),
  });

  /* ── Mutation: supprimer un approvisionnement ── */
  // Le trigger SQL trg_adjust_stock_on_appro_delete ajuste fuel_stock automatiquement
  const deleteAppro = useMutation({
    mutationFn: async (log: FuelApproLog) => {
      const { error } = await supabase.from('fuel_appro_logs').delete().eq('id', log.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['fuel-stock'] }),
        queryClient.refetchQueries({ queryKey: ['fuel-appro-logs'] }),
      ]);
    },
    onError: (err: Error) => setErrorMsg(err.message ?? "Erreur lors de la suppression"),
  });

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">Gestion du Carburant</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Suivi des consommations et approvisionnements</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button size="sm" variant="secondary" onClick={() => { setStockModal(true); setErrorMsg(null); }}>
                <PackagePlus className="w-3.5 h-3.5" />
                Approvisionnement
              </Button>
              <Button size="sm" onClick={() => { setLogModal(true); setErrorMsg(null); }}>
                <Plus className="w-3.5 h-3.5" />
                Saisie Carburant
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lecture seule pour les agents techniques */}
      {!isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-[12px] text-zinc-500">
          <Fuel className="w-4 h-4 flex-shrink-0" />
          Lecture seule — la saisie carburant est réservée aux superviseurs et administrateurs.
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/[0.07] border border-red-500/25 rounded-xl text-[13px]">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-red-400 flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400/50 hover:text-red-400 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stock alert banners */}
      {stockAlerts.map((type) => {
        const qty = stockForType(stock ?? [], type);
        return (
          <div key={type} className="flex items-center gap-3 px-4 py-3 bg-red-500/[0.06] border border-red-500/20 rounded-xl text-[13px]">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="font-semibold text-red-400">Stock {FUEL_CFG[type].label} critique</span>
            <span className="text-red-400/70">— {qty.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L restant(s)</span>
            {isAdmin && (
              <button
                onClick={() => { setStockForm({ ...defaultStock, fuel_type: type }); setStockModal(true); setErrorMsg(null); }}
                className="ml-auto text-[11px] font-semibold text-red-400 hover:text-red-300 underline underline-offset-2">
                Approvisionner
              </button>
            )}
          </div>
        );
      })}

      {/* Site filter (admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-zinc-500">Site :</span>
          <select value={site} onChange={(e) => setSite(e.target.value)} className="select-base py-1.5 w-auto text-[12px]">
            <option value="all">Tous les sites</option>
            {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Consumption stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Conso. aujourd'hui" value={todayTotal.toFixed(0)} unit="L" icon={TrendingDown}
          accent="text-orange-500" sub={`${todayLogs.length} saisie(s)`} />
        <StatCard label="Conso. ce mois"     value={monthTotal.toFixed(0)} unit="L" icon={CalendarDays}
          accent="text-blue-400" sub={`${monthLogs.length} saisies`} />
        <StatCard label="Total enregistré"   value={(logs ?? []).reduce((s, l) => s + Number(l.quantity), 0).toFixed(0)} unit="L"
          icon={Fuel} accent="text-zinc-500" sub={`${logs?.length ?? 0} entrées (50 max)`} />
      </div>

      {/* Stock cards */}
      {(stock?.length ?? 0) > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em] mb-2.5">Stock actuel</p>
          <div className="grid grid-cols-3 gap-3">
            {(['gasoil', 'essence', 'huile'] as FuelType[]).map((t) => (
              <StockCard key={t} type={t} stock={stock!} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ HISTORIQUE DES APPROVISIONNEMENTS ═══════════════ */}
      <div>
        {/* Section header + period tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[12px] font-semibold text-zinc-300 uppercase tracking-[0.06em]">
              Historique des Approvisionnements
            </p>
          </div>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 gap-0.5">
            {(['today', 'week', 'month', 'all'] as ApproPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setApproPeriod(p)}
                className={[
                  'px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors',
                  approPeriod === p
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300',
                ].join(' ')}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Per-type totals for selected period */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {(['gasoil', 'essence', 'huile'] as FuelType[]).map((t) => {
            const qty = approTotal(t);
            const cfg = FUEL_CFG[t];
            return (
              <div key={t} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 shadow-card">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={['w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.06em]">{cfg.label}</span>
                </div>
                <p className={[
                  'text-[22px] font-bold leading-none tabular-nums',
                  qty > 0 ? 'text-emerald-400' : 'text-zinc-700',
                ].join(' ')}>
                  +{qty.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                  <span className="text-[12px] font-normal text-zinc-600 ml-1">L</span>
                </p>
                <p className="text-[10px] text-zinc-700 mt-1.5">
                  {filteredAppro.filter((a) => a.fuel_type === t).length} opération(s)
                </p>
              </div>
            );
          })}
        </div>

        {/* Appro history table */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <span className="text-[12px] font-semibold text-zinc-300">
              {PERIOD_LABELS[approPeriod]}
            </span>
            <span className="text-[11px] text-zinc-600">
              {filteredAppro.length} approvisionnement(s) ·{' '}
              <span className="text-emerald-500 font-mono font-semibold">
                +{filteredAppro.reduce((s, a) => s + Number(a.quantity), 0)
                    .toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L
              </span>
            </span>
          </div>

          <div className={`hidden sm:grid gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950 ${
            isAdmin ? 'sm:grid-cols-[110px_100px_110px_1fr_130px_56px]' : 'sm:grid-cols-[110px_100px_110px_1fr_130px]'
          }`}>
            <span className="th">Date</span>
            <span className="th">Type</span>
            <span className="th text-right">Quantité</span>
            <span className="th">Notes</span>
            <span className="th">Agent</span>
            {isAdmin && <span />}
          </div>

          {filteredAppro.length === 0 ? (
            <div className="py-12 text-center">
              <PackagePlus className="w-7 h-7 text-zinc-800 mx-auto mb-2" />
              <p className="text-[12px] text-zinc-600">Aucun approvisionnement sur cette période</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredAppro.map((log) => {
                const cfg = FUEL_CFG[log.fuel_type];
                const dt  = new Date(log.created_at);
                const ag  = log.agent as { full_name: string } | null;
                return (
                  <div key={log.id}
                    className={`group flex sm:grid items-center gap-3 px-4 py-3 hover:bg-zinc-950 transition-colors ${
                      isAdmin ? 'sm:grid-cols-[110px_100px_110px_1fr_130px_56px]' : 'sm:grid-cols-[110px_100px_110px_1fr_130px]'
                    }`}>
                    <span className="text-[12px] font-mono text-zinc-500 whitespace-nowrap">
                      {dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}{' '}
                      <span className="text-zinc-700">
                        {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className={['w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
                      <span className={['text-[12px] font-medium', cfg.color].join(' ')}>{cfg.label}</span>
                    </div>
                    <span className="text-[13px] font-mono font-bold text-emerald-400 text-right tabular-nums">
                      +{Number(log.quantity).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L
                    </span>
                    <span className="hidden sm:block text-[12px] text-zinc-500 truncate">
                      {log.notes || <span className="text-zinc-700 italic">—</span>}
                    </span>
                    <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{ag?.full_name ?? '—'}</span>

                    {/* Actions modifier / supprimer */}
                    {isAdmin && (
                      <span className={`hidden sm:flex items-center gap-0.5 justify-end transition-opacity ${
                        confirmDeleteId === log.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {confirmDeleteId === log.id ? (
                          <>
                            <button
                              disabled={deleteAppro.isPending}
                              onClick={() => {
                                deleteAppro.mutate(log, {
                                  onSuccess: () => setConfirmDeleteId(null),
                                  onError: () => setConfirmDeleteId(null),
                                });
                              }}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-40 whitespace-nowrap">
                              {deleteAppro.isPending ? '…' : 'Confirmer'}
                            </button>
                            <button
                              disabled={deleteAppro.isPending}
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40">
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditAppro(log)}
                              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                              title="Modifier">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(log.id)}
                              className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Supprimer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ HISTORIQUE DES CONSOMMATIONS ═══════════════ */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[13px] font-semibold text-zinc-200">Historique des consommations</span>
          </div>
          <span className="text-[11px] text-zinc-600">{logs?.length ?? 0} entrées</span>
        </div>

        <div className="hidden sm:grid sm:grid-cols-[1fr_100px_110px_80px_110px_110px] gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950">
          <span className="th">Équipement</span>
          <span className="th">Type</span>
          <span className="th text-right">Quantité</span>
          <span className="th text-right">Horamètre</span>
          <span className="th">Agent</span>
          <span className="th">Date</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-zinc-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-4 flex gap-3 items-center">
                <div className="h-4 flex-1 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (logs?.length ?? 0) === 0 ? (
          <div className="py-16 text-center">
            <Fuel className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Aucune saisie carburant</p>
            <p className="text-[12px] text-zinc-700 mt-1">Utilisez "Saisie Carburant" pour enregistrer une consommation</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {logs!.map((log) => {
              const eq  = log.equipment as { name: string; serie: string } | null;
              const ag  = log.agent    as { full_name: string }           | null;
              const cfg = FUEL_CFG[log.fuel_type] ?? FUEL_CFG.gasoil;
              const dt  = new Date(log.created_at);
              return (
                <div key={log.id}
                  className="flex sm:grid sm:grid-cols-[1fr_100px_110px_80px_110px_110px] items-center gap-3 px-4 py-3 hover:bg-zinc-950 transition-colors">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-200 truncate">
                      {eq?.name ?? '—'} <span className="text-zinc-500 font-normal">{eq?.serie ?? ''}</span>
                    </p>
                    {log.notes && <p className="text-[11px] text-zinc-600 truncate mt-0.5">{log.notes}</p>}
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className={['w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
                    <span className={['text-[12px] font-medium', cfg.color].join(' ')}>{cfg.label}</span>
                  </div>
                  <span className="hidden sm:block text-[13px] font-mono font-bold text-zinc-200 text-right tabular-nums">
                    {Number(log.quantity).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                  </span>
                  <span className="hidden sm:block text-[12px] font-mono text-zinc-400 text-right">
                    {log.horametre_at_fill > 0 ? `${log.horametre_at_fill.toLocaleString()}h` : '—'}
                  </span>
                  <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{ag?.full_name ?? '—'}</span>
                  <span className="hidden sm:block text-[12px] text-zinc-600 font-mono">
                    {dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}{' '}
                    <span className="text-zinc-700">
                      {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* Modal saisie carburant                           */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal open={logModal} onClose={() => setLogModal(false)} title="Saisie Carburant" size="sm">
        <div className="space-y-4">
          {createLog.isError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/[0.07] border border-red-500/25 rounded-xl text-[12px] text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {(createLog.error as Error)?.message ?? 'Une erreur est survenue'}
            </div>
          )}

          <div>
            <label className="label-base">Équipement *</label>
            <select
              value={logForm.equipment_id}
              onChange={(e) => {
                const eq = (equipment ?? []).find((x) => x.id === e.target.value);
                setLogForm({
                  ...logForm,
                  equipment_id:      e.target.value,
                  horametre_at_fill: eq ? String(eq.horametre_actuel) : '',
                });
              }}
              className="select-base">
              <option value="">— Sélectionner un équipement —</option>
              {(equipment ?? []).map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name} {eq.serie}</option>
              ))}
            </select>
            {selectedEq && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Horamètre actuel : <span className="font-mono">{selectedEq.horametre_actuel.toLocaleString()}h</span>
                {selectedEq.site !== profile?.site && <span className="ml-2 text-zinc-600">· {selectedEq.site}</span>}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Type de carburant *</label>
              <select
                value={logForm.fuel_type}
                onChange={(e) => setLogForm({ ...logForm, fuel_type: e.target.value as FuelType })}
                className="select-base">
                <option value="gasoil">Gasoil</option>
                <option value="essence">Essence</option>
                <option value="huile">Huile</option>
              </select>
            </div>
            <div>
              <label className="label-base">Quantité (L) *</label>
              <input type="number" step="0.5" min="0.5"
                value={logForm.quantity}
                onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })}
                className="input-base" placeholder="Ex: 80" />
            </div>
          </div>

          <div>
            <label className="label-base">Horamètre lors du plein</label>
            <input type="number" min="0"
              value={logForm.horametre_at_fill}
              onChange={(e) => setLogForm({ ...logForm, horametre_at_fill: e.target.value })}
              className="input-base"
              placeholder={selectedEq ? String(selectedEq.horametre_actuel) : '0'} />
          </div>

          <div>
            <label className="label-base">Notes (optionnel)</label>
            <input type="text"
              value={logForm.notes}
              onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
              className="input-base" placeholder="N° bon de livraison, fournisseur…" />
          </div>

          {logForm.equipment_id && logForm.quantity && parseFloat(logForm.quantity) > 0 && (
            <div className={['flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px]',
              FUEL_CFG[logForm.fuel_type].bg, FUEL_CFG[logForm.fuel_type].border].join(' ')}>
              <div className={['w-1.5 h-1.5 rounded-full flex-shrink-0', FUEL_CFG[logForm.fuel_type].dot].join(' ')} />
              <span className={FUEL_CFG[logForm.fuel_type].color}>
                {FUEL_CFG[logForm.fuel_type].label} · <strong>{parseFloat(logForm.quantity).toFixed(1)} L</strong>
                {' '}— seront déduits du stock automatiquement
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setLogModal(false)}>Annuler</Button>
            <Button
              onClick={() => createLog.mutate()}
              loading={createLog.isPending}
              disabled={!logForm.equipment_id || !logForm.quantity || parseFloat(logForm.quantity) <= 0}>
              <Droplets className="w-3.5 h-3.5" /> Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════ */}
      {/* Modal modifier approvisionnement                 */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal
        open={editApproModal}
        onClose={() => { setEditApproModal(false); setEditApproLog(null); }}
        title="Modifier l'approvisionnement"
        size="sm"
      >
        {editApproLog && (
          <div className="space-y-4">
            {/* Info read-only : type + date */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className={['w-2 h-2 rounded-full flex-shrink-0', FUEL_CFG[editApproLog.fuel_type].dot].join(' ')} />
              <span className={['text-[13px] font-semibold', FUEL_CFG[editApproLog.fuel_type].color].join(' ')}>
                {FUEL_CFG[editApproLog.fuel_type].label}
              </span>
              <span className="text-[12px] text-zinc-600 ml-auto">
                {new Date(editApproLog.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {' · '}
                {new Date(editApproLog.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Quantité */}
            <div>
              <label className="label-base">Quantité (L) *</label>
              <input
                type="number" min="1" step="1"
                value={editApproForm.quantity}
                onChange={(e) => setEditApproForm((f) => ({ ...f, quantity: e.target.value }))}
                className="input-base"
              />
              {editApproForm.quantity && parseFloat(editApproForm.quantity) > 0 &&
                parseFloat(editApproForm.quantity) !== Number(editApproLog.quantity) && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg text-[11px] text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Ancienne valeur : <strong>{Number(editApproLog.quantity).toLocaleString('fr-FR')} L</strong>
                    {' '}→ <strong>{parseFloat(editApproForm.quantity).toLocaleString('fr-FR')} L</strong>
                    {' '}
                    ({parseFloat(editApproForm.quantity) > Number(editApproLog.quantity) ? '+' : ''}
                    {(parseFloat(editApproForm.quantity) - Number(editApproLog.quantity)).toLocaleString('fr-FR')} L sur le stock)
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="label-base">N° bon / Fournisseur</label>
              <input
                type="text"
                value={editApproForm.notes}
                onChange={(e) => setEditApproForm((f) => ({ ...f, notes: e.target.value }))}
                className="input-base"
                placeholder="Ex: BON-2026-0042 · TRADEX"
              />
            </div>

            {editAppro.isError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/[0.07] border border-red-500/25 rounded-xl text-[12px] text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {(editAppro.error as Error)?.message ?? 'Erreur lors de la modification'}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => { setEditApproModal(false); setEditApproLog(null); }}>Annuler</Button>
              <Button
                onClick={() => editAppro.mutate()}
                loading={editAppro.isPending}
                disabled={!editApproForm.quantity || parseFloat(editApproForm.quantity) <= 0}>
                <Edit2 className="w-3.5 h-3.5" /> Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════ */}
      {/* Modal approvisionnement                          */}
      {/* ══════════════════════════════════════════════════ */}
      <Modal open={stockModal} onClose={() => setStockModal(false)} title="Approvisionnement" size="sm">
        <div className="space-y-4">
          {addStock.isError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/[0.07] border border-red-500/25 rounded-xl text-[12px] text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {(addStock.error as Error)?.message ?? 'Une erreur est survenue'}
            </div>
          )}

          {/* Current stock snapshot */}
          <div className="space-y-1.5">
            {(['gasoil', 'essence', 'huile'] as FuelType[]).map((t) => {
              const qty = stockForType(stock ?? [], t);
              const thr = thresholdForType(stock ?? [], t);
              const cfg = FUEL_CFG[t];
              return (
                <div key={t} className="flex items-center justify-between px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={['w-2 h-2 rounded-full flex-shrink-0', cfg.dot].join(' ')} />
                    <span className="text-[13px] text-zinc-300">{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {qty <= thr && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    <span className={['text-[13px] font-mono font-bold', qty <= thr ? 'text-red-400' : 'text-zinc-300'].join(' ')}>
                      {qty.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Type de carburant *</label>
              <select
                value={stockForm.fuel_type}
                onChange={(e) => setStockForm({ ...stockForm, fuel_type: e.target.value as FuelType })}
                className="select-base">
                <option value="gasoil">Gasoil</option>
                <option value="essence">Essence</option>
                <option value="huile">Huile</option>
              </select>
            </div>
            <div>
              <label className="label-base">Quantité à ajouter (L) *</label>
              <input type="number" min="1" step="1"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                className="input-base" placeholder="Ex: 1000" />
            </div>
          </div>

          <div>
            <label className="label-base">N° bon / Fournisseur</label>
            <input type="text"
              value={stockForm.notes}
              onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
              className="input-base" placeholder="Ex: BON-2026-0042 · TRADEX" />
          </div>

          {/* Live preview */}
          {stockForm.quantity && parseFloat(stockForm.quantity) > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl text-[12px] text-emerald-400">
              <PackagePlus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Stock {FUEL_CFG[stockForm.fuel_type].label} :{' '}
                <strong>{stockForType(stock ?? [], stockForm.fuel_type).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L</strong>
                {' '}→{' '}
                <strong>
                  {(stockForType(stock ?? [], stockForm.fuel_type) + parseFloat(stockForm.quantity))
                    .toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L
                </strong>
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setStockModal(false)}>Annuler</Button>
            <Button
              onClick={() => addStock.mutate()}
              loading={addStock.isPending}
              disabled={!stockForm.quantity || parseFloat(stockForm.quantity) <= 0}>
              <PackagePlus className="w-3.5 h-3.5" /> Ajouter au stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
