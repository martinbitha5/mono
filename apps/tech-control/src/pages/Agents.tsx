import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { supabase } from '@ats/supabase/client';
import { Badge, Modal, Button } from '@ats/ui';
import { SITES } from '@ats/types';
import { useAuth } from '../hooks/useAuth';
import {
  Search, Users, MapPin, Phone, Mail, Briefcase, Calendar,
  Edit2, UserCheck, UserX, Camera, Trash2, Info, Clock, CalendarOff,
} from 'lucide-react';

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > h && w > MAX) { h = (h * MAX) / w; w = MAX; }
      else if (h > MAX)     { w = (w * MAX) / h; h = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg', 0.82,
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function uploadProfilePhoto(userId: string, blob: Blob): Promise<string | null> {
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('profiles')
    .upload(path, blob, { cacheControl: '3600', upsert: true });
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(path);
  return publicUrl;
}

type ProfileRole   = 'admin' | 'supervisor' | 'it_agent' | 'tech_agent';
type ProfileStatus = 'active' | 'inactive';
type ProfileService = 'tech' | 'it' | 'both';
type AttendanceStatus = 'present' | 'late' | 'absent' | 'off';

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  role: ProfileRole;
  service: ProfileService;
  site: string;
  fonction: string | null;
  start_date: string | null;
  status: ProfileStatus;
};

type AttendanceRec = { status: AttendanceStatus; time: string; id: string };

const roleColors: Record<ProfileRole, 'purple' | 'blue' | 'green' | 'yellow'> = {
  admin: 'purple', supervisor: 'blue', it_agent: 'green', tech_agent: 'yellow',
};
const roleLabels: Record<ProfileRole, string> = {
  admin: 'Admin', supervisor: 'Superviseur', it_agent: 'Agent IT', tech_agent: 'Agent Technique',
};
const roleGradients: Record<ProfileRole, string> = {
  admin: 'from-purple-600 to-purple-700',
  supervisor: 'from-blue-600 to-blue-700',
  it_agent: 'from-emerald-600 to-emerald-700',
  tech_agent: 'from-amber-600 to-amber-700',
};
const attendanceColors: Record<AttendanceStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  present: 'green', late: 'yellow', absent: 'red', off: 'gray',
};
const attendanceLabels: Record<AttendanceStatus, string> = {
  present: 'Présent', late: 'En retard', absent: 'Absent', off: 'Off',
};

function getMarkStatus(): 'present' | 'late' {
  const n = new Date();
  return n.getHours() > 9 || (n.getHours() === 9 && n.getMinutes() >= 30) ? 'late' : 'present';
}

function calculateSeniority(startDate: string | null): string {
  if (!startDate) return '—';
  const start = new Date(startDate);
  const now   = new Date();
  let years  = now.getFullYear() - start.getFullYear();
  let months = now.getMonth()    - start.getMonth();
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years  > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mois`);
  return parts.length > 0 ? parts.join(', ') : "Moins d'un mois";
}

function UserAvatar({ user, size = 'md' }: { user: UserRow; size?: 'sm' | 'md' | 'lg' }) {
  const grad = roleGradients[user.role] ?? 'from-amber-600 to-amber-700';
  const dim  = size === 'lg' ? 'w-16 h-16 text-[20px]'
             : size === 'sm' ? 'w-7 h-7 text-[10px]'
             :                 'w-8 h-8 text-[11px]';
  return (
    <div className={`rounded-full bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden ${dim}`}>
      {user.photo_url ? (
        <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <span>{user.full_name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function PhotoPicker({
  preview, currentUrl, onFile, onRemove,
}: {
  preview: string; currentUrl: string | null;
  onFile: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const shown = preview || currentUrl;
  return (
    <div className="flex flex-col items-center gap-1.5 mb-2">
      <div
        onClick={() => ref.current?.click()}
        className="relative w-20 h-20 rounded-full bg-[#EEF0F7] border-2 border-dashed border-[#D8DBE8] hover:border-orange-500 flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
      >
        {shown ? (
          <img src={shown} alt="" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-6 h-6 text-zinc-400" />
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {shown && (
        <button type="button" onClick={onRemove}
          className="text-[11px] text-red-600 hover:text-red-700">
          Supprimer la photo
        </button>
      )}
      <p className="text-[11px] text-zinc-400">Cliquez pour {shown ? 'changer' : 'ajouter'} la photo</p>
    </div>
  );
}

function useAgents() {
  return useQuery({
    queryKey: ['tech-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('service', ['tech', 'both'])
        .order('full_name');
      return (data ?? []) as UserRow[];
    },
  });
}

export function AgentsPage() {
  const { profile: me } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin             = me?.role === 'admin';
  const isAdminOrSupervisor = isAdmin || me?.role === 'supervisor';

  const { data: users, isLoading } = useAgents();

  /* ── Pointage du jour (admin/superviseur seulement) ── */
  const { data: attendanceMap } = useQuery({
    queryKey: ['tech-agents-attendance-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance')
        .select('id, user_id, status, check_in_time')
        .gte('check_in_time', today);
      const map = new Map<string, AttendanceRec>();
      for (const r of (data ?? [])) {
        map.set(r.user_id, { id: r.id, status: r.status as AttendanceStatus, time: r.check_in_time });
      }
      return map;
    },
    enabled: isAdminOrSupervisor,
    refetchInterval: 30_000,
  });

  const markAttendance = useMutation({
    mutationFn: async ({ userId, site, status }: { userId: string; site: string; status: AttendanceStatus }) => {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', userId)
        .gte('check_in_time', today)
        .maybeSingle();

      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('attendance').update({ status } as any).eq('id', existing.id);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('attendance').insert({ user_id: userId, site, status } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-agents-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['tech-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['tech-my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['tech-dashboard-stats'] });
    },
  });

  const [search,     setSearch    ] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users?.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchSite = siteFilter === 'all' || u.site === siteFilter;
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchSite && matchRole;
  });

  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [editUser,   setEditUser   ] = useState<UserRow | null>(null);

  const [editForm, setEditForm] = useState<{
    full_name: string; phone: string; role: ProfileRole; service: ProfileService;
    site: string; fonction: string; start_date: string;
    status: ProfileStatus; photo_url: string | null;
  }>({
    full_name: '', phone: '', role: 'tech_agent', service: 'tech',
    site: SITES[0] as string, fonction: '', start_date: '', status: 'active',
    photo_url: null,
  });
  const [editPhoto,   setEditPhoto  ] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState('');
  const [editError,   setEditError  ] = useState('');
  const [pwNew,       setPwNew      ] = useState('');
  const [pwConfirm,   setPwConfirm  ] = useState('');

  const handleEditPhoto = async (f: File) => {
    const blob = await resizeImage(f).catch(() => f);
    setEditPhoto(f);
    setEditPreview(URL.createObjectURL(blob instanceof Blob ? blob : f));
  };

  const openEdit = (user: UserRow) => {
    setEditForm({
      full_name: user.full_name, phone: user.phone ?? '',
      role: user.role, service: user.service ?? 'tech', site: user.site,
      fonction: user.fonction ?? '', start_date: user.start_date ?? '',
      status: user.status, photo_url: user.photo_url,
    });
    setEditPhoto(null); setEditPreview('');
    setPwNew(''); setPwConfirm('');
    setEditError('');
    setEditUser(user);
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      setEditError('');

      const isOwnProfile = editUser.id === me?.id;
      if (isOwnProfile && pwNew) {
        if (pwNew.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        if (pwNew !== pwConfirm) throw new Error('Les mots de passe ne correspondent pas');
      }

      let photoUrl: string | null = editUser.photo_url;
      if (editPhoto) {
        const blob = await resizeImage(editPhoto).catch(() => editPhoto);
        const url  = await uploadProfilePhoto(editUser.id, blob);
        if (url) photoUrl = url;
      } else if (editForm.photo_url === null) {
        photoUrl = null;
      }

      const { error } = await supabase.from('profiles').update({
        full_name:  editForm.full_name,
        phone:      editForm.phone      || undefined,
        photo_url:  photoUrl,
        role:       editForm.role,
        service:    editForm.service,
        site:       editForm.site,
        start_date: editForm.start_date || undefined,
        status:     editForm.status,
        fonction:   editForm.fonction   || undefined,
      }).eq('id', editUser.id);
      if (error) throw new Error(error.message);

      if (isOwnProfile && pwNew) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: pwNew });
        if (pwErr) throw new Error('Profil mis à jour, mais erreur mot de passe : ' + pwErr.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-users'] });
      setEditUser(null);
    },
    onError: (err: Error) => setEditError(err.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async (user: UserRow) => {
      const next: ProfileStatus = user.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('profiles').update({ status: next }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tech-users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: async (user: UserRow) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('incidents').update({ reported_by: me!.id } as any).eq('reported_by', user.id);
      await supabase.from('incidents').update({ assigned_to: null }).eq('assigned_to', user.id);
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-users'] });
      setDetailUser(null);
    },
  });

  /* ── Grilles CSS ── */
  const gridCols = isAdminOrSupervisor
    ? 'md:grid-cols-[36px_1fr_110px_100px_72px_100px_160px_80px]'
    : 'md:grid-cols-[36px_1fr_110px_100px_72px_120px]';

  /* ── Cellule présence ── */
  function PresenceCell({ user, stopProp = true }: { user: UserRow; stopProp?: boolean }) {
    const rec       = attendanceMap?.get(user.id);
    const isPending = markAttendance.isPending && markAttendance.variables?.userId === user.id;
    const mark      = (status: AttendanceStatus) =>
      markAttendance.mutate({ userId: user.id, site: user.site, status });

    return (
      <div
        className="flex items-center gap-1 flex-wrap"
        onClick={stopProp ? (e) => e.stopPropagation() : undefined}
      >
        {rec ? (
          /* Statut affiché + boutons de bascule */
          <div className="flex items-center gap-1.5">
            <Badge color={attendanceColors[rec.status]} dot>
              {attendanceLabels[rec.status]}
            </Badge>
            {/* Si off ou absent → bouton retour présent */}
            {(rec.status === 'absent' || rec.status === 'off') && (
              <button disabled={isPending} onClick={() => mark(getMarkStatus())}
                className="p-1 rounded-md text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                title="Marquer présent">
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Si présent/retard → bouton absent */}
            {(rec.status === 'present' || rec.status === 'late') && (
              <button disabled={isPending} onClick={() => mark('absent')}
                className="p-1 rounded-md text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                title="Marquer absent">
                <UserX className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Si présent/retard/absent → bouton Off */}
            {rec.status !== 'off' && (
              <button disabled={isPending} onClick={() => mark('off')}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-[#E6E8F0] transition-colors disabled:opacity-40"
                title="Marquer Off (hors vacation)">
                <CalendarOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* Pas encore pointé — 3 boutons */
          <div className="flex items-center gap-1">
            <button disabled={isPending} onClick={() => mark(getMarkStatus())}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                text-emerald-600 hover:bg-emerald-50 border border-emerald-200
                transition-colors disabled:opacity-40"
              title="Marquer présent">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Présent</span>
            </button>
            <button disabled={isPending} onClick={() => mark('absent')}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                text-red-600 hover:bg-red-50 border border-red-200
                transition-colors disabled:opacity-40"
              title="Marquer absent">
              <UserX className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Absent</span>
            </button>
            <button disabled={isPending} onClick={() => mark('off')}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                text-zinc-500 hover:text-zinc-700 hover:bg-[#E6E8F0] border border-[#D8DBE8]
                transition-colors disabled:opacity-40"
              title="Off — pas en vacation">
              <CalendarOff className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Off</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">Agents</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {filtered?.length ?? 0} agent{(filtered?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-orange-700 leading-relaxed">
          Les comptes agents sont créés et gérés depuis <strong className="text-orange-200">IT Control</strong>.
          Les agents ayant un accès au service Technique apparaissent ici automatiquement.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, email..." className="input-base pl-9 py-2" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="select-base py-2 w-auto">
          <option value="all">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Superviseur</option>
          <option value="tech_agent">Agent Technique</option>
          <option value="it_agent">Agent IT</option>
        </select>
        <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="select-base py-2 w-auto">
          <option value="all">Tous les sites</option>
          {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="border border-[#E6E8F0] rounded-xl overflow-hidden shadow-card bg-white">
        {/* Header */}
        <div className={`hidden md:grid gap-4 px-4 py-2.5 border-b border-[#E6E8F0] bg-[#F4F5FA] ${gridCols}`}>
          <span />
          {['Agent', 'Rôle', 'Site', 'Statut', 'Fonction'].map((h) => (
            <span key={h} className="th">{h}</span>
          ))}
          {isAdminOrSupervisor && <span className="th">Présence</span>}
          {isAdminOrSupervisor && <span />}
        </div>

        {isLoading ? (
          <div className="divide-y divide-[#EEF0F6]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EEF0F7] animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 bg-[#EEF0F7] rounded animate-pulse" />
                <div className="w-20 h-5 bg-[#EEF0F7] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Aucun agent trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0F6]">
            {filtered?.map((user) => {
              const rec = attendanceMap?.get(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => setDetailUser(user)}
                  className={`group flex md:grid items-center gap-4 px-4 py-3 hover:bg-[#F4F5FA] transition-colors cursor-pointer ${gridCols}`}
                >
                  <UserAvatar user={user} size="sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium text-zinc-800 truncate">{user.full_name}</p>
                      {/* Indicateur présence mobile */}
                      {isAdminOrSupervisor && rec && (
                        <span className="md:hidden flex-shrink-0">
                          <Badge color={attendanceColors[rec.status]} dot>{attendanceLabels[rec.status]}</Badge>
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-zinc-400 truncate">{user.email}</p>
                  </div>

                  <span><Badge color={roleColors[user.role]}>{roleLabels[user.role]}</Badge></span>

                  <span className="hidden md:block text-[12px] text-zinc-500 truncate">{user.site}</span>

                  <span>
                    <Badge color={user.status === 'active' ? 'green' : 'gray'} dot>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </span>

                  <span className="hidden md:block text-[12px] text-zinc-400 truncate">{user.fonction ?? '—'}</span>

                  {/* Colonne présence (desktop) */}
                  {isAdminOrSupervisor && (
                    <span className="hidden md:flex">
                      <PresenceCell user={user} />
                    </span>
                  )}

                  {/* Actions (edit / toggle / delete) */}
                  {isAdminOrSupervisor && (
                    <span className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(user)}
                        className="p-1.5 rounded-md hover:bg-[#EEF0F7] text-zinc-500 hover:text-zinc-800 transition-colors" title="Modifier">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleStatus.mutate(user)}
                        className={`p-1.5 rounded-md transition-colors ${user.status === 'active'
                          ? 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
                          : 'text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                        title={user.status === 'active' ? 'Désactiver' : 'Activer'}>
                        {user.status === 'active'
                          ? <UserX className="w-3.5 h-3.5" />
                          : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer définitivement ${user.full_name} ?`))
                              deleteUser.mutate(user);
                          }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail modal ── */}
      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title="Fiche agent" size="lg">
        {detailUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <UserAvatar user={detailUser} size="lg" />
              <div className="flex-1">
                <p className="text-[17px] font-bold text-zinc-900">{detailUser.full_name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge color={roleColors[detailUser.role]}>{roleLabels[detailUser.role]}</Badge>
                  <Badge color={detailUser.status === 'active' ? 'green' : 'gray'} dot>
                    {detailUser.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
              {(isAdminOrSupervisor || detailUser.id === me?.id) && (
                <Button size="sm" variant="ghost" onClick={() => { setDetailUser(null); openEdit(detailUser); }}>
                  <Edit2 className="w-3.5 h-3.5" /> Modifier
                </Button>
              )}
            </div>

            {/* Présence du jour — admin/supervisor seulement */}
            {isAdminOrSupervisor && (
              <div className="bg-[#F4F5FA] border border-[#E6E8F0] rounded-xl px-4 py-3.5 space-y-2.5">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Présence aujourd'hui — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {(() => {
                  const rec = attendanceMap?.get(detailUser.id);
                  return (
                    <div className="flex items-center gap-3 flex-wrap">
                      {rec ? (
                        <Badge color={attendanceColors[rec.status]} dot>
                          {attendanceLabels[rec.status]} — {new Date(rec.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                      ) : (
                        <span className="text-[12px] text-zinc-400">Pas encore pointé</span>
                      )}
                      <div className="flex items-center gap-2 ml-auto flex-wrap">
                        <button
                          disabled={markAttendance.isPending}
                          onClick={() => markAttendance.mutate({ userId: detailUser.id, site: detailUser.site, status: getMarkStatus() })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                            text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors disabled:opacity-40"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Présent
                        </button>
                        <button
                          disabled={markAttendance.isPending}
                          onClick={() => markAttendance.mutate({ userId: detailUser.id, site: detailUser.site, status: 'absent' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                            text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-40"
                        >
                          <UserX className="w-3.5 h-3.5" /> Absent
                        </button>
                        <button
                          disabled={markAttendance.isPending}
                          onClick={() => markAttendance.mutate({ userId: detailUser.id, site: detailUser.site, status: 'off' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                            text-zinc-500 hover:bg-[#E6E8F0] border border-[#D8DBE8] transition-colors disabled:opacity-40"
                        >
                          <CalendarOff className="w-3.5 h-3.5" /> Off
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Mail,      label: 'Email',         val: detailUser.email },
                { icon: Phone,     label: 'Téléphone',     val: detailUser.phone || '—' },
                { icon: MapPin,    label: 'Site',          val: detailUser.site },
                { icon: Briefcase, label: 'Fonction',      val: detailUser.fonction || '—' },
                { icon: Calendar,  label: 'Date de début', val: detailUser.start_date ? new Date(detailUser.start_date).toLocaleDateString('fr-FR') : '—' },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="bg-[#F4F5FA] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.08em] mb-1 flex items-center gap-1">
                    <Icon className="w-3 h-3" /> {label}
                  </p>
                  <p className="text-[13px] text-zinc-700 break-all">{val}</p>
                </div>
              ))}
              <div className="bg-[#F4F5FA] border border-[#E6E8F0] rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.08em] mb-1">Ancienneté</p>
                <p className="text-[13px] text-zinc-700">{calculateSeniority(detailUser.start_date)}</p>
              </div>
            </div>

            {isAdmin && detailUser.id !== me?.id && (
              <div className="flex justify-end pt-2 border-t border-[#E6E8F0]">
                <button
                  onClick={() => { if (confirm(`Supprimer définitivement ${detailUser.full_name} ?`)) deleteUser.mutate(detailUser); }}
                  className="text-[12px] text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer l'agent
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Edit modal ── */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Modifier le profil" size="lg">
        {editUser && (
          <div className="space-y-4">
            <PhotoPicker
              preview={editPreview} currentUrl={editForm.photo_url}
              onFile={handleEditPhoto}
              onRemove={() => { setEditPhoto(null); setEditPreview(''); setEditForm((f) => ({ ...f, photo_url: null })); }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label-base">Nom complet *</label>
                <input type="text" value={editForm.full_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="input-base" />
              </div>
              <div>
                <label className="label-base">Téléphone</label>
                <input type="tel" value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+243..." className="input-base" />
              </div>
              <div>
                <label className="label-base">Fonction</label>
                <input type="text" value={editForm.fonction}
                  onChange={(e) => setEditForm((f) => ({ ...f, fonction: e.target.value }))}
                  className="input-base" />
              </div>
              <div>
                <label className="label-base">Rôle</label>
                <select value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as ProfileRole }))}
                  className="select-base" disabled={!isAdmin}>
                  <option value="tech_agent">Agent Technique</option>
                  <option value="supervisor">Superviseur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className="label-base">Accès service</label>
                  <select value={editForm.service}
                    onChange={(e) => setEditForm((f) => ({ ...f, service: e.target.value as ProfileService }))}
                    className="select-base">
                    <option value="tech">Technique uniquement</option>
                    <option value="both">Technique + IT (cross-service)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="label-base">Site</label>
                <select value={editForm.site}
                  onChange={(e) => setEditForm((f) => ({ ...f, site: e.target.value }))}
                  className="select-base">
                  {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Date de début</label>
                <input type="date" value={editForm.start_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="input-base" />
              </div>
              {isAdminOrSupervisor && (
                <div>
                  <label className="label-base">Statut</label>
                  <select value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as ProfileStatus }))}
                    className="select-base">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              )}
            </div>

            {editUser.id === me?.id && (
              <div className="border border-orange-200 bg-orange-50 rounded-xl px-4 py-4 space-y-3">
                <p className="text-[12px] font-semibold text-orange-500 uppercase tracking-[0.08em]">
                  Changer mon mot de passe (optionnel)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-base">Nouveau mot de passe</label>
                    <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)}
                      placeholder="Laisser vide = pas de changement" className="input-base" />
                  </div>
                  <div>
                    <label className="label-base">Confirmer</label>
                    <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)}
                      placeholder="Confirmez le nouveau mot de passe" className="input-base" />
                  </div>
                </div>
                {pwNew && pwNew !== pwConfirm && (
                  <p className="text-[12px] text-red-600">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            )}

            {editError && <p className="text-[12px] text-red-600">{editError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setEditUser(null)}>Annuler</Button>
              <Button
                onClick={() => editMutation.mutate()}
                loading={editMutation.isPending}
                disabled={!editForm.full_name.trim() || (!!pwNew && pwNew !== pwConfirm)}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
