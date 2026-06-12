import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@ats/supabase/client';
import { Badge } from '@ats/ui';
import { useAuth } from '../hooks/useAuth';
import { SITES } from '@ats/types';
import {
  Users, AlertTriangle, Truck, CheckCircle, XCircle,
  ArrowUpRight, Clock, ShieldCheck, ShieldAlert,
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

/* ── Présentation ─────────────────────────────────────────── */

const PANEL    = 'border border-[#E6E8F0] rounded-lg bg-white overflow-hidden';
const PANEL_HD = 'flex items-center justify-between px-4 h-11 border-b border-[#E6E8F0] flex-shrink-0';
const TH       = 'font-mono text-[9px] tracking-[0.16em] text-zinc-400 uppercase';

function Kpi({ value, label, sub, accent, loading }: {
  value: string | number; label: string; sub?: string;
  accent?: 'red' | 'green' | 'blue' | 'orange'; loading?: boolean;
}) {
  const accentMap = {
    red:    'text-red-600',
    green:  'text-emerald-600',
    blue:   'text-blue-600',
    orange: 'text-orange-600',
  };
  return (
    <div className="bg-white px-5 py-4">
      <p className={TH}>{label}</p>
      {loading ? (
        <div className="h-7 w-14 bg-[#F4F5FA] rounded mt-2 animate-pulse" />
      ) : (
        <p className={['mt-2 font-mono text-[26px] tabular-nums leading-none', accent ? accentMap[accent] : 'text-zinc-900'].join(' ')}>
          {value}
        </p>
      )}
      {sub && !loading && <p className="text-[11px] text-zinc-400 mt-1.5">{sub}</p>}
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
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-zinc-900">
            {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Agent'}
          </h1>
          <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-zinc-500 uppercase">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {profile?.site && <span className="text-zinc-400"> · {profile.site}</span>}
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase pb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Temps réel
        </span>
      </div>

      {/* ── Bandeau d'état ── */}
      {!isLoading && (
        <div className={[
          'flex items-center gap-3 px-4 py-2.5 rounded-lg border text-[12px] bg-white',
          isOperational ? 'border-emerald-200' : 'border-red-200',
        ].join(' ')}>
          {isOperational
            ? <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            : <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />}
          <span className={['font-mono text-[11px] tracking-[0.1em] uppercase font-semibold', isOperational ? 'text-emerald-600' : 'text-red-600'].join(' ')}>
            {isOperational ? 'Opérations normales' : 'Attention requise'}
          </span>
          <span className="text-zinc-300 hidden sm:inline">·</span>
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
        </div>
      )}

      {/* ── KPI ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-[#E6E8F0] border border-[#E6E8F0] rounded-lg overflow-hidden">
        <Kpi label="Présents aujourd'hui" value={stats?.presentCount ?? 0} loading={isLoading} />
        <Kpi
          label="Interventions ouvertes"
          value={stats?.openInterventions ?? 0}
          loading={isLoading}
          accent={stats?.openInterventions ? 'red' : 'green'}
          sub={stats?.criticalCount ? `dont ${stats.criticalCount} critique(s)` : undefined}
        />
        <Kpi
          label="GSE opérationnels"
          value={isLoading ? '—' : `${stats?.gseOperational ?? 0}/${stats?.gseTotal ?? 0}`}
          loading={isLoading}
          accent={stats?.gseFaulty ? 'orange' : 'green'}
        />
        <Kpi
          label="GSE INOP"
          value={stats?.gseFaulty ?? 0}
          loading={isLoading}
          accent={stats?.gseFaulty ? 'red' : 'green'}
        />
      </div>

      {/* ── Statut par site ── */}
      {siteSummary && (
        <div className={PANEL}>
          <div className={PANEL_HD}>
            <span className="text-[13px] font-semibold text-zinc-800">Statut par site</span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-400 uppercase">{SITES.length} sites</span>
          </div>
          <div className="hidden sm:grid sm:grid-cols-[10px_1fr_70px_100px_90px_110px] gap-4 px-4 py-2 border-b border-[#E6E8F0]">
            <span /><span className={TH}>Site</span><span className={TH}>Agents</span>
            <span className={TH}>GSE total</span><span className={TH}>INOP</span><span className={TH}>Interventions</span>
          </div>
          <div className="divide-y divide-[#EEF0F6]">
            {siteSummary.map((s) => (
              <div key={s.site} className="flex sm:grid sm:grid-cols-[10px_1fr_70px_100px_90px_110px] items-center gap-4 px-4 py-2.5 hover:bg-[#FAFBFE] transition-colors">
                <div className="flex-shrink-0">
                  <div className={['w-1.5 h-1.5 rounded-full', s.faulty > 0 || s.openIncidents > 0 ? 'bg-red-400' : s.present === 0 ? 'bg-amber-400' : 'bg-emerald-400'].join(' ')} />
                </div>
                <span className="text-[13px] font-medium text-zinc-700">{s.site}</span>
                <span className={['hidden sm:block font-mono text-[12px] tabular-nums', s.present > 0 ? 'text-emerald-600' : 'text-zinc-300'].join(' ')}>
                  {s.present > 0 ? s.present : '—'}
                </span>
                <span className="hidden sm:block font-mono text-[12px] tabular-nums text-zinc-500">{s.total > 0 ? s.total : '—'}</span>
                <span className={['hidden sm:block font-mono text-[12px] tabular-nums', s.faulty > 0 ? 'text-red-600' : 'text-zinc-300'].join(' ')}>
                  {s.faulty > 0 ? s.faulty : '—'}
                </span>
                <span className={['hidden sm:block font-mono text-[12px] tabular-nums', s.openIncidents > 0 ? 'text-amber-600' : 'text-zinc-300'].join(' ')}>
                  {s.openIncidents > 0 ? s.openIncidents : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Interventions */}
        <div className={['xl:col-span-2', PANEL].join(' ')}>
          <div className={PANEL_HD}>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-zinc-800">Interventions actives</span>
              {!!stats?.openInterventions && (
                <span className="font-mono text-[10px] font-semibold bg-red-50 text-red-600 ring-1 ring-red-500/20 px-1.5 py-0.5 rounded">
                  {stats.openInterventions}
                </span>
              )}
            </div>
            <Link to="/interventions" className="flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase text-zinc-400 hover:text-orange-600 transition-colors">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {!interventions?.length ? (
            <div className="py-14 text-center">
              <CheckCircle className="w-7 h-7 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-500 font-medium">Aucune intervention active</p>
              <p className="text-[12px] text-zinc-300 mt-1">Toutes les opérations se déroulent normalement</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF0F6]">
              {interventions.map((item) => {
                const dot = PRIORITY_DOT[item.priority] ?? 'bg-zinc-600';
                const cfg = STATUS_CFG[item.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.ouvert;
                const elapsed = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 60000);
                const elapsedStr = elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h${elapsed % 60 > 0 ? String(elapsed % 60).padStart(2, '0') : ''}`;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFBFE] transition-colors">
                    <div className={['w-1.5 h-1.5 rounded-full flex-shrink-0', dot].join(' ')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.site}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge color={cfg.color}>{cfg.label}</Badge>
                      <span className="font-mono text-[11px] text-zinc-400 tabular-nums hidden sm:inline">{elapsedStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Présences */}
          <div className={PANEL}>
            <div className={PANEL_HD}>
              <span className="text-[13px] font-semibold text-zinc-800">Présences</span>
              <Link to="/attendance" className="flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase text-zinc-400 hover:text-orange-600 transition-colors">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {!attendance?.length ? (
              <div className="py-10 text-center">
                <Clock className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
                <p className="text-[12px] text-zinc-400">Aucun pointage aujourd'hui</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF0F6]">
                {attendance.map((r) => {
                  const name = (r.profiles as { full_name: string } | null)?.full_name ?? '—';
                  const cfg  = ATT_CFG[r.status as keyof typeof ATT_CFG] ?? ATT_CFG.present;
                  const time = new Date(r.check_in_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFBFE] transition-colors">
                      <div className="w-6 h-6 rounded bg-[#F4F5FA] border border-[#E6E8F0] flex items-center justify-center font-mono text-[10px] font-semibold text-zinc-500 flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-700 truncate">{name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge color={cfg.color} dot>{cfg.label}</Badge>
                        <span className="font-mono text-[10px] text-zinc-400 tabular-nums">{time}</span>
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
              <span className="text-[13px] font-semibold text-zinc-800">Actions rapides</span>
            </div>
            <div className="divide-y divide-[#EEF0F6]">
              {[
                { to: '/attendance',    label: 'Pointer ma présence',       icon: Users         },
                { to: '/gse',           label: 'Voir les équipements GSE',  icon: Truck         },
                { to: '/interventions', label: 'Signaler une intervention', icon: AlertTriangle },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFBFE] transition-colors group">
                    <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-600 transition-colors flex-shrink-0" strokeWidth={1.75} />
                    <span className="text-[13px] text-zinc-500 group-hover:text-zinc-800 transition-colors">{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 ml-auto transition-colors" />
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
