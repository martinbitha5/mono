import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import { Badge } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import {
  Users, AlertTriangle, MonitorCheck, Package,
  CheckCircle, XCircle, ArrowUpRight, Clock,
  ShieldCheck, ShieldAlert, Activity,
} from 'lucide-react';

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [attendance, openInc, criticalInc, installations, equipment] = await Promise.all([
        supabase.from('attendance').select('*', { count: 'exact', head: true }).gte('check_in_time', today),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('priority', 'critical').eq('status', 'open'),
        supabase.from('installations').select('status').gte('created_at', today),
        supabase.from('equipment').select('status').eq('status', 'faulty'),
      ]);
      return {
        presentCount: attendance.count ?? 0,
        openIncidents: openInc.count ?? 0,
        criticalIncidents: criticalInc.count ?? 0,
        installations: installations.data ?? [],
        faultyEquipment: equipment.data?.length ?? 0,
      };
    },
    refetchInterval: 20_000,
  });
}

function useRecentIncidents() {
  return useQuery({
    queryKey: ['recent-incidents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('incidents')
        .select('id, title, site, priority, status, created_at, reporter:profiles!reported_by(full_name)')
        .in('status', ['open', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(7);
      return data ?? [];
    },
    refetchInterval: 15_000,
  });
}

function useRecentAttendance() {
  return useQuery({
    queryKey: ['recent-attendance'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('attendance')
        .select('id, site, status, check_in_time, profiles(full_name, role)')
        .gte('check_in_time', today)
        .order('check_in_time', { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });
}

function useSiteStatuses() {
  return useQuery({
    queryKey: ['site-statuses'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [att, inst, inc, eq] = await Promise.all([
        supabase.from('attendance').select('site, status').gte('check_in_time', today),
        supabase.from('installations').select('site, status').gte('created_at', today),
        supabase.from('incidents').select('site').in('status', ['open', 'in_progress']),
        supabase.from('equipment').select('site').eq('status', 'faulty'),
      ]);

      return SITES.map((site) => {
        const siteAtt = att.data?.filter((a) => a.site === site) ?? [];
        const siteInst = inst.data?.filter((i) => i.site === site) ?? [];
        const siteInc = inc.data?.filter((i) => i.site === site) ?? [];
        const siteEq = eq.data?.filter((e) => e.site === site) ?? [];

        const isValidated = siteInst.length > 0 && siteInst.every((i) => i.status === 'validated');
        const hasIssue = siteInst.some((i) => i.status === 'issue_detected');
        const presentCount = siteAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
        const allGood =
          presentCount > 0 &&
          (siteInst.length === 0 || isValidated) &&
          siteInc.length === 0 &&
          siteEq.length === 0;

        return {
          site,
          presentCount,
          isValidated,
          hasIssue,
          hasInstallation: siteInst.length > 0,
          openIncidents: siteInc.length,
          faultyEquipment: siteEq.length,
          status: allGood ? 'ok' : (presentCount === 0 || siteInc.length > 0 || siteEq.length > 0 || hasIssue ? 'alert' : 'warn'),
        };
      });
    },
    refetchInterval: 30_000,
  });
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-zinc-600',
};

const STATUS_CFG = {
  open: { color: 'red' as const, label: 'Ouvert' },
  in_progress: { color: 'yellow' as const, label: 'En cours' },
  resolved: { color: 'green' as const, label: 'Résolu' },
};

const ATT_CFG = {
  present: { color: 'green' as const, label: 'Présent' },
  late: { color: 'yellow' as const, label: 'En retard' },
  absent: { color: 'red' as const, label: 'Absent' },
};

function Metric({
  value,
  label,
  sub,
  accent,
  loading,
}: {
  value: string | number;
  label: string;
  sub?: string;
  accent?: 'red' | 'green' | 'blue' | 'yellow';
  loading?: boolean;
}) {
  const accentMap = {
    red: 'text-red-400',
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    yellow: 'text-amber-400',
  };

  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-xl px-5 py-4">
      <p className="text-[12px] font-medium text-zinc-600 uppercase tracking-[0.08em] mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
      ) : (
        <p className={['text-[28px] font-bold leading-none tabular-nums', accent ? accentMap[accent] : 'text-zinc-50'].join(' ')}>
          {value}
        </p>
      )}
      {sub && !loading && <p className="text-[11px] text-zinc-600 mt-1.5">{sub}</p>}
    </div>
  );
}

export function Dashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: incidents } = useRecentIncidents();
  const { data: attendance } = useRecentAttendance();
  const { data: siteStatuses } = useSiteStatuses();

  const validatedCount = stats?.installations.filter((i) => i.status === 'validated').length ?? 0;
  const totalInstallations = stats?.installations.length ?? 0;
  const isOperational = (stats?.presentCount ?? 0) > 0 && (stats?.criticalIncidents ?? 0) === 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">
            {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Agent'}
          </h1>
          <p className="text-[13px] text-zinc-600 mt-1">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {profile?.site && (
              <span className="text-zinc-700"> · {profile.site}</span>
            )}
          </p>
        </div>
      </div>

      {/* Operational status bar */}
      {!isLoading && (
        <div className={[
          'flex items-center gap-3 px-4 py-3 rounded-xl border text-[12px]',
          isOperational
            ? 'bg-emerald-500/[0.04] border-emerald-500/15'
            : 'bg-red-500/[0.04] border-red-500/15',
        ].join(' ')}>
          {isOperational
            ? <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            : <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />}
          <span className={['font-semibold', isOperational ? 'text-emerald-400' : 'text-red-400'].join(' ')}>
            {isOperational ? 'Système opérationnel' : 'Attention requise'}
          </span>
          <span className="text-zinc-700 hidden sm:inline">·</span>
          <div className="hidden sm:flex items-center gap-4 text-zinc-500">
            <span className="flex items-center gap-1.5">
              {(stats?.presentCount ?? 0) > 0
                ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                : <XCircle className="w-3 h-3 text-red-500" />}
              {stats?.presentCount ?? 0} agent(s) présent(s)
            </span>
            <span className="flex items-center gap-1.5">
              {(stats?.criticalIncidents ?? 0) === 0
                ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                : <XCircle className="w-3 h-3 text-red-500" />}
              {(stats?.criticalIncidents ?? 0) === 0
                ? 'Aucun incident critique'
                : `${stats?.criticalIncidents} critique(s)`}
            </span>
            {totalInstallations > 0 && (
              <span className="flex items-center gap-1.5">
                {validatedCount === totalInstallations
                  ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                  : <XCircle className="w-3 h-3 text-amber-500" />}
                {validatedCount}/{totalInstallations} installations
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-zinc-700">
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px]">Temps réel</span>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric
          label="Présents aujourd'hui"
          value={stats?.presentCount ?? 0}
          loading={isLoading}
          accent="blue"
        />
        <Metric
          label="Incidents ouverts"
          value={stats?.openIncidents ?? 0}
          loading={isLoading}
          accent={stats?.openIncidents ? 'red' : 'green'}
          sub={stats?.criticalIncidents ? `dont ${stats.criticalIncidents} critique(s)` : undefined}
        />
        <Metric
          label="Installations validées"
          value={isLoading ? '—' : `${validatedCount}/${totalInstallations}`}
          loading={isLoading}
          accent={stats?.installations.some((i) => i.status === 'issue_detected') ? 'yellow' : 'green'}
        />
        <Metric
          label="Équipements en panne"
          value={stats?.faultyEquipment ?? 0}
          loading={isLoading}
          accent={stats?.faultyEquipment ? 'red' : 'green'}
        />
      </div>

      {/* Per-site status table */}
      {siteStatuses && (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-white/[0.01]">
            <span className="text-[13px] font-semibold text-zinc-200">Statut opérationnel par site</span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-700">
              <Activity className="w-3 h-3" />
              Temps réel
            </span>
          </div>
          <div className="hidden sm:grid sm:grid-cols-[10px_1fr_70px_100px_90px_80px] gap-4 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01]">
            <span />
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Site</span>
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Agents</span>
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Installation</span>
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Incidents</span>
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.08em]">Pannes</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {siteStatuses.map((s) => {
              const dot =
                s.status === 'ok' ? 'bg-emerald-400' :
                s.status === 'alert' ? 'bg-red-400' : 'bg-amber-400';
              return (
                <div
                  key={s.site}
                  className="flex sm:grid sm:grid-cols-[10px_1fr_70px_100px_90px_80px] items-center gap-4 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center">
                    <div className={['w-1.5 h-1.5 rounded-full', dot].join(' ')} />
                  </div>
                  <span className="text-[13px] font-medium text-zinc-300">{s.site}</span>
                  <span className={[
                    'hidden sm:block text-[12px] tabular-nums font-medium',
                    s.presentCount > 0 ? 'text-emerald-400' : 'text-zinc-700',
                  ].join(' ')}>
                    {s.presentCount > 0 ? `${s.presentCount} agent${s.presentCount > 1 ? 's' : ''}` : '—'}
                  </span>
                  <span className="hidden sm:flex items-center">
                    {!s.hasInstallation ? (
                      <span className="text-[11px] text-zinc-700">—</span>
                    ) : s.isValidated ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Validée
                      </span>
                    ) : s.hasIssue ? (
                      <span className="flex items-center gap-1 text-[11px] text-red-400">
                        <XCircle className="w-3.5 h-3.5" /> Problème
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-600">En attente</span>
                    )}
                  </span>
                  <span className={[
                    'hidden sm:block text-[12px] tabular-nums font-medium',
                    s.openIncidents > 0 ? 'text-red-400' : 'text-zinc-700',
                  ].join(' ')}>
                    {s.openIncidents > 0 ? `${s.openIncidents} ouvert${s.openIncidents > 1 ? 's' : ''}` : '—'}
                  </span>
                  <span className={[
                    'hidden sm:block text-[12px] tabular-nums font-medium',
                    s.faultyEquipment > 0 ? 'text-amber-400' : 'text-zinc-700',
                  ].join(' ')}>
                    {s.faultyEquipment > 0 ? `${s.faultyEquipment} en panne` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Incidents table — 2/3 */}
        <div className="xl:col-span-2 border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-zinc-200">Incidents actifs</span>
              {!!stats?.openIncidents && (
                <span className="text-[10px] font-bold bg-red-500/10 text-red-400 ring-1 ring-red-500/20 px-1.5 py-0.5 rounded-full leading-none">
                  {stats.openIncidents}
                </span>
              )}
            </div>
            <Link
              to="/incidents"
              className="flex items-center gap-1 text-[12px] text-zinc-600 hover:text-blue-400 transition-colors"
            >
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {incidents?.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle className="w-7 h-7 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-500 font-medium">Aucun incident actif</p>
              <p className="text-[12px] text-zinc-700 mt-1">Toutes les opérations se déroulent normalement</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {incidents?.map((incident) => {
                const dot = PRIORITY_DOT[incident.priority] ?? 'bg-zinc-600';
                const statusCfg = STATUS_CFG[incident.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.open;
                const elapsed = Math.floor((Date.now() - new Date(incident.created_at).getTime()) / 60000);
                const elapsedStr = elapsed < 60
                  ? `${elapsed}m`
                  : `${Math.floor(elapsed / 60)}h${elapsed % 60 > 0 ? `${String(elapsed % 60).padStart(2, '0')}` : ''}`;

                return (
                  <div key={incident.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={['w-2 h-2 rounded-full flex-shrink-0', dot].join(' ')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-200 truncate">{incident.title}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{incident.site}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge color={statusCfg.color}>{statusCfg.label}</Badge>
                      <span className="text-[11px] text-zinc-700 font-mono tabular-nums hidden sm:inline">
                        {elapsedStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-4">
          {/* Attendance */}
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] bg-white/[0.01]">
              <span className="text-[13px] font-semibold text-zinc-200">Présences</span>
              <Link
                to="/attendance"
                className="flex items-center gap-1 text-[12px] text-zinc-600 hover:text-blue-400 transition-colors"
              >
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {!attendance?.length ? (
              <div className="py-10 text-center">
                <Clock className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-[12px] text-zinc-600">Aucun pointage aujourd'hui</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {attendance.map((record) => {
                  const name = (record.profiles as { full_name: string } | null)?.full_name ?? '—';
                  const cfg = ATT_CFG[record.status as keyof typeof ATT_CFG] ?? ATT_CFG.present;
                  const time = new Date(record.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={record.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-300 truncate">{name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge color={cfg.color} dot>{cfg.label}</Badge>
                        <span className="text-[10px] text-zinc-700 font-mono">{time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.05] bg-white/[0.01]">
              <span className="text-[13px] font-semibold text-zinc-200">Actions rapides</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { to: '/attendance', label: 'Pointer ma présence', icon: Users },
                { to: '/installations', label: 'Valider une installation', icon: MonitorCheck },
                { to: '/incidents', label: 'Signaler un incident', icon: AlertTriangle },
                { to: '/equipment', label: 'Gérer les équipements', icon: Package },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    <span className="text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      {item.label}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 ml-auto transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
