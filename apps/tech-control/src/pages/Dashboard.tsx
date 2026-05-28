import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import { Badge } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import {
  Users, AlertTriangle, Truck, CheckCircle, XCircle,
  ArrowUpRight, Clock, ShieldCheck, ShieldAlert, Activity,
} from 'lucide-react';

function useDashboardStats() {
  return useQuery({
    queryKey: ['tech-dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [attendanceRes, openInt, criticalInt, gse] = await Promise.all([
        supabase.from('attendance')
          .select('id, profiles!user_id(role, service)')
          .gte('check_in_time', today),
        supabase.from('gse_incidents').select('*', { count: 'exact', head: true }).in('status', ['ouvert', 'en_cours']),
        supabase.from('gse_incidents').select('*', { count: 'exact', head: true }).eq('priority', 'critique').eq('status', 'ouvert'),
        supabase.from('gse_equipment').select('statut'),
      ]);
      const att = (attendanceRes.data ?? []).filter((r) => {
        const p = r.profiles as { role: string; service?: string } | null;
        return p?.service !== 'it';
      });
      const gseData = gse.data ?? [];
      return {
        presentCount:      att.length,
        openInterventions: openInt.count ?? 0,
        criticalCount:     criticalInt.count ?? 0,
        gseTotal:          gseData.length,
        gseOperational:    gseData.filter((g) => g.statut === 'op').length,
        gseFaulty:         gseData.filter((g) => g.statut === 'inop').length,
      };
    },
    refetchInterval: 20_000,
  });
}

function useRecentInterventions() {
  return useQuery({
    queryKey: ['recent-interventions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gse_incidents')
        .select('id, title, site, priority, status, created_at, reporter:profiles!reporter_id(full_name)')
        .in('status', ['ouvert', 'en_cours'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(7);
      return (data ?? []) as unknown as Array<{
        id: string; title: string; site: string;
        priority: string; status: string; created_at: string;
        reporter: { full_name: string } | null;
      }>;
    },
    refetchInterval: 15_000,
  });
}

function useRecentAttendance() {
  return useQuery({
    queryKey: ['tech-recent-attendance'],
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
        return p?.service !== 'it';
      }).slice(0, 6);
    },
  });
}

function useGseBysite() {
  return useQuery({
    queryKey: ['gse-by-site'],
    queryFn: async () => {
      const [gse, att, inc] = await Promise.all([
        supabase.from('gse_equipment').select('site, statut'),
        supabase.from('attendance').select('site, status, profiles!user_id(role, service)').gte('check_in_time', new Date().toISOString().split('T')[0]),
        supabase.from('gse_incidents').select('site').in('status', ['ouvert', 'en_cours']),
      ]);
      return SITES.map((site) => {
        const siteGse = (gse.data ?? []).filter((g) => g.site === site);
        const allAtt  = (att.data ?? []).filter((a) => a.site === site);
        const siteAtt = allAtt.filter((a) => {
          const p = a.profiles as { service?: string } | null;
          return p?.service !== 'it';
        });
        const siteInc = (inc.data ?? []).filter((i) => i.site === site);
        const operational = siteGse.filter((g) => g.statut === 'op').length;
        const faulty      = siteGse.filter((g) => g.statut === 'inop').length;
        const present     = siteAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
        return { site, total: siteGse.length, operational, faulty, present, openIncidents: siteInc.length };
      });
    },
    refetchInterval: 30_000,
  });
}

function Metric({ value, label, sub, accent, loading }: {
  value: string | number; label: string; sub?: string;
  accent?: 'red' | 'green' | 'blue' | 'orange'; loading?: boolean;
}) {
  const accentMap = {
    red:    'text-red-400',
    green:  'text-emerald-400',
    blue:   'text-blue-400',
    orange: 'text-orange-500',
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 shadow-card">
      <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-[0.08em] mb-2">{label}</p>
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

const PRIORITY_DOT: Record<string, string> = {
  critique: 'bg-red-400', moyen: 'bg-amber-400', faible: 'bg-zinc-600',
};
const STATUS_CFG = {
  ouvert:   { color: 'red'    as const, label: 'Ouvert'   },
  en_cours: { color: 'yellow' as const, label: 'En cours' },
  resolu:   { color: 'green'  as const, label: 'Résolu'   },
};
const ATT_CFG = {
  present: { color: 'green'  as const, label: 'Présent'   },
  late:    { color: 'yellow' as const, label: 'En retard' },
  absent:  { color: 'red'    as const, label: 'Absent'    },
};

export function Dashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: interventions }    = useRecentInterventions();
  const { data: attendance }       = useRecentAttendance();
  const { data: siteSummary }      = useGseBysite();

  const isOperational = (stats?.presentCount ?? 0) > 0 && (stats?.criticalCount ?? 0) === 0 && (stats?.gseFaulty ?? 0) === 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-50 tracking-tight">
            {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Agent'}
          </h1>
          <p className="text-[13px] text-zinc-600 mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {profile?.site && <span className="text-zinc-700"> · {profile.site}</span>}
          </p>
        </div>
      </div>

      {/* Status bar */}
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
            {isOperational ? 'Opérations normales' : 'Attention requise'}
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
              {(stats?.gseFaulty ?? 0) === 0
                ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                : <XCircle className="w-3 h-3 text-amber-500" />}
              {stats?.gseFaulty ?? 0} GSE INOP
            </span>
            <span className="flex items-center gap-1.5">
              {(stats?.criticalCount ?? 0) === 0
                ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                : <XCircle className="w-3 h-3 text-red-500" />}
              {(stats?.criticalCount ?? 0) === 0 ? 'Aucune intervention critique' : `${stats?.criticalCount} critique(s)`}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-zinc-700">
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px]">Temps réel</span>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric label="Présents aujourd'hui" value={stats?.presentCount ?? 0} loading={isLoading} accent="blue" />
        <Metric
          label="Interventions ouvertes"
          value={stats?.openInterventions ?? 0}
          loading={isLoading}
          accent={stats?.openInterventions ? 'red' : 'green'}
          sub={stats?.criticalCount ? `dont ${stats.criticalCount} critique(s)` : undefined}
        />
        <Metric
          label="GSE opérationnels"
          value={isLoading ? '—' : `${stats?.gseOperational ?? 0}/${stats?.gseTotal ?? 0}`}
          loading={isLoading}
          accent={stats?.gseFaulty ? 'orange' : 'green'}
        />
        <Metric
          label="GSE INOP"
          value={stats?.gseFaulty ?? 0}
          loading={isLoading}
          accent={stats?.gseFaulty ? 'red' : 'green'}
        />
      </div>

      {/* Per-site summary */}
      {siteSummary && (
        <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <span className="text-[13px] font-semibold text-zinc-200">Statut par site</span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-600">
              <Activity className="w-3 h-3" /> Temps réel
            </span>
          </div>
          <div className="hidden sm:grid sm:grid-cols-[10px_1fr_70px_100px_90px_80px] gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-950">
            <span /><span className="th">Site</span><span className="th">Agents</span>
            <span className="th">GSE total</span><span className="th">INOP</span><span className="th">Interventions</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {siteSummary.map((s) => (
              <div key={s.site} className="flex sm:grid sm:grid-cols-[10px_1fr_70px_100px_90px_80px] items-center gap-4 px-4 py-2.5 hover:bg-zinc-950 transition-colors">
                <div className="flex-shrink-0">
                  <div className={['w-1.5 h-1.5 rounded-full', s.faulty > 0 || s.openIncidents > 0 ? 'bg-red-400' : s.present === 0 ? 'bg-amber-400' : 'bg-emerald-400'].join(' ')} />
                </div>
                <span className="text-[13px] font-medium text-zinc-300">{s.site}</span>
                <span className={['hidden sm:block text-[12px] tabular-nums font-medium', s.present > 0 ? 'text-emerald-400' : 'text-zinc-600'].join(' ')}>
                  {s.present > 0 ? `${s.present}` : '—'}
                </span>
                <span className="hidden sm:block text-[12px] tabular-nums text-zinc-400">{s.total > 0 ? s.total : '—'}</span>
                <span className={['hidden sm:block text-[12px] tabular-nums font-medium', s.faulty > 0 ? 'text-red-400' : 'text-zinc-600'].join(' ')}>
                  {s.faulty > 0 ? s.faulty : '—'}
                </span>
                <span className={['hidden sm:block text-[12px] tabular-nums font-medium', s.openIncidents > 0 ? 'text-amber-400' : 'text-zinc-600'].join(' ')}>
                  {s.openIncidents > 0 ? s.openIncidents : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Interventions */}
        <div className="xl:col-span-2 border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-zinc-200">Interventions actives</span>
              {!!stats?.openInterventions && (
                <span className="text-[10px] font-bold bg-red-500/10 text-red-400 ring-1 ring-red-500/20 px-1.5 py-0.5 rounded-full">
                  {stats.openInterventions}
                </span>
              )}
            </div>
            <Link to="/interventions" className="flex items-center gap-1 text-[12px] text-zinc-600 hover:text-orange-500 transition-colors">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {!interventions?.length ? (
            <div className="py-14 text-center">
              <CheckCircle className="w-7 h-7 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-500 font-medium">Aucune intervention active</p>
              <p className="text-[12px] text-zinc-700 mt-1">Toutes les opérations se déroulent normalement</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {interventions.map((item) => {
                const dot = PRIORITY_DOT[item.priority] ?? 'bg-zinc-600';
                const cfg = STATUS_CFG[item.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.ouvert;
                const elapsed = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 60000);
                const elapsedStr = elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h${elapsed % 60 > 0 ? String(elapsed % 60).padStart(2, '0') : ''}`;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-950 transition-colors">
                    <div className={['w-2 h-2 rounded-full flex-shrink-0', dot].join(' ')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-200 truncate">{item.title}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{item.site}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge color={cfg.color}>{cfg.label}</Badge>
                      <span className="text-[11px] text-zinc-700 font-mono tabular-nums hidden sm:inline">{elapsedStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Attendance */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800 bg-zinc-950">
              <span className="text-[13px] font-semibold text-zinc-200">Présences</span>
              <Link to="/attendance" className="flex items-center gap-1 text-[12px] text-zinc-600 hover:text-orange-500 transition-colors">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {!attendance?.length ? (
              <div className="py-10 text-center">
                <Clock className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-[12px] text-zinc-600">Aucun pointage aujourd'hui</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {attendance.map((r) => {
                  const name = (r.profiles as { full_name: string } | null)?.full_name ?? '—';
                  const cfg  = ATT_CFG[r.status as keyof typeof ATT_CFG] ?? ATT_CFG.present;
                  const time = new Date(r.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-950 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0">
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
          <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-card bg-zinc-900">
            <div className="px-4 py-3.5 border-b border-zinc-800 bg-zinc-950">
              <span className="text-[13px] font-semibold text-zinc-200">Actions rapides</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {[
                { to: '/attendance',    label: 'Pointer ma présence',       icon: Users         },
                { to: '/gse',           label: 'Voir les équipements GSE',  icon: Truck         },
                { to: '/interventions', label: 'Signaler une intervention', icon: AlertTriangle },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-950 transition-colors group">
                    <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                    <span className="text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors">{item.label}</span>
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
