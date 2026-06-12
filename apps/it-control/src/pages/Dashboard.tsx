import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import { Badge } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import {
  Users, AlertTriangle, MonitorCheck, Package,
  CheckCircle, XCircle, ArrowUpRight, Clock,
  ShieldCheck, ShieldAlert,
} from 'lucide-react';

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [attendance, openInc, criticalInc, installations, equipment] = await Promise.all([
        // Fetch avec join profiles pour filtrer service !== 'tech'
        supabase.from('attendance')
          .select('id, profiles!user_id(service)')
          .gte('check_in_time', today),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('priority', 'critical').eq('status', 'open'),
        supabase.from('installations').select('status').gte('created_at', today),
        supabase.from('equipment').select('status').eq('status', 'faulty'),
      ]);
      const itAtt = (attendance.data ?? []).filter((r) => {
        const p = r.profiles as { service?: string } | null;
        return p?.service !== 'tech';
      });
      return {
        presentCount: itAtt.length,
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
        .select('id, site, status, check_in_time, profiles(full_name, role, service)')
        .gte('check_in_time', today)
        .order('check_in_time', { ascending: false })
        .limit(20);
      return (data ?? []).filter((r) => {
        const p = r.profiles as { service?: string } | null;
        return p?.service !== 'tech';
      }).slice(0, 6);
    },
  });
}

function useSiteStatuses() {
  return useQuery({
    queryKey: ['site-statuses'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [att, inst, inc, eq] = await Promise.all([
        supabase.from('attendance').select('site, status, profiles!user_id(service)').gte('check_in_time', today),
        supabase.from('installations').select('site, status').gte('created_at', today),
        supabase.from('incidents').select('site').in('status', ['open', 'in_progress']),
        supabase.from('equipment').select('site').eq('status', 'faulty'),
      ]);

      // Ne garder que les agents IT (service !== 'tech')
      const itAtt = (att.data ?? []).filter((a) => {
        const p = a.profiles as { service?: string } | null;
        return p?.service !== 'tech';
      });

      return SITES.map((site) => {
        const siteAtt = itAtt.filter((a) => a.site === site);
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

/* ── Présentation ─────────────────────────────────────────── */

const PANEL    = 'border border-white/[0.07] rounded-lg bg-[#0C0C0E] overflow-hidden';
const PANEL_HD = 'flex items-center justify-between px-4 h-11 border-b border-white/[0.06] flex-shrink-0';
const TH       = 'font-mono text-[9px] tracking-[0.16em] text-zinc-600 uppercase';

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

function Kpi({ value, label, sub, accent, loading }: {
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
    <div className="bg-[#0C0C0E] px-5 py-4">
      <p className={TH}>{label}</p>
      {loading ? (
        <div className="h-7 w-14 bg-white/[0.05] rounded mt-2 animate-pulse" />
      ) : (
        <p className={['mt-2 font-mono text-[26px] tabular-nums leading-none', accent ? accentMap[accent] : 'text-zinc-50'].join(' ')}>
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
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-zinc-50">
            {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Agent'}
          </h1>
          <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-zinc-500 uppercase">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {profile?.site && <span className="text-zinc-600"> · {profile.site}</span>}
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-zinc-600 uppercase pb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Temps réel
        </span>
      </div>

      {/* ── Bandeau d'état ── */}
      {!isLoading && (
        <div className={[
          'flex items-center gap-3 px-4 py-2.5 rounded-lg border text-[12px] bg-[#0C0C0E]',
          isOperational ? 'border-emerald-500/20' : 'border-red-500/25',
        ].join(' ')}>
          {isOperational
            ? <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            : <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />}
          <span className={['font-mono text-[11px] tracking-[0.1em] uppercase font-semibold', isOperational ? 'text-emerald-400' : 'text-red-400'].join(' ')}>
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
        </div>
      )}

      {/* ── KPI ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-white/[0.07] border border-white/[0.07] rounded-lg overflow-hidden">
        <Kpi
          label="Présents aujourd'hui"
          value={stats?.presentCount ?? 0}
          loading={isLoading}
        />
        <Kpi
          label="Incidents ouverts"
          value={stats?.openIncidents ?? 0}
          loading={isLoading}
          accent={stats?.openIncidents ? 'red' : 'green'}
          sub={stats?.criticalIncidents ? `dont ${stats.criticalIncidents} critique(s)` : undefined}
        />
        <Kpi
          label="Installations validées"
          value={isLoading ? '—' : `${validatedCount}/${totalInstallations}`}
          loading={isLoading}
          accent={stats?.installations.some((i) => i.status === 'issue_detected') ? 'yellow' : 'green'}
        />
        <Kpi
          label="Équipements en panne"
          value={stats?.faultyEquipment ?? 0}
          loading={isLoading}
          accent={stats?.faultyEquipment ? 'red' : 'green'}
        />
      </div>

      {/* ── Statut par site ── */}
      {siteStatuses && (
        <div className={PANEL}>
          <div className={PANEL_HD}>
            <span className="text-[13px] font-semibold text-zinc-200">Statut opérationnel par site</span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-600 uppercase">{SITES.length} sites</span>
          </div>
          <div className="hidden sm:grid sm:grid-cols-[10px_1fr_80px_110px_90px_90px] gap-4 px-4 py-2 border-b border-white/[0.05]">
            <span />
            <span className={TH}>Site</span>
            <span className={TH}>Agents</span>
            <span className={TH}>Installation</span>
            <span className={TH}>Incidents</span>
            <span className={TH}>Pannes</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {siteStatuses.map((s) => {
              const dot =
                s.status === 'ok' ? 'bg-emerald-400' :
                s.status === 'alert' ? 'bg-red-400' : 'bg-amber-400';
              return (
                <div
                  key={s.site}
                  className="flex sm:grid sm:grid-cols-[10px_1fr_80px_110px_90px_90px] items-center gap-4 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center">
                    <div className={['w-1.5 h-1.5 rounded-full', dot].join(' ')} />
                  </div>
                  <span className="text-[13px] font-medium text-zinc-300">{s.site}</span>
                  <span className={[
                    'hidden sm:block font-mono text-[12px] tabular-nums',
                    s.presentCount > 0 ? 'text-emerald-400' : 'text-zinc-700',
                  ].join(' ')}>
                    {s.presentCount > 0 ? s.presentCount : '—'}
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
                    'hidden sm:block font-mono text-[12px] tabular-nums',
                    s.openIncidents > 0 ? 'text-red-400' : 'text-zinc-700',
                  ].join(' ')}>
                    {s.openIncidents > 0 ? s.openIncidents : '—'}
                  </span>
                  <span className={[
                    'hidden sm:block font-mono text-[12px] tabular-nums',
                    s.faultyEquipment > 0 ? 'text-amber-400' : 'text-zinc-700',
                  ].join(' ')}>
                    {s.faultyEquipment > 0 ? s.faultyEquipment : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Incidents — 2/3 */}
        <div className={['xl:col-span-2', PANEL].join(' ')}>
          <div className={PANEL_HD}>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-zinc-200">Incidents actifs</span>
              {!!stats?.openIncidents && (
                <span className="font-mono text-[10px] font-semibold bg-red-500/10 text-red-400 ring-1 ring-red-500/20 px-1.5 py-0.5 rounded">
                  {stats.openIncidents}
                </span>
              )}
            </div>
            <Link
              to="/incidents"
              className="flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase text-zinc-600 hover:text-blue-400 transition-colors"
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
                    <div className={['w-1.5 h-1.5 rounded-full flex-shrink-0', dot].join(' ')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-200 truncate">{incident.title}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{incident.site}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge color={statusCfg.color}>{statusCfg.label}</Badge>
                      <span className="font-mono text-[11px] text-zinc-600 tabular-nums hidden sm:inline">
                        {elapsedStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite — 1/3 */}
        <div className="space-y-4">
          {/* Présences */}
          <div className={PANEL}>
            <div className={PANEL_HD}>
              <span className="text-[13px] font-semibold text-zinc-200">Présences</span>
              <Link
                to="/attendance"
                className="flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase text-zinc-600 hover:text-blue-400 transition-colors"
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
                      <div className="w-6 h-6 rounded bg-white/[0.05] border border-white/[0.06] flex items-center justify-center font-mono text-[10px] font-semibold text-zinc-500 flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-300 truncate">{name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge color={cfg.color} dot>{cfg.label}</Badge>
                        <span className="font-mono text-[10px] text-zinc-600 tabular-nums">{time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className={PANEL}>
            <div className={PANEL_HD}>
              <span className="text-[13px] font-semibold text-zinc-200">Actions rapides</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { to: '/attendance',    label: 'Pointer ma présence',       icon: Users        },
                { to: '/installations', label: 'Valider une installation',  icon: MonitorCheck },
                { to: '/incidents',     label: 'Signaler un incident',      icon: AlertTriangle },
                { to: '/equipment',     label: 'Gérer les équipements',     icon: Package      },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" strokeWidth={1.75} />
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
