import { useQuery } from '@tanstack/react-query';
import { supabase } from '@ats/supabase/client';
import { SITES } from '@ats/types';
import { Button } from '@ats/ui';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Users, AlertTriangle, MonitorCheck, Package, Download } from 'lucide-react';
import { generateItControlReport } from '../utils/exportExcel';

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


function BigMetric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <p className={['text-[32px] font-bold leading-none tabular-nums', color].join(' ')}>{value}</p>
      <p className="text-[12px] text-zinc-400 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E6E8F0] last:border-0">
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
    <div className="bg-white border border-[#E6E8F0] rounded-xl">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E6E8F0]">
        <Icon className={['w-4 h-4', iconColor].join(' ')} />
        <h3 className="text-[13px] font-semibold text-zinc-800">{title}</h3>
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
      await generateItControlReport(dateFrom, dateTo, site);
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
          <h1 className="text-[18px] font-bold text-zinc-900 tracking-tight">Rapports</h1>
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
      <div className="border border-[#E6E8F0] rounded-xl bg-white px-5 py-4">
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
            <div key={i} className="h-24 bg-white rounded-xl border border-[#E6E8F0] animate-pulse" />
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
                color: 'text-blue-600',
                iconColor: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                icon: AlertTriangle,
                label: 'Incidents signalés',
                value: data?.incidents.total ?? 0,
                color: 'text-red-600',
                iconColor: 'text-red-600',
                bg: 'bg-red-50',
              },
              {
                icon: MonitorCheck,
                label: 'Installations validées',
                value: data?.installations.validated ?? 0,
                color: 'text-emerald-600',
                iconColor: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: Package,
                label: 'Équipements en panne',
                value: data?.faultyEquipment ?? 0,
                color: 'text-amber-600',
                iconColor: 'text-amber-600',
                bg: 'bg-amber-50',
              },
            ].map((kpi) => {
              const KpiIcon = kpi.icon;
              return (
                <div key={kpi.label} className={['border border-[#E6E8F0] rounded-xl px-5 py-5 flex items-center gap-4', kpi.bg].join(' ')}>
                  <div className="flex-1">
                    <p className={['text-[28px] font-bold leading-none tabular-nums', kpi.color].join(' ')}>
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-2 font-medium leading-tight">{kpi.label}</p>
                  </div>
                  <KpiIcon className={['w-8 h-8 opacity-20 flex-shrink-0', kpi.iconColor].join(' ')} />
                </div>
              );
            })}
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SectionCard icon={Users} title="Présences" iconColor="text-blue-600">
              <StatRow label="Présents" value={data?.attendance.present ?? 0} color="text-emerald-600" />
              <StatRow label="En retard" value={data?.attendance.late ?? 0} color="text-amber-600" />
              <StatRow label="Absents" value={data?.attendance.absent ?? 0} color="text-red-600" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={data?.attendance.total ?? 0}
                  label="Total pointages"
                  color="text-zinc-700"
                />
              </div>
            </SectionCard>

            <SectionCard icon={AlertTriangle} title="Incidents" iconColor="text-red-600">
              <StatRow label="Critiques" value={data?.incidents.critical ?? 0} color="text-red-600" />
              <StatRow label="Résolus" value={data?.incidents.resolved ?? 0} color="text-emerald-600" />
              <StatRow label="Ouverts" value={data?.incidents.open ?? 0} color="text-amber-600" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={data?.incidents.total ?? 0}
                  label="Total incidents"
                  color="text-zinc-700"
                />
              </div>
            </SectionCard>

            <SectionCard icon={MonitorCheck} title="Installations" iconColor="text-emerald-600">
              <StatRow label="Validées" value={data?.installations.validated ?? 0} color="text-emerald-600" />
              <StatRow label="Problèmes détectés" value={data?.installations.issues ?? 0} color="text-red-600" />
              <StatRow label="Non validées" value={(data?.installations.total ?? 0) - (data?.installations.validated ?? 0) - (data?.installations.issues ?? 0)} color="text-zinc-500" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={data?.installations.total ?? 0}
                  label="Total validations"
                  color="text-zinc-700"
                />
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
