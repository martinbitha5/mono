import { useQuery } from '@tanstack/react-query';
import { supabase } from '@ats/supabase/client';
import { SITES } from '@ats/types';
import { Button } from '@ats/ui';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Users, AlertTriangle, MonitorCheck, Package, Download } from 'lucide-react';

function useReportData(dateFrom: string, dateTo: string, site: string) {
  return useQuery({
    queryKey: ['reports', dateFrom, dateTo, site],
    queryFn: async () => {
      const [attendance, incidents, installations, equipment] = await Promise.all([
        supabase.from('attendance').select('status, site').gte('check_in_time', dateFrom).lte('check_in_time', dateTo + 'T23:59:59'),
        supabase.from('incidents').select('priority, status, site').gte('created_at', dateFrom).lte('created_at', dateTo + 'T23:59:59'),
        supabase.from('installations').select('status, site').gte('created_at', dateFrom).lte('created_at', dateTo + 'T23:59:59'),
        supabase.from('equipment').select('status').eq('status', 'faulty'),
      ]);

      const att = site === 'all' ? (attendance.data ?? []) : (attendance.data ?? []).filter((a) => a.site === site);
      const inc = site === 'all' ? (incidents.data ?? []) : (incidents.data ?? []).filter((i) => i.site === site);
      const inst = site === 'all' ? (installations.data ?? []) : (installations.data ?? []).filter((i) => i.site === site);

      return {
        attendance: {
          total: att.length,
          present: att.filter((a) => a.status === 'present').length,
          late: att.filter((a) => a.status === 'late').length,
          absent: att.filter((a) => a.status === 'absent').length,
        },
        incidents: {
          total: inc.length,
          critical: inc.filter((i) => i.priority === 'critical').length,
          resolved: inc.filter((i) => i.status === 'resolved').length,
          open: inc.filter((i) => i.status === 'open').length,
        },
        installations: {
          total: inst.length,
          validated: inst.filter((i) => i.status === 'validated').length,
          issues: inst.filter((i) => i.status === 'issue_detected').length,
        },
        faultyEquipment: equipment.data?.length ?? 0,
      };
    },
  });
}

async function generateReport(dateFrom: string, dateTo: string, site: string) {
  const dateTo23 = dateTo + 'T23:59:59';

  const [
    { data: agents },
    { data: attendance },
    { data: incidents },
    { data: equipment },
    { data: installations },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, site, role, status'),
    supabase
      .from('attendance')
      .select('*, agent:profiles!user_id(full_name)')
      .gte('check_in_time', dateFrom)
      .lte('check_in_time', dateTo23),
    supabase
      .from('incidents')
      .select('*, reporter:profiles!reported_by(full_name), assignee:profiles!assigned_to(full_name)')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo23),
    supabase.from('equipment').select('*'),
    supabase
      .from('installations')
      .select('*')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo23),
  ]);

  const filteredAtt = site === 'all' ? (attendance ?? []) : (attendance ?? []).filter((a: any) => a.site === site);
  const filteredInc = site === 'all' ? (incidents ?? []) : (incidents ?? []).filter((i: any) => i.site === site);
  const filteredInst = site === 'all' ? (installations ?? []) : (installations ?? []).filter((i: any) => i.site === site);

  const openInc = filteredInc.filter((i: any) => i.status !== 'resolved');
  const resolvedInc = filteredInc.filter((i: any) => i.status === 'resolved');
  const faultyEq = (equipment ?? []).filter((e: any) => e.status === 'faulty');
  const validatedSites = filteredInst.filter((i: any) => i.status === 'validated');

  const totalAgents = agents?.length ?? 0;
  const presentCount = filteredAtt.filter((a: any) => a.status === 'present').length;

  const { default: XLSX } = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // ── Feuille 1 : Résumé ────────────────────────────────────────────────────
  const siteLabel = site === 'all' ? 'Tous les sites' : site;
  const summaryRows = [
    ['ATS IT CONTROL — RAPPORT OPÉRATIONNEL'],
    [`Généré le : ${new Date().toLocaleString('fr-FR')}`],
    [`Période : ${dateFrom} au ${dateTo}`],
    [`Site : ${siteLabel}`],
    [''],
    ['STATISTIQUES GÉNÉRALES'],
    ['Agents IT total', totalAgents],
    ['Présences sur la période', filteredAtt.length],
    ['Taux de présence', totalAgents > 0 ? Math.round((presentCount / totalAgents) * 100) + '%' : '—'],
    [''],
    ['INCIDENTS'],
    ['Incidents ouverts', openInc.length],
    ['Incidents résolus', resolvedInc.length],
    ['Total incidents', filteredInc.length],
    [''],
    ['ÉQUIPEMENTS'],
    ['Équipements total', equipment?.length ?? 0],
    ['Équipements défectueux', faultyEq.length],
    ['Taux fonctionnel', (equipment?.length ?? 0) > 0
      ? Math.round(((equipment!.length - faultyEq.length) / equipment!.length) * 100) + '%'
      : '—'],
    [''],
    ['INSTALLATIONS / VALIDATIONS'],
    ['Sites validés', validatedSites.length],
    ['Total validations', filteredInst.length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

  // ── Feuille 2 : Présences ─────────────────────────────────────────────────
  const attHeaders = ['Agent', 'Site', 'Date / Heure', 'Statut', 'Notes'];
  const attData = filteredAtt.map((a: any) => [
    (a.agent as { full_name: string } | null)?.full_name ?? 'Inconnu',
    a.site ?? '',
    a.check_in_time ? new Date(a.check_in_time).toLocaleString('fr-FR') : '',
    a.status ?? '',
    a.notes ?? '',
  ]);
  const wsAtt = XLSX.utils.aoa_to_sheet([attHeaders, ...attData]);
  wsAtt['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 12 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsAtt, 'Présences');

  // ── Feuille 3 : Incidents ─────────────────────────────────────────────────
  const incHeaders = ['Titre', 'Site', 'Priorité', 'Statut', 'Signalé par', 'Assigné à', 'Date'];
  const incData = filteredInc.map((i: any) => [
    i.title ?? '',
    i.site ?? '',
    i.priority ?? '',
    i.status ?? '',
    (i.reporter as { full_name: string } | null)?.full_name ?? '—',
    (i.assignee as { full_name: string } | null)?.full_name ?? '—',
    i.created_at ? new Date(i.created_at).toLocaleString('fr-FR') : '',
  ]);
  const wsInc = XLSX.utils.aoa_to_sheet([incHeaders, ...incData]);
  wsInc['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsInc, 'Incidents');

  // ── Feuille 4 : Équipements ───────────────────────────────────────────────
  const eqHeaders = ['Désignation', 'Type', 'Marque', 'Site', 'Statut', 'N° Série', 'Propriétaire', 'Affecté à'];
  const eqData = (equipment ?? []).map((e: any) => [
    e.name ?? '',
    e.type ?? '',
    e.brand ?? '',
    e.site ?? '',
    e.status ?? '',
    e.serial_number ?? '',
    e.owner ?? '',
    e.assignment ?? '',
  ]);
  const wsEq = XLSX.utils.aoa_to_sheet([eqHeaders, ...eqData]);
  wsEq['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsEq, 'Équipements');

  const fileName = `Rapport_IT_Control_${dateFrom}_${dateTo}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function BigMetric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <p className={['text-[32px] font-bold leading-none tabular-nums', color].join(' ')}>{value}</p>
      <p className="text-[12px] text-zinc-600 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[13px] text-zinc-500">{label}</span>
      <span className={['text-[13px] font-bold tabular-nums', color].join(' ')}>{value}</span>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  iconColor,
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-xl">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
        <Icon className={['w-4 h-4', iconColor].join(' ')} />
        <h3 className="text-[13px] font-semibold text-zinc-200">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [site, setSite] = useState('all');
  const [exporting, setExporting] = useState(false);

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor';

  const { data, isLoading } = useReportData(dateFrom, dateTo, site);

  const handleExport = async () => {
    setExporting(true);
    try {
      await generateReport(dateFrom, dateTo, site);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-zinc-50 tracking-tight">Rapports</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Statistiques par période et site</p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExport}
            loading={exporting}
            disabled={exporting}
          >
            <Download className="w-3.5 h-3.5" />
            Exporter Excel
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="border border-white/[0.06] rounded-xl bg-zinc-900 px-5 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label-base">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="flex-1">
            <label className="label-base">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="flex-1">
            <label className="label-base">Site</label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="select-base"
            >
              <option value="all">Tous les sites</option>
              {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-xl border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: Users,
                label: 'Présences enregistrées',
                value: data?.attendance.total ?? 0,
                color: 'text-blue-400',
                iconColor: 'text-blue-400',
                bg: 'bg-blue-500/[0.06]',
              },
              {
                icon: AlertTriangle,
                label: 'Incidents signalés',
                value: data?.incidents.total ?? 0,
                color: 'text-red-400',
                iconColor: 'text-red-400',
                bg: 'bg-red-500/[0.06]',
              },
              {
                icon: MonitorCheck,
                label: 'Installations validées',
                value: data?.installations.validated ?? 0,
                color: 'text-emerald-400',
                iconColor: 'text-emerald-400',
                bg: 'bg-emerald-500/[0.06]',
              },
              {
                icon: Package,
                label: 'Équipements en panne',
                value: data?.faultyEquipment ?? 0,
                color: 'text-amber-400',
                iconColor: 'text-amber-400',
                bg: 'bg-amber-500/[0.06]',
              },
            ].map((kpi) => {
              const KpiIcon = kpi.icon;
              return (
                <div key={kpi.label} className={['border border-white/[0.06] rounded-xl px-5 py-5 flex items-center gap-4', kpi.bg].join(' ')}>
                  <div className="flex-1">
                    <p className={['text-[28px] font-bold leading-none tabular-nums', kpi.color].join(' ')}>
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-2 font-medium leading-tight">{kpi.label}</p>
                  </div>
                  <KpiIcon className={['w-8 h-8 opacity-20 flex-shrink-0', kpi.iconColor].join(' ')} />
                </div>
              );
            })}
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SectionCard icon={Users} title="Présences" iconColor="text-blue-400">
              <StatRow label="Présents" value={data?.attendance.present ?? 0} color="text-emerald-400" />
              <StatRow label="En retard" value={data?.attendance.late ?? 0} color="text-amber-400" />
              <StatRow label="Absents" value={data?.attendance.absent ?? 0} color="text-red-400" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={data?.attendance.total ?? 0}
                  label="Total pointages"
                  color="text-zinc-300"
                />
              </div>
            </SectionCard>

            <SectionCard icon={AlertTriangle} title="Incidents" iconColor="text-red-400">
              <StatRow label="Critiques" value={data?.incidents.critical ?? 0} color="text-red-400" />
              <StatRow label="Résolus" value={data?.incidents.resolved ?? 0} color="text-emerald-400" />
              <StatRow label="Ouverts" value={data?.incidents.open ?? 0} color="text-amber-400" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={data?.incidents.total ?? 0}
                  label="Total incidents"
                  color="text-zinc-300"
                />
              </div>
            </SectionCard>

            <SectionCard icon={MonitorCheck} title="Installations" iconColor="text-emerald-400">
              <StatRow label="Validées" value={data?.installations.validated ?? 0} color="text-emerald-400" />
              <StatRow label="Problèmes détectés" value={data?.installations.issues ?? 0} color="text-red-400" />
              <StatRow label="Non validées" value={(data?.installations.total ?? 0) - (data?.installations.validated ?? 0) - (data?.installations.issues ?? 0)} color="text-zinc-500" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={data?.installations.total ?? 0}
                  label="Total validations"
                  color="text-zinc-300"
                />
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
