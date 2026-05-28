import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import { Plus, CheckCircle, Wrench, Search, AlertTriangle, Clock, User } from 'lucide-react';

type StatusFilter   = 'ouvert' | 'en_cours' | 'resolu' | 'all';
type PriorityFilter = 'faible' | 'moyen' | 'critique' | 'all';

type GseIncidentRow = {
  id: string; title: string; description: string;
  equipment_id: string | null; priority: 'faible' | 'moyen' | 'critique';
  status: 'ouvert' | 'en_cours' | 'resolu';
  site: string; reporter_id: string; assigned_to: string | null;
  resolved_at: string | null; created_at: string; updated_at: string;
  reporter:  { full_name: string } | null;
  assignee:  { full_name: string } | null;
  equipment: { name: string; serie: string } | null;
};

function useInterventions(status: StatusFilter, priority: PriorityFilter, site: string) {
  return useQuery({
    queryKey: ['gse-interventions', status, priority, site],
    queryFn: async () => {
      let q = supabase
        .from('gse_incidents')
        .select('*, reporter:profiles!reporter_id(full_name), assignee:profiles!assigned_to(full_name), equipment:gse_equipment!equipment_id(name, serie)')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (status !== 'all')   q = q.eq('status', status);
      if (priority !== 'all') q = q.eq('priority', priority);
      if (site !== 'all')     q = q.eq('site', site);
      const { data } = await q;
      return (data ?? []) as unknown as GseIncidentRow[];
    },
    refetchInterval: 15_000,
  });
}

function useGseEquipment() {
  return useQuery({
    queryKey: ['gse-for-incident'],
    queryFn: async () => {
      const { data } = await supabase.from('gse_equipment').select('id, name, serie').order('name');
      return data ?? [];
    },
  });
}

function useAgents() {
  return useQuery({
    queryKey: ['tech-agents-for-incident'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles')
        .select('id, full_name')
        .in('service', ['tech', 'both'])
        .eq('status', 'active');
      return data ?? [];
    },
  });
}

const priorityColors = { faible: 'green', moyen: 'yellow', critique: 'red' } as const;
const priorityLabels = { faible: 'Faible', moyen: 'Moyen', critique: 'Critique' };
const statusColors   = { ouvert: 'red', en_cours: 'yellow', resolu: 'green' } as const;
const statusLabels   = { ouvert: 'Ouvert', en_cours: 'En cours', resolu: 'Résolu' };
const PRIORITY_DOT   = { critique: 'bg-red-400', moyen: 'bg-amber-400', faible: 'bg-zinc-500' };

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',      label: 'Toutes'   },
  { key: 'ouvert',   label: 'Ouvertes' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'resolu',   label: 'Résolues' },
];

function elapsed(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export function InterventionsPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [statusFilter,   setStatusFilter  ] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter ] = useState<PriorityFilter>('all');
  const [site,           setSite           ] = useState(profile?.site ?? 'all');
  const [search,         setSearch         ] = useState('');
  const [modalOpen,      setModalOpen      ] = useState(false);
  const [detailItem,     setDetailItem     ] = useState<GseIncidentRow | null>(null);

  const { data: interventions, isLoading } = useInterventions(statusFilter, priorityFilter, site);
  const { data: gseEquipment } = useGseEquipment();
  const { data: agents       } = useAgents();

  const [form, setForm] = useState({
    title: '', description: '', site: profile?.site ?? SITES[0],
    priority: 'moyen' as 'faible' | 'moyen' | 'critique',
    equipment_id: '', assigned_to: '',
  });

  const filtered = (interventions ?? []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q)
      || item.description.toLowerCase().includes(q)
      || (item.equipment as { name: string; serie: string } | null)?.name.toLowerCase().includes(q)
      || (item.reporter  as { full_name: string } | null)?.full_name.toLowerCase().includes(q);
  });

  const critiqueCount = (interventions ?? []).filter((i) => i.priority === 'critique' && i.status !== 'resolu').length;
  const ouvertCount   = (interventions ?? []).filter((i) => i.status === 'ouvert').length;

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('gse_incidents').insert({
        title: form.title, description: form.description, site: form.site,
        priority: form.priority, status: 'ouvert',
        reporter_id: user!.id,
        equipment_id: form.equipment_id || null,
        assigned_to: form.assigned_to || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gse-interventions'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
      setModalOpen(false);
      setForm({ title: '', description: '', site: profile?.site ?? SITES[0], priority: 'moyen', equipment_id: '', assigned_to: '' });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ouvert' | 'en_cours' | 'resolu' }) => {
      const { error } = await supabase.from('gse_incidents').update({
        status,
        resolved_at: status === 'resolu' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gse-interventions'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
      setDetailItem(null);
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">Interventions</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {interventions?.length ?? 0} intervention(s)
            {critiqueCount > 0 && <span className="ml-2 text-red-400 font-semibold">· {critiqueCount} critique(s)</span>}
            {ouvertCount > 0 && statusFilter !== 'ouvert' && <span className="ml-2 text-amber-400">· {ouvertCount} ouvertes</span>}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5" /> Signaler
        </Button>
      </div>

      {/* Alert banner for critiques */}
      {critiqueCount > 0 && statusFilter !== 'resolu' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/[0.06] border border-red-500/20 rounded-xl text-[13px]">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-red-400 font-semibold">{critiqueCount} intervention(s) critique(s) en cours</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 flex-shrink-0">
          {STATUS_TABS.map((t) => {
            const count = t.key === 'all' ? 0
              : (interventions ?? []).filter((i) => i.status === t.key).length;
            return (
              <button key={t.key} onClick={() => setStatusFilter(t.key)}
                className={['flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap',
                  statusFilter === t.key ? 'bg-zinc-900 text-zinc-200 shadow-card' : 'text-zinc-500 hover:text-zinc-400'].join(' ')}>
                {t.label}
                {t.key !== 'all' && count > 0 && (
                  <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    t.key === 'ouvert' ? 'bg-red-500/10 text-red-400' :
                    t.key === 'en_cours' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'].join(' ')}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Titre, équipement, agent…" className="input-base pl-9 py-2" />
        </div>

        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)} className="select-base py-2 w-auto">
          <option value="all">Toutes priorités</option>
          <option value="critique">Critique</option>
          <option value="moyen">Moyen</option>
          <option value="faible">Faible</option>
        </select>

        {canEdit && (
          <select value={site} onChange={(e) => setSite(e.target.value)} className="select-base py-2 w-auto">
            <option value="all">Tous les sites</option>
            {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
        <div className="hidden sm:grid sm:grid-cols-[12px_1fr_140px_88px_88px_64px_auto] gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950">
          <span /><span className="th">Intervention</span><span className="th">Équipement</span>
          <span className="th">Priorité</span><span className="th">Statut</span>
          <span className="th">Depuis</span><span />
        </div>

        {isLoading ? (
          <div className="divide-y divide-zinc-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 bg-zinc-800 rounded animate-pulse" />
                <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500/30 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">
              {search ? 'Aucun résultat pour cette recherche' : 'Aucune intervention'}
            </p>
            {!search && statusFilter === 'all' && (
              <p className="text-[12px] text-zinc-700 mt-1">Toutes les opérations se déroulent normalement</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filtered.map((item) => {
              const eq = item.equipment as { name: string; serie: string } | null;
              return (
                <div key={item.id} onClick={() => setDetailItem(item)}
                  className="group flex sm:grid sm:grid-cols-[12px_1fr_140px_88px_88px_64px_auto] items-center gap-3 px-4 py-3.5 hover:bg-zinc-950 transition-colors cursor-pointer">
                  <div className={['w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[item.priority] ?? 'bg-zinc-600'].join(' ')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-200 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(item.reporter as { full_name: string } | null)?.full_name && (
                        <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {(item.reporter as { full_name: string }).full_name}
                        </span>
                      )}
                      {item.site !== profile?.site && (
                        <span className="text-[10px] text-zinc-700">{item.site}</span>
                      )}
                    </div>
                  </div>
                  <span className="hidden sm:block text-[12px] text-zinc-500 truncate">
                    {eq ? `${eq.name} ${eq.serie}` : '—'}
                  </span>
                  <span className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
                    <Badge color={priorityColors[item.priority]}>{priorityLabels[item.priority]}</Badge>
                  </span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <Badge color={statusColors[item.status]} dot>{statusLabels[item.status]}</Badge>
                  </span>
                  <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-600 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {elapsed(item.created_at)}
                  </span>
                  {item.status !== 'resolu' && canEdit && (
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}>
                      {item.status === 'ouvert' && (
                        <button onClick={() => updateStatus.mutate({ id: item.id, status: 'en_cours' })}
                          className="text-[11px] font-medium text-zinc-400 hover:text-orange-500 px-2 py-1 rounded hover:bg-orange-500/10 transition-colors">
                          Prendre
                        </button>
                      )}
                      <button onClick={() => updateStatus.mutate({ id: item.id, status: 'resolu' })}
                        className="text-[11px] font-medium text-zinc-400 hover:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors">
                        Résoudre
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Détail de l'intervention" size="lg">
        {detailItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={priorityColors[detailItem.priority]}>{priorityLabels[detailItem.priority]}</Badge>
              <Badge color={statusColors[detailItem.status]} dot>{statusLabels[detailItem.status]}</Badge>
              {detailItem.assigned_to && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <User className="w-3 h-3" />
                  Assigné à {(detailItem.assignee as { full_name: string } | null)?.full_name ?? '—'}
                </span>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em] mb-1">Titre</p>
              <p className="text-[15px] font-semibold text-zinc-100">{detailItem.title}</p>
            </div>

            {detailItem.description && (
              <div>
                <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em] mb-1">Description</p>
                <p className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{detailItem.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Site',         value: detailItem.site },
                { label: 'Équipement',   value: detailItem.equipment
                    ? `${(detailItem.equipment as { name: string; serie: string }).name} ${(detailItem.equipment as { name: string; serie: string }).serie}`
                    : '—' },
                { label: 'Signalé par',  value: (detailItem.reporter as { full_name: string } | null)?.full_name ?? '—' },
                { label: 'Créé le',      value: new Date(detailItem.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                detailItem.assignee
                  ? { label: 'Assigné à', value: (detailItem.assignee as { full_name: string }).full_name }
                  : null,
              ].filter(Boolean).map((f) => (
                <div key={f!.label} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-[0.08em] mb-0.5">{f!.label}</p>
                  <p className="text-[13px] font-medium text-zinc-300">{f!.value}</p>
                </div>
              ))}
              {detailItem.resolved_at && (
                <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-[0.08em] mb-0.5">Résolu le</p>
                  <p className="text-[13px] font-medium text-emerald-400">
                    {new Date(detailItem.resolved_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>

            {detailItem.status !== 'resolu' && canEdit && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                {detailItem.status === 'ouvert' && (
                  <Button variant="secondary" onClick={() => updateStatus.mutate({ id: detailItem.id, status: 'en_cours' })} loading={updateStatus.isPending}>
                    Prendre en charge
                  </Button>
                )}
                <Button onClick={() => updateStatus.mutate({ id: detailItem.id, status: 'resolu' })} loading={updateStatus.isPending}>
                  <CheckCircle className="w-3.5 h-3.5" /> Marquer résolu
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Signaler une intervention" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label-base">Titre *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-base" placeholder="Résumé court de l'intervention" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Site</label>
              <select value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} className="select-base">
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Priorité</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as 'faible' | 'moyen' | 'critique' })} className="select-base">
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="critique">Critique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Équipement concerné</label>
            <select value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: e.target.value })} className="select-base">
              <option value="">Aucun équipement spécifique</option>
              {(gseEquipment ?? []).map((g: { id: string; name: string; serie: string }) => (
                <option key={g.id} value={g.id}>{g.name} {g.serie}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="input-base resize-none" placeholder="Décrivez le problème en détail…" />
          </div>

          {canEdit && agents && agents.length > 0 && (
            <div>
              <label className="label-base">Assigner à</label>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="select-base">
                <option value="">Non assigné</option>
                {agents.map((a: { id: string; full_name: string }) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          )}

          {form.priority === 'critique' && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/[0.06] border border-red-500/20 rounded-xl text-[12px] text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Priorité critique — cette intervention sera signalée immédiatement
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!form.title}>
              <Wrench className="w-3.5 h-3.5" /> Signaler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
