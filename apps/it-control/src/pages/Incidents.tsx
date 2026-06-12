import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import { Plus, CheckCircle, Image, X } from 'lucide-react';

type IncidentStatusFilter = 'open' | 'in_progress' | 'resolved' | 'all';

function useIncidents(filter: IncidentStatusFilter) {
  return useQuery({
    queryKey: ['incidents', filter],
    queryFn: async () => {
      let q = supabase
        .from('incidents')
        .select('*, reporter:profiles!reported_by(full_name, site), assignee:profiles!assigned_to(full_name)')
        .order('created_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter);
      const { data } = await q;
      return data ?? [];
    },
    refetchInterval: 15_000,
  });
}

function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, site')
        .in('role', ['it_agent', 'supervisor'])
        .eq('status', 'active');
      return data ?? [];
    },
  });
}

async function uploadIncidentPhoto(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('incident-photos').upload(path, file);
  if (error) return null;
  const { data } = supabase.storage.from('incident-photos').getPublicUrl(path);
  return data.publicUrl;
}

const priorityColors = { low: 'green', medium: 'yellow', critical: 'red' } as const;
const priorityLabels = { low: 'Faible', medium: 'Moyen', critical: 'Critique' };
const statusColors = { open: 'red', in_progress: 'yellow', resolved: 'green' } as const;
const statusLabels = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu' };

const FILTERS: { key: IncidentStatusFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'open', label: 'Ouverts' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'resolved', label: 'Résolus' },
];

type IncidentRow = {
  id: string;
  title: string;
  description: string;
  site: string;
  priority: string;
  status: string;
  photo_url: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter: { full_name: string } | null;
  assignee: { full_name: string } | null;
};

export function IncidentsPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<IncidentStatusFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailIncident, setDetailIncident] = useState<IncidentRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: incidents, isLoading } = useIncidents(filter);
  const { data: agents } = useAgents();

  const canEdit = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [form, setForm] = useState({
    title: '',
    description: '',
    site: profile?.site ?? SITES[0],
    priority: 'medium' as 'low' | 'medium' | 'critical',
    assigned_to: '',
  });

  function resetCreateForm() {
    setForm({ title: '', description: '', site: profile?.site ?? SITES[0], priority: 'medium', assigned_to: '' });
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      let photo_url: string | null = null;
      if (photoFile) {
        photo_url = await uploadIncidentPhoto(photoFile);
      }
      const { error } = await supabase.from('incidents').insert({
        title: form.title,
        description: form.description,
        site: form.site,
        priority: form.priority,
        status: 'open',
        reported_by: user!.id,
        assigned_to: form.assigned_to || null,
        photo_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['site-statuses'] });
      setModalOpen(false);
      resetCreateForm();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'open' | 'in_progress' | 'resolved' }) => {
      const { error } = await supabase
        .from('incidents')
        .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['site-statuses'] });
      // Refresh detail if open
      if (detailIncident) {
        setDetailIncident((prev) => {
          if (!prev) return null;
          return { ...prev, status: prev.status === 'open' ? 'in_progress' : 'resolved' };
        });
      }
    },
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-zinc-900 tracking-tight">Incidents</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {incidents?.length ?? 0} incident{(incidents?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="w-3.5 h-3.5" />
          Signaler
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-[#F4F5FA] border border-[#E6E8F0] rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={[
              'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all',
              filter === f.key
                ? 'bg-white text-zinc-800 shadow-card'
                : 'text-zinc-500 hover:text-zinc-500',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-[#E6E8F0] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-[16px_1fr_100px_84px_84px_72px_auto] gap-3 px-4 py-2.5 border-b border-[#E6E8F0] bg-[#FAFBFE]">
          <span />
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Incident</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Site</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Priorité</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Statut</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Date</span>
          <span />
        </div>

        {isLoading ? (
          <div className="divide-y divide-[#EEF0F6]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EEF0F7] animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 bg-[#EEF0F7] rounded animate-pulse" />
                <div className="w-16 h-4 bg-[#EEF0F7] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : incidents?.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500/30 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Aucun incident</p>
            <p className="text-[12px] text-zinc-300 mt-1">Toutes les opérations se déroulent normalement</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0F6]">
            {incidents?.map((incident) => {
              const priority = priorityColors[incident.priority as keyof typeof priorityColors] ?? 'gray';
              const status = statusColors[incident.status as keyof typeof statusColors] ?? 'gray';
              const date = new Date(incident.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

              return (
                <div
                  key={incident.id}
                  onClick={() => setDetailIncident(incident as unknown as IncidentRow)}
                  className="group flex sm:grid sm:grid-cols-[16px_1fr_100px_84px_84px_72px_auto] items-center gap-3 px-4 py-3.5 hover:bg-[#FAFBFE] transition-colors cursor-pointer"
                >
                  {/* Priority dot */}
                  <div className="flex-shrink-0 flex items-center">
                    <div className={[
                      'w-2 h-2 rounded-full',
                      incident.priority === 'critical' ? 'bg-red-400' :
                      incident.priority === 'medium' ? 'bg-amber-400' : 'bg-zinc-600',
                    ].join(' ')} />
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-zinc-800 truncate">{incident.title}</p>
                      {incident.photo_url && (
                        <Image className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                      )}
                    </div>
                    {incident.description && (
                      <p className="text-[12px] text-zinc-400 truncate mt-0.5 hidden sm:block">
                        {incident.description}
                      </p>
                    )}
                  </div>

                  {/* Site */}
                  <span className="hidden sm:block text-[12px] text-zinc-500 truncate">{incident.site}</span>

                  {/* Priority badge */}
                  <span className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
                    <Badge color={priority as 'red' | 'yellow' | 'green'}>
                      {priorityLabels[incident.priority as keyof typeof priorityLabels]}
                    </Badge>
                  </span>

                  {/* Status badge */}
                  <span onClick={(e) => e.stopPropagation()}>
                    <Badge color={status as 'red' | 'yellow' | 'green'}>
                      {statusLabels[incident.status as keyof typeof statusLabels]}
                    </Badge>
                  </span>

                  {/* Date */}
                  <span className="hidden sm:block text-[11px] text-zinc-400 font-mono tabular-nums">{date}</span>

                  {/* Actions */}
                  {incident.status !== 'resolved' && canEdit && (
                    <div
                      className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {incident.status === 'open' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: incident.id, status: 'in_progress' })}
                          className="text-[11px] font-medium text-zinc-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Prendre
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus.mutate({ id: incident.id, status: 'resolved' })}
                        className="text-[11px] font-medium text-zinc-500 hover:text-emerald-600 transition-colors px-2 py-1 rounded hover:bg-emerald-50"
                      >
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
      <Modal
        open={!!detailIncident}
        onClose={() => setDetailIncident(null)}
        title="Détail de l'incident"
        size="lg"
      >
        {detailIncident && (
          <div className="space-y-4">
            {/* Priority + status */}
            <div className="flex items-center gap-2">
              <Badge color={priorityColors[detailIncident.priority as keyof typeof priorityColors] ?? 'gray'}>
                {priorityLabels[detailIncident.priority as keyof typeof priorityLabels] ?? detailIncident.priority}
              </Badge>
              <Badge color={statusColors[detailIncident.status as keyof typeof statusColors] ?? 'gray'} dot>
                {statusLabels[detailIncident.status as keyof typeof statusLabels] ?? detailIncident.status}
              </Badge>
            </div>

            {/* Title */}
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em] mb-1">Incident</p>
              <p className="text-[15px] font-semibold text-zinc-900">{detailIncident.title}</p>
            </div>

            {/* Description */}
            {detailIncident.description && (
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em] mb-1">Description</p>
                <p className="text-[13px] text-zinc-700 leading-relaxed">{detailIncident.description}</p>
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-zinc-400 uppercase tracking-[0.08em] mb-0.5">Site</p>
                <p className="text-[13px] font-medium text-zinc-700">{detailIncident.site}</p>
              </div>
              <div className="bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-zinc-400 uppercase tracking-[0.08em] mb-0.5">Signalé par</p>
                <p className="text-[13px] font-medium text-zinc-700">{detailIncident.reporter?.full_name ?? '—'}</p>
              </div>
              <div className="bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-zinc-400 uppercase tracking-[0.08em] mb-0.5">Signalé le</p>
                <p className="text-[13px] font-medium text-zinc-700">
                  {new Date(detailIncident.created_at).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              {detailIncident.assignee && (
                <div className="bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                  <p className="text-[11px] text-zinc-400 uppercase tracking-[0.08em] mb-0.5">Assigné à</p>
                  <p className="text-[13px] font-medium text-zinc-700">{detailIncident.assignee.full_name}</p>
                </div>
              )}
              {detailIncident.resolved_at && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                  <p className="text-[11px] text-emerald-600 uppercase tracking-[0.08em] mb-0.5">Résolu le</p>
                  <p className="text-[13px] font-medium text-emerald-600">
                    {new Date(detailIncident.resolved_at).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Photo */}
            {detailIncident.photo_url && (
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em] mb-2">Photo</p>
                <img
                  src={detailIncident.photo_url}
                  alt="Photo de l'incident"
                  className="w-full max-h-64 object-cover rounded-xl border border-[#E6E8F0]"
                />
              </div>
            )}

            {/* Actions */}
            {detailIncident.status !== 'resolved' && canEdit && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E8F0]">
                {detailIncident.status === 'open' && (
                  <Button
                    variant="secondary"
                    onClick={() => updateStatus.mutate({ id: detailIncident.id, status: 'in_progress' })}
                    loading={updateStatus.isPending}
                  >
                    Prendre en charge
                  </Button>
                )}
                <Button
                  onClick={() => {
                    updateStatus.mutate({ id: detailIncident.id, status: 'resolved' });
                    setDetailIncident(null);
                  }}
                  loading={updateStatus.isPending}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Marquer résolu
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetCreateForm(); }} title="Signaler un incident" size="lg">
        <div className="space-y-4">
          <div>
            <label className="label-base">Titre</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-base"
              placeholder="Résumé de l'incident"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="label-base">Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'critical' })}
                className="select-base"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyen</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="input-base resize-none"
              placeholder="Décrivez l'incident en détail..."
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="label-base">Photo (optionnel)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Aperçu"
                  className="w-full h-40 object-cover rounded-lg border border-[#E6E8F0]"
                />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-[#EEF0F7] transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-[#E6E8F0] rounded-lg hover:border-[#E6E8F0] hover:bg-[#FAFBFE] transition-all text-zinc-400 hover:text-zinc-500"
              >
                <Image className="w-4 h-4" />
                <span className="text-[13px]">Ajouter une photo</span>
              </button>
            )}
          </div>

          {agents && agents.length > 0 && (
            <div>
              <label className="label-base">Assigner à</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="select-base"
              >
                <option value="">Non assigné</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setModalOpen(false); resetCreateForm(); }}>Annuler</Button>
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!form.title}>
              Signaler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
