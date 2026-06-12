import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Button, Badge, Modal } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import { Plus, Package, Search, History, UserCheck, RotateCcw, Wrench, Download } from 'lucide-react';

type EquipmentStatusFilter = 'functional' | 'faulty' | 'out_of_service' | 'all';

function useEquipment(site: string, status: EquipmentStatusFilter) {
  return useQuery({
    queryKey: ['equipment', site, status],
    queryFn: async () => {
      let q = supabase
        .from('equipment')
        .select('*, assignee:profiles!assigned_to(id, full_name, site, role)')
        .order('created_at', { ascending: false });
      if (site !== 'all') q = q.eq('site', site);
      if (status !== 'all') q = q.eq('status', status);
      const { data } = await q;
      return data ?? [];
    },
  });
}

function useAgents() {
  return useQuery({
    queryKey: ['agents-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, site, role')
        .in('role', ['it_agent', 'supervisor'])
        .eq('status', 'active')
        .order('full_name');
      return data ?? [];
    },
  });
}

function useEquipmentLogs(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment-logs', equipmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment_logs')
        .select('*')
        .eq('equipment_id', equipmentId!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!equipmentId,
  });
}

const statusColors = { functional: 'green', faulty: 'red', out_of_service: 'gray' } as const;
const statusLabels = { functional: 'Fonctionnel', faulty: 'En panne', out_of_service: 'Hors service' };
const availLabels = { available: 'Disponible', assigned: 'Attribué' };
const statusDots = { functional: 'bg-emerald-400', faulty: 'bg-red-400', out_of_service: 'bg-zinc-500' };
const typeLabels: Record<string, string> = {
  communication: 'Communication',
  IT: 'IT',
  network: 'Réseau',
  other: 'Autre',
};

const logActionLabels: Record<string, string> = {
  created: 'Créé',
  assigned: 'Attribué',
  returned: 'Retourné au pool',
  faulty: 'Panne signalée',
  repaired: 'Réparé',
};
const logActionColors: Record<string, string> = {
  created: 'text-zinc-500',
  assigned: 'text-blue-600',
  returned: 'text-zinc-500',
  faulty: 'text-red-600',
  repaired: 'text-emerald-600',
};

type EquipmentRow = {
  id: string;
  name: string;
  type: string;
  serial_number: string | null;
  site: string;
  status: string;
  availability: string;
  assigned_to: string | null;
  notes: string | null;
  marque: string | null;
  designation: string | null;
  description: string | null;
  adresse_mac: string | null;
  affectation: string | null;
  proprietaire: string | null;
  created_at: string;
  updated_at: string;
  assignee: { id: string; full_name: string; site: string; role: string } | null;
};

const emptyForm = {
  name: '',           // maps to "Désignation *" field
  marque: '',
  serial_number: '',
  type: 'IT' as 'communication' | 'IT' | 'network' | 'other',
  site: '',
  adresse_mac: '',
  proprietaire: '',
  affectation: '',
  description: '',
  notes: '',
};

export function EquipmentPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [siteFilter, setSiteFilter] = useState(profile?.site ?? 'all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatusFilter>('all');
  const [search, setSearch] = useState('');

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [assignModal, setAssignModal] = useState<string | null>(null);  // equipmentId
  const [selectedAgent, setSelectedAgent] = useState('');
  const [logsModal, setLogsModal] = useState<string | null>(null);      // equipmentId
  const [logsEqName, setLogsEqName] = useState('');
  const [detailEq, setDetailEq] = useState<EquipmentRow | null>(null);  // for detail modal

  const { data: equipment, isLoading } = useEquipment(siteFilter, statusFilter);
  const { data: agents } = useAgents();
  const { data: logs } = useEquipmentLogs(logsModal);

  const filtered = equipment?.filter((e) =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.marque ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.serial_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.designation ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const canManage = profile?.role === 'admin' || profile?.role === 'supervisor';

  const [form, setForm] = useState({
    ...emptyForm,
    site: profile?.site ?? SITES[0],
  });

  // ── Mutations ──────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: inserted, error } = await supabase
        .from('equipment')
        .insert({
          name: form.name,
          type: form.type,
          serial_number: form.serial_number || null,
          site: form.site,
          status: 'functional',
          availability: 'available',
          marque: form.marque || null,
          designation: form.name || null,   // keep designation in sync with name
          description: form.description || null,
          adresse_mac: form.adresse_mac || null,
          affectation: form.affectation || null,
          proprietaire: form.proprietaire || null,
          notes: form.notes || null,
        })
        .select('id')
        .single();
      if (error) throw error;
      if (inserted?.id) {
        await supabase.from('equipment_logs').insert({
          equipment_id: inserted.id,
          action: 'created',
          notes: `Ajouté à l'inventaire`,
          performed_by: user!.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setCreateOpen(false);
      setForm({ ...emptyForm, site: profile?.site ?? SITES[0] });
    },
  });

  const markFaulty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').update({ status: 'faulty' }).eq('id', id);
      if (error) throw error;
      await supabase.from('equipment_logs').insert({
        equipment_id: id,
        action: 'faulty',
        notes: 'Panne signalée',
        performed_by: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['site-statuses'] });
      // Update detail modal if open
      setDetailEq((prev) => prev ? { ...prev, status: 'faulty' } : null);
    },
  });

  const markRepaired = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').update({ status: 'functional' }).eq('id', id);
      if (error) throw error;
      await supabase.from('equipment_logs').insert({
        equipment_id: id,
        action: 'repaired',
        notes: 'Réparé',
        performed_by: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['site-statuses'] });
      setDetailEq((prev) => prev ? { ...prev, status: 'functional' } : null);
    },
  });

  const assignEquipment = useMutation({
    mutationFn: async ({ equipmentId, agentId }: { equipmentId: string; agentId: string }) => {
      const { error } = await supabase
        .from('equipment')
        .update({ assigned_to: agentId, availability: 'assigned' })
        .eq('id', equipmentId);
      if (error) throw error;
      await supabase.from('equipment_logs').insert({
        equipment_id: equipmentId,
        user_id: agentId,
        action: 'assigned',
        notes: `Attribué à un agent`,
        performed_by: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setAssignModal(null);
      setSelectedAgent('');
      setDetailEq(null);
    },
  });

  const returnToPool = useMutation({
    mutationFn: async (id: string) => {
      const current = equipment?.find((e) => e.id === id);
      const previousAgent = current?.assigned_to ?? null;
      const { error } = await supabase
        .from('equipment')
        .update({ assigned_to: null, availability: 'available' })
        .eq('id', id);
      if (error) throw error;
      await supabase.from('equipment_logs').insert({
        equipment_id: id,
        user_id: previousAgent,
        action: 'returned',
        notes: 'Retourné au pool',
        performed_by: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setDetailEq((prev) => prev ? { ...prev, assigned_to: null, availability: 'available', assignee: null } : null);
    },
  });

  // ── Download Excel (ExcelJS) ────────────────────────────────────────────
  const downloadInventory = async () => {
    const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
      import('exceljs'),
      import('file-saver'),
    ]);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inventaire', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });
    ws.columns = [
      { header: 'Désignation',    key: 'name',    width: 26 },
      { header: 'Marque',         key: 'marque',  width: 15 },
      { header: 'Type',           key: 'type',    width: 16 },
      { header: 'N° de Série',   key: 'serial',  width: 20 },
      { header: 'Site',           key: 'site',    width: 14 },
      { header: 'Statut',        key: 'status',  width: 16 },
      { header: 'Disponibilité', key: 'avail',   width: 16 },
      { header: 'Attribué à',    key: 'assign',  width: 26 },
      { header: 'Adresse MAC',   key: 'mac',     width: 20 },
      { header: 'Propriétaire',  key: 'owner',   width: 20 },
      { header: 'Affectation',   key: 'affect',  width: 20 },
      { header: 'Notes',          key: 'notes',   width: 30 },
      { header: 'Date création',  key: 'date',    width: 15 },
    ];
    // Header row style
    const hdr = ws.getRow(1);
    hdr.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    hdr.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    hdr.alignment = { vertical: 'middle', horizontal: 'center' };
    hdr.height    = 24;

    (filtered ?? []).forEach((item) => {
      ws.addRow({
        name:   item.name,
        marque: item.marque ?? '',
        type:   typeLabels[item.type] ?? item.type,
        serial: item.serial_number ?? '',
        site:   item.site,
        status: statusLabels[item.status as keyof typeof statusLabels] ?? item.status,
        avail:  availLabels[item.availability as keyof typeof availLabels] ?? item.availability,
        assign: (item.assignee as { full_name: string } | null)?.full_name ?? '',
        mac:    item.adresse_mac ?? '',
        owner:  item.proprietaire ?? '',
        affect: item.affectation ?? '',
        notes:  item.notes ?? '',
        date:   new Date(item.created_at).toLocaleDateString('fr-FR'),
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `inventaire_equipements_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-zinc-900 tracking-tight">Équipements</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {filtered?.length ?? 0} équipement{(filtered?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && filtered && filtered.length > 0 && (
            <Button variant="secondary" size="sm" onClick={downloadInventory}>
              <Download className="w-3.5 h-3.5" />
              Excel
            </Button>
          )}
          {canManage && (
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Désignation, marque, numéro de série..."
            className="input-base pl-9 py-2"
          />
        </div>
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="select-base py-2 w-auto"
        >
          <option value="all">Tous les sites</option>
          {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EquipmentStatusFilter)}
          className="select-base py-2 w-auto"
        >
          <option value="all">Tous les statuts</option>
          <option value="functional">Fonctionnel</option>
          <option value="faulty">En panne</option>
          <option value="out_of_service">Hors service</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-[#E6E8F0] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-[12px_1fr_72px_90px_140px_90px_auto] gap-4 px-4 py-2.5 border-b border-[#E6E8F0] bg-[#FAFBFE]">
          <span />
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Équipement</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Type</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Site</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">N° de série</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Statut</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.08em]">Actions</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-[#EEF0F6]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EEF0F7] animate-pulse" />
                <div className="flex-1 h-4 bg-[#EEF0F7] rounded animate-pulse" />
                <div className="w-20 h-4 bg-[#EEF0F7] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Aucun équipement trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0F6]">
            {filtered?.map((eq) => {
              const statusColor = statusColors[eq.status as keyof typeof statusColors] ?? 'gray';
              const dot = statusDots[eq.status as keyof typeof statusDots] ?? 'bg-zinc-500';
              const assignee = eq.assignee as { id: string; full_name: string } | null;

              return (
                <div
                  key={eq.id}
                  onClick={() => setDetailEq(eq as unknown as EquipmentRow)}
                  className="group flex md:grid md:grid-cols-[12px_1fr_72px_90px_140px_90px_auto] items-center gap-4 px-4 py-3.5 hover:bg-[#FAFBFE] transition-colors cursor-pointer"
                >
                  {/* Status dot */}
                  <div className="flex-shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
                    <div className={['w-2 h-2 rounded-full', dot].join(' ')} />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800 truncate">{eq.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 hidden md:block">
                      {eq.marque && <span>{eq.marque}</span>}
                      {eq.marque && assignee && <span className="mx-1.5 text-zinc-200">·</span>}
                      {assignee && <span className="text-blue-600/80">→ {assignee.full_name}</span>}
                    </p>
                  </div>

                  {/* Type */}
                  <span className="hidden md:block text-[12px] text-zinc-500">
                    {typeLabels[eq.type] ?? eq.type}
                  </span>

                  {/* Site */}
                  <span className="hidden md:block text-[12px] text-zinc-500 truncate">{eq.site}</span>

                  {/* Serial */}
                  <span className="hidden md:block text-[11px] text-zinc-400 font-mono truncate">
                    {eq.serial_number ?? '—'}
                  </span>

                  {/* Status */}
                  <span onClick={(e) => e.stopPropagation()}>
                    <Badge color={statusColor as 'green' | 'red' | 'gray'}>
                      {statusLabels[eq.status as keyof typeof statusLabels]}
                    </Badge>
                  </span>

                  {/* Row actions */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canManage && eq.status === 'functional' && eq.availability === 'available' && (
                      <button
                        onClick={() => { setAssignModal(eq.id); setSelectedAgent(''); }}
                        className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                      >
                        <UserCheck className="w-3 h-3" />
                        Assigner
                      </button>
                    )}
                    {canManage && eq.availability === 'assigned' && eq.status === 'functional' && (
                      <button
                        onClick={() => returnToPool.mutate(eq.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 transition-colors px-2 py-1 rounded hover:bg-[#F4F5FA]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retourner
                      </button>
                    )}
                    {canManage && eq.status === 'functional' && (
                      <button
                        onClick={() => markFaulty.mutate(eq.id)}
                        className="text-[11px] font-medium text-zinc-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                      >
                        Panne
                      </button>
                    )}
                    {canManage && eq.status === 'faulty' && (
                      <button
                        onClick={() => markRepaired.mutate(eq.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-emerald-600 transition-colors px-2 py-1 rounded hover:bg-emerald-50"
                      >
                        <Wrench className="w-3 h-3" />
                        Réparé
                      </button>
                    )}
                    <button
                      onClick={() => { setLogsModal(eq.id); setLogsEqName(eq.name); }}
                      className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors p-1.5 rounded hover:bg-[#F4F5FA]"
                      title="Historique"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      <Modal
        open={!!detailEq}
        onClose={() => setDetailEq(null)}
        title="Détails équipement"
        size="lg"
      >
        {detailEq && (() => {
          const statusColor = statusColors[detailEq.status as keyof typeof statusColors] ?? 'gray';
          const dot = statusDots[detailEq.status as keyof typeof statusDots] ?? 'bg-zinc-500';
          return (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={['w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5', dot].join(' ')} />
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-zinc-900 truncate">{detailEq.name}</p>
                    {detailEq.marque && (
                      <p className="text-[12px] text-zinc-500 mt-0.5">{detailEq.marque}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge color={statusColor as 'green' | 'red' | 'gray'}>
                    {statusLabels[detailEq.status as keyof typeof statusLabels]}
                  </Badge>
                  <Badge color={detailEq.availability === 'available' ? 'green' : 'blue'}>
                    {availLabels[detailEq.availability as keyof typeof availLabels] ?? detailEq.availability}
                  </Badge>
                </div>
              </div>

              {/* Main info grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type', value: typeLabels[detailEq.type] ?? detailEq.type },
                  { label: 'Site', value: detailEq.site },
                  { label: 'N° de série', value: detailEq.serial_number ?? '—', mono: true },
                  { label: 'Adresse MAC', value: detailEq.adresse_mac ?? '—', mono: true },
                  { label: 'Propriétaire', value: detailEq.proprietaire ?? '—' },
                  { label: 'Affectation', value: detailEq.affectation ?? '—' },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-[0.08em] mb-0.5">{label}</p>
                    <p className={['text-[13px] text-zinc-700', mono ? 'font-mono' : ''].join(' ')}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Assignee */}
              <div className="bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.08em] mb-0.5">Attribué à</p>
                <p className="text-[13px] text-zinc-700">
                  {detailEq.assignee
                    ? `${detailEq.assignee.full_name} — ${detailEq.assignee.site}`
                    : <span className="text-zinc-400">Non attribué</span>}
                </p>
              </div>

              {/* Description */}
              {detailEq.description && (
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.08em] mb-1">Description</p>
                  <p className="text-[13px] text-zinc-500 leading-relaxed bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                    {detailEq.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {detailEq.notes && (
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.08em] mb-1">Notes</p>
                  <p className="text-[13px] text-zinc-500 leading-relaxed bg-[#FAFBFE] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                    {detailEq.notes}
                  </p>
                </div>
              )}

              {/* Dates */}
              <p className="text-[11px] text-zinc-300">
                Créé le {new Date(detailEq.created_at).toLocaleDateString('fr-FR')}
                {' · '}
                Mis à jour le {new Date(detailEq.updated_at).toLocaleDateString('fr-FR')}
              </p>

              {/* Actions */}
              {canManage && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#E6E8F0] flex-wrap">
                  {detailEq.status === 'functional' && detailEq.availability === 'available' && (
                    <Button
                      size="sm"
                      onClick={() => { setDetailEq(null); setAssignModal(detailEq.id); setSelectedAgent(''); }}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Attribuer
                    </Button>
                  )}
                  {detailEq.availability === 'assigned' && detailEq.status === 'functional' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => returnToPool.mutate(detailEq.id)}
                      loading={returnToPool.isPending}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retourner au pool
                    </Button>
                  )}
                  {detailEq.status === 'functional' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markFaulty.mutate(detailEq.id)}
                      loading={markFaulty.isPending}
                    >
                      Déclarer en panne
                    </Button>
                  )}
                  {detailEq.status === 'faulty' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => markRepaired.mutate(detailEq.id)}
                      loading={markRepaired.isPending}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Marquer réparé
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDetailEq(null); setLogsModal(detailEq.id); setLogsEqName(detailEq.name); }}
                  >
                    <History className="w-3.5 h-3.5" />
                    Historique
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Ajouter un équipement" size="lg">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {/* Row 1: Marque + N° Série */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Marque *</label>
              <input
                type="text"
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
                className="input-base"
                placeholder="ex. Cisco, HP, Motorola"
              />
            </div>
            <div>
              <label className="label-base">N° de série *</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className="input-base"
                placeholder="Numéro de série unique"
              />
            </div>
          </div>

          {/* Row 2: Désignation (full width) */}
          <div>
            <label className="label-base">Désignation *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-base"
              placeholder="ex. Talkie-walkie, Routeur, Switch réseau"
            />
          </div>

          {/* Row 3: Type + Site */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
                className="select-base"
              >
                <option value="IT">IT</option>
                <option value="network">Réseau</option>
                <option value="communication">Communication</option>
                <option value="other">Autre</option>
              </select>
            </div>
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
          </div>

          {/* Row 4: Adresse MAC + Propriétaire */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Adresse MAC</label>
              <input
                type="text"
                value={form.adresse_mac}
                onChange={(e) => setForm({ ...form, adresse_mac: e.target.value })}
                className="input-base"
                placeholder="AA:BB:CC:DD:EE:FF"
              />
            </div>
            <div>
              <label className="label-base">Propriétaire</label>
              <input
                type="text"
                value={form.proprietaire}
                onChange={(e) => setForm({ ...form, proprietaire: e.target.value })}
                className="input-base"
                placeholder="ex. ATS Handling, Client..."
              />
            </div>
          </div>

          {/* Row 5: Affectation */}
          <div>
            <label className="label-base">Affectation</label>
            <input
              type="text"
              value={form.affectation}
              onChange={(e) => setForm({ ...form, affectation: e.target.value })}
              className="input-base"
              placeholder="Lieu ou service d'affectation"
            />
          </div>

          {/* Row 6: Description */}
          <div>
            <label className="label-base">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="input-base resize-none"
              placeholder="Description détaillée de l'équipement..."
            />
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="label-base">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="input-base resize-none"
              placeholder="Notes optionnelles..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.name || !form.marque || !form.serial_number}
            >
              Ajouter l'équipement
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Assign modal ──────────────────────────────────────────────────── */}
      <Modal
        open={!!assignModal}
        onClose={() => { setAssignModal(null); setSelectedAgent(''); }}
        title="Attribuer l'équipement"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-zinc-500">
            Sélectionnez l'agent qui recevra cet équipement.
          </p>
          <div>
            <label className="label-base">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="select-base"
            >
              <option value="">Sélectionner un agent...</option>
              {agents?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name} — {a.site}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setAssignModal(null); setSelectedAgent(''); }}>
              Annuler
            </Button>
            <Button
              onClick={() => assignModal && selectedAgent && assignEquipment.mutate({ equipmentId: assignModal, agentId: selectedAgent })}
              loading={assignEquipment.isPending}
              disabled={!selectedAgent}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Logs modal ──────────────────────────────────────────────────── */}
      <Modal
        open={!!logsModal}
        onClose={() => setLogsModal(null)}
        title={`Historique — ${logsEqName}`}
        size="lg"
      >
        {!logs || logs.length === 0 ? (
          <div className="py-10 text-center">
            <History className="w-7 h-7 text-zinc-300 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500">Aucun historique disponible</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0F6]">
            {logs.map((log) => {
              const actionLabel = logActionLabels[log.action] ?? log.action;
              const actionColor = logActionColors[log.action] ?? 'text-zinc-500';
              const date = new Date(log.created_at).toLocaleString('fr-FR', {
                day: '2-digit', month: '2-digit', year: '2-digit',
                hour: '2-digit', minute: '2-digit',
              });
              return (
                <div key={log.id} className="flex items-start gap-3 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={['text-[13px] font-medium', actionColor].join(' ')}>
                      {actionLabel}
                    </p>
                    {log.notes && (
                      <p className="text-[12px] text-zinc-400 mt-0.5">{log.notes}</p>
                    )}
                    <p className="text-[11px] text-zinc-300 mt-1">{date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
