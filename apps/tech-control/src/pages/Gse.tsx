import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import { Plus, Truck, Search, AlertTriangle, CheckCircle2, XCircle, Wrench, RefreshCw, Trash2 } from 'lucide-react';

type GseType = 'tractor' | 'escalier' | 'gpu' | 'pushback' | 'belt_loader' | 'ambulift'
             | 'loader' | 'air_starter' | 'toilette' | 'potable_water' | 'tarmac_bus' | 'other';

const GSE_TYPES: { value: GseType; label: string }[] = [
  { value: 'tractor',      label: 'Tracteur'      },
  { value: 'escalier',     label: 'Escalier'      },
  { value: 'gpu',          label: 'GPU'           },
  { value: 'pushback',     label: 'Pushback'      },
  { value: 'belt_loader',  label: 'Belt Loader'   },
  { value: 'ambulift',     label: 'Ambulift'      },
  { value: 'loader',       label: 'Loader'        },
  { value: 'air_starter',  label: 'Air Starter'   },
  { value: 'toilette',     label: 'Toilette'      },
  { value: 'potable_water',label: 'Potable Water' },
  { value: 'tarmac_bus',   label: 'Tarmac Bus'    },
  { value: 'other',        label: 'Autre'         },
];

type GseRow = {
  id: string; name: string; serie: string; marque: string;
  type: GseType; site: string;
  horametre_actuel: number; horametre_revision: number; intervalle: number;
  horametre_prochain: number; delta: number;
  statut: 'op' | 'inop'; obs: string;
  created_at: string; updated_at: string;
};

function useGse(site: string) {
  return useQuery({
    queryKey: ['gse', site],
    queryFn: async () => {
      let q = supabase.from('gse_equipment').select('*').order('name');
      if (site !== 'all') q = q.eq('site', site);
      const { data } = await q;
      return (data ?? []) as GseRow[];
    },
    refetchInterval: 30_000,
  });
}

function deltaColor(delta: number) {
  if (delta > 0)    return 'text-red-500';
  if (delta > -50)  return 'text-amber-500';
  return 'text-emerald-500';
}

function deltaBorderL(delta: number, statut: string) {
  if (statut === 'inop' || delta > 0)  return 'border-l-red-500';
  if (delta > -50)                     return 'border-l-amber-400';
  return 'border-l-emerald-400';
}

function horaBar(current: number, revision: number, intervalle: number) {
  const pct  = Math.min(100, Math.max(0, Math.round(((current - revision) / intervalle) * 100)));
  return { pct, color: pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500' };
}

const STATUS_TABS = [
  { key: 'all'   as const, label: 'Tous'    },
  { key: 'op'    as const, label: 'OP'      },
  { key: 'inop'  as const, label: 'INOP'   },
  { key: 'alert' as const, label: 'Alertes' },
];

export function GsePage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [siteFilter, setSiteFilter] = useState(profile?.site ?? 'all');
  const [tab,        setTab       ] = useState<'all' | 'op' | 'inop' | 'alert'>('all');
  const [search,     setSearch    ] = useState('');
  const [typeFilter, setTypeFilter] = useState<GseType | 'all'>('all');
  const [modalOpen,  setModalOpen ] = useState(false);
  const [editItem,   setEditItem  ] = useState<GseRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<GseRow | null>(null);

  const { data: gse, isLoading, refetch, isFetching } = useGse(siteFilter);

  const defaultForm = {
    name: '', serie: '', marque: '', type: 'tractor' as GseType,
    site: profile?.site ?? SITES[0],
    horametre_actuel: 0, horametre_revision: 0, intervalle: 250,
    statut: 'op' as 'op' | 'inop', obs: '',
  };
  const [form, setForm] = useState(defaultForm);

  function openAdd() {
    setEditItem(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEdit(item: GseRow) {
    setEditItem(item);
    setForm({
      name: item.name, serie: item.serie, marque: item.marque, type: item.type,
      site: item.site, horametre_actuel: item.horametre_actuel,
      horametre_revision: item.horametre_revision, intervalle: item.intervalle,
      statut: item.statut, obs: item.obs,
    });
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, serie: form.serie, marque: form.marque, type: form.type,
        site: form.site, horametre_actuel: form.horametre_actuel,
        horametre_revision: form.horametre_revision, intervalle: form.intervalle,
        statut: form.statut, obs: form.obs || '',
        updated_at: new Date().toISOString(),
      };
      if (editItem) {
        const { error } = await supabase.from('gse_equipment').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gse_equipment').insert({ ...payload, assigned_to: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gse'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
      setModalOpen(false);
    },
  });

  const toggleStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: 'op' | 'inop' }) => {
      const { error } = await supabase.from('gse_equipment')
        .update({ statut, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gse'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gse_equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gse'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
      setDeleteItem(null);
    },
  });

  const all     = gse ?? [];
  const opCount = all.filter((g) => g.statut === 'op').length;
  const inopCount = all.filter((g) => g.statut === 'inop').length;
  const alertCount = all.filter((g) => g.delta > 0 || g.statut === 'inop').length;

  const filtered = all.filter((g) => {
    if (tab === 'op'    && g.statut !== 'op')               return false;
    if (tab === 'inop'  && g.statut !== 'inop')             return false;
    if (tab === 'alert' && g.delta <= 0 && g.statut === 'op') return false;
    if (typeFilter !== 'all' && g.type !== typeFilter)       return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.serie.toLowerCase().includes(q) || g.marque.toLowerCase().includes(q);
    }
    return true;
  });

  const typeLabel = (t: GseType) => GSE_TYPES.find((x) => x.value === t)?.label ?? t;
  const previewDelta = form.horametre_actuel - (form.horametre_revision + form.intervalle);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">Parc GSE</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {all.length} équipements
            {alertCount > 0 && <span className="ml-2 text-red-400 font-semibold">· {alertCount} alerte(s)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors disabled:opacity-40">
            <RefreshCw className={['w-3.5 h-3.5', isFetching ? 'animate-spin' : ''].join(' ')} />
          </button>
          {isAdmin && (
            <Button onClick={openAdd} size="sm">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: all.length, color: 'text-zinc-300', bg: 'bg-zinc-900' },
          { label: 'OP', value: opCount, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.05]', border: 'border-emerald-500/20' },
          { label: 'INOP', value: inopCount, color: 'text-red-400', bg: 'bg-red-500/[0.05]', border: 'border-red-500/20' },
          { label: 'Alertes', value: alertCount, color: 'text-amber-400', bg: 'bg-amber-500/[0.05]', border: 'border-amber-500/20' },
        ].map((s) => (
          <div key={s.label} className={['border rounded-xl px-4 py-3 shadow-card', s.bg, s.border ?? 'border-zinc-800'].join(' ')}>
            <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-[0.08em]">{s.label}</p>
            <p className={['text-[26px] font-bold leading-none tabular-nums mt-1', s.color].join(' ')}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 flex-shrink-0">
          {STATUS_TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={['px-3 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap',
                tab === t.key ? 'bg-zinc-900 text-zinc-200 shadow-card' : 'text-zinc-500 hover:text-zinc-400'].join(' ')}>
              {t.label}
              {t.key === 'alert' && alertCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{alertCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, série, marque…" className="input-base pl-9 py-2" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as GseType | 'all')} className="select-base py-2 w-auto">
          <option value="all">Tous les types</option>
          {GSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {isAdmin && (
          <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="select-base py-2 w-auto">
            <option value="all">Tous les sites</option>
            {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl py-16 text-center bg-zinc-900 shadow-card">
          <Truck className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-500 font-medium">Aucun équipement trouvé</p>
          <p className="text-[12px] text-zinc-700 mt-1">Modifiez les filtres ou la recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((eq) => {
            const bar = horaBar(eq.horametre_actuel, eq.horametre_revision, eq.intervalle);
            return (
              <div key={eq.id}
                className={['group bg-zinc-900 border border-zinc-800 rounded-xl border-l-4 shadow-card hover:bg-zinc-950 transition-colors overflow-hidden',
                  deltaBorderL(eq.delta, eq.statut)].join(' ')}>
                {/* Card header */}
                <div className="flex items-start justify-between px-4 pt-4 pb-3">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[14px] font-bold text-zinc-100 leading-snug">{eq.name}</p>
                    <p className="text-[12px] text-zinc-500 mt-0.5">{[eq.serie, eq.marque].filter(Boolean).join(' · ')}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{typeLabel(eq.type)}{eq.site !== profile?.site ? ` · ${eq.site}` : ''}</p>
                  </div>
                  <Badge color={eq.statut === 'op' ? 'green' : 'red'} dot>{eq.statut.toUpperCase()}</Badge>
                </div>

                {/* Horametre bar */}
                <div className="px-4 pb-3">
                  <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
                    <span>Révision ({eq.intervalle}h)</span>
                    <span>{bar.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={['h-full rounded-full transition-all', bar.color].join(' ')} style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-px bg-zinc-800 border-t border-zinc-800">
                  {[
                    { label: 'Horamètre', value: `${eq.horametre_actuel.toLocaleString()}h` },
                    { label: 'Proch. rév.', value: `${eq.horametre_prochain.toLocaleString()}h` },
                    { label: 'Delta',
                      value: `${eq.delta > 0 ? '+' : ''}${eq.delta}h`,
                      cls: deltaColor(eq.delta) },
                  ].map((m) => (
                    <div key={m.label} className="bg-zinc-900 px-3 py-2.5 text-center">
                      <p className="text-[9px] text-zinc-600 uppercase tracking-[0.06em] font-semibold">{m.label}</p>
                      <p className={['text-[12px] font-mono font-bold mt-0.5', m.cls ?? 'text-zinc-300'].join(' ')}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Obs */}
                {eq.obs && (
                  <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950">
                    <p className="text-[11px] text-zinc-500 leading-relaxed truncate">{eq.obs}</p>
                  </div>
                )}

                {/* Alert badge */}
                {eq.delta > 0 && (
                  <div className="px-4 py-2 border-t border-zinc-800 bg-red-500/[0.06] flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-[11px] text-red-400 font-medium">Révision dépassée de {eq.delta}h</span>
                  </div>
                )}

                {/* Actions (admin) */}
                {isAdmin && (
                  <div className="flex gap-1.5 px-4 py-2.5 border-t border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    {eq.statut !== 'op' && (
                      <button onClick={() => toggleStatut.mutate({ id: eq.id, statut: 'op' })}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle2 className="w-3 h-3" /> OP
                      </button>
                    )}
                    {eq.statut !== 'inop' && (
                      <button onClick={() => toggleStatut.mutate({ id: eq.id, statut: 'inop' })}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                        <XCircle className="w-3 h-3" /> INOP
                      </button>
                    )}
                    <button onClick={() => openEdit(eq)}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors">
                      <Wrench className="w-3 h-3" /> Éditer
                    </button>
                    <button onClick={() => setDeleteItem(eq)}
                      className="flex items-center justify-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Supprimer l'équipement" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-200">{deleteItem?.name}</p>
              <p className="text-[12px] text-zinc-500 mt-0.5">{deleteItem?.serie} · {deleteItem?.site}</p>
              <p className="text-[12px] text-red-400 mt-2">
                Les checklists et logs carburant associés seront supprimés automatiquement (CASCADE).
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>Annuler</Button>
            <Button
              variant="danger"
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              loading={deleteMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer définitivement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? "Modifier l'équipement" : 'Ajouter un équipement GSE'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label-base">Désignation *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-base" placeholder="Ex: TRACTOR, ESCALIER, GPU…" />
            </div>
            <div>
              <label className="label-base">Série / Immat.</label>
              <input type="text" value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })}
                className="input-base" placeholder="Ex: AT-122" />
            </div>
            <div>
              <label className="label-base">Marque</label>
              <input type="text" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })}
                className="input-base" placeholder="Ex: TLD, ROFAN…" />
            </div>
            <div>
              <label className="label-base">Catégorie</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as GseType })} className="select-base">
                {GSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Site</label>
              <select value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} className="select-base">
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">Horamètres</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label-base">Actuel (h) *</label>
                <input type="number" value={form.horametre_actuel}
                  onChange={(e) => setForm({ ...form, horametre_actuel: Number(e.target.value) })}
                  className="input-base" min={0} />
              </div>
              <div>
                <label className="label-base">Dernière révision (h)</label>
                <input type="number" value={form.horametre_revision}
                  onChange={(e) => setForm({ ...form, horametre_revision: Number(e.target.value) })}
                  className="input-base" min={0} />
              </div>
              <div>
                <label className="label-base">Intervalle (h)</label>
                <input type="number" value={form.intervalle}
                  onChange={(e) => setForm({ ...form, intervalle: Number(e.target.value) })}
                  className="input-base" min={50} />
              </div>
            </div>
            <div className={['text-[12px] px-3 py-2 rounded-lg',
              previewDelta > 0 ? 'bg-red-500/10 text-red-400' : previewDelta > -50 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'].join(' ')}>
              Prochaine révision : <strong>{(form.horametre_revision + form.intervalle).toLocaleString()}h</strong>
              {' '}— Delta : <strong>{previewDelta > 0 ? '+' : ''}{previewDelta}h</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as 'op' | 'inop' })} className="select-base">
                <option value="op">OP — Opérationnel</option>
                <option value="inop">INOP — Hors service</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Observations</label>
            <textarea value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })}
              rows={2} className="input-base resize-none" placeholder="Notes, pannes connues, pièces en attente…" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} disabled={!form.name}>
              {editItem ? 'Enregistrer' : 'Ajouter au parc'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
