import { useQuery } from '@tanstack/react-query';
import { supabase } from '@ats/supabase/client';
import { SITES } from '@ats/types';
import { Button } from '@ats/ui';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Users, Wrench, Truck, Download, Droplets } from 'lucide-react';
import { generateTechControlReport } from '../utils/exportExcel';

type FuelType = 'gasoil' | 'essence' | 'huile';

function fuelSum(rows: { fuel_type: string; quantity: number }[], type: FuelType) {
  return rows.filter((r) => r.fuel_type === type).reduce((s, r) => s + Number(r.quantity), 0);
}

function useReportData(dateFrom: string, dateTo: string, site: string) {
  return useQuery({
    queryKey: ['tech-reports', dateFrom, dateTo, site],
    queryFn: async () => {
      const dateTo23 = dateTo + 'T23:59:59';
      const [attendanceRes, interventions, gse, fuelLogsRes, fuelApproRes, fuelStockRes] = await Promise.all([
        supabase.from('attendance')
          .select('status, site, profiles!user_id(role, service)')
          .gte('check_in_time', dateFrom)
          .lte('check_in_time', dateTo23),
        supabase.from('gse_incidents')
          .select('priority, status, site')
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo23),
        supabase.from('gse_equipment').select('statut, site'),
        supabase.from('fuel_logs')
          .select('fuel_type, quantity, site')
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo23),
        supabase.from('fuel_appro_logs')
          .select('fuel_type, quantity, site')
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo23),
        supabase.from('fuel_stock').select('fuel_type, quantity, threshold, site'),
      ]);

      const allAtt  = (attendanceRes.data ?? []).filter((a) => {
        const p = a.profiles as { service?: string } | null;
        return p?.service !== 'it';
      });
      const att      = site === 'all' ? allAtt : allAtt.filter((a) => a.site === site);
      const inv      = site === 'all' ? (interventions.data ?? []) : (interventions.data ?? []).filter((i) => i.site === site);
      const gseData  = site === 'all' ? (gse.data ?? []) : (gse.data ?? []).filter((g) => g.site === site);
      const fuelLogs = site === 'all' ? (fuelLogsRes.data ?? []) : (fuelLogsRes.data ?? []).filter((f) => f.site === site);
      const fuelAppr = site === 'all' ? (fuelApproRes.data ?? []) : (fuelApproRes.data ?? []).filter((f) => f.site === site);
      const fuelStk  = site === 'all' ? (fuelStockRes.data ?? []) : (fuelStockRes.data ?? []).filter((f) => f.site === site);

      return {
        attendance: {
          total:   att.length,
          present: att.filter((a) => a.status === 'present').length,
          late:    att.filter((a) => a.status === 'late').length,
          absent:  att.filter((a) => a.status === 'absent').length,
        },
        interventions: {
          total:      inv.length,
          critical:   inv.filter((i) => i.priority === 'critique').length,
          resolved:   inv.filter((i) => i.status === 'resolu').length,
          open:       inv.filter((i) => i.status === 'ouvert').length,
          inProgress: inv.filter((i) => i.status === 'en_cours').length,
        },
        gse: {
          total:       gseData.length,
          operational: gseData.filter((g) => g.statut === 'op').length,
          inop:        gseData.filter((g) => g.statut === 'inop').length,
        },
        fuel: {
          conso: {
            gasoil:  fuelSum(fuelLogs as { fuel_type: string; quantity: number }[], 'gasoil'),
            essence: fuelSum(fuelLogs as { fuel_type: string; quantity: number }[], 'essence'),
            huile:   fuelSum(fuelLogs as { fuel_type: string; quantity: number }[], 'huile'),
            total:   (fuelLogs as { quantity: number }[]).reduce((s, f) => s + Number(f.quantity), 0),
          },
          appro: {
            gasoil:  fuelSum(fuelAppr as { fuel_type: string; quantity: number }[], 'gasoil'),
            essence: fuelSum(fuelAppr as { fuel_type: string; quantity: number }[], 'essence'),
            huile:   fuelSum(fuelAppr as { fuel_type: string; quantity: number }[], 'huile'),
            total:   (fuelAppr as { quantity: number }[]).reduce((s, f) => s + Number(f.quantity), 0),
          },
          stock: {
            gasoil:  fuelSum(fuelStk as { fuel_type: string; quantity: number }[], 'gasoil'),
            essence: fuelSum(fuelStk as { fuel_type: string; quantity: number }[], 'essence'),
            huile:   fuelSum(fuelStk as { fuel_type: string; quantity: number }[], 'huile'),
          },
        },
      };
    },
  });
}


/* ── UI components ── */
function BigMetric({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div>
      <p className={['text-[32px] font-bold leading-none tabular-nums', color].join(' ')}>{value}</p>
      <p className="text-[12px] text-zinc-400 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E6E8F0] last:border-0">
      <span className="text-[13px] text-zinc-500">{label}</span>
      <span className={['text-[13px] font-bold tabular-nums', color].join(' ')}>{value}</span>
    </div>
  );
}

function SectionCard({
  icon: Icon, title, iconColor, children,
}: { icon: React.ElementType; title: string; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E6E8F0] rounded-xl shadow-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E6E8F0]">
        <Icon className={['w-4 h-4', iconColor].join(' ')} />
        <h3 className="text-[13px] font-semibold text-zinc-800">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export function ReportsPage() {
  const today      = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';
  const [dateFrom,   setDateFrom  ] = useState(monthStart);
  const [dateTo,     setDateTo    ] = useState(today);
  const [site,       setSite      ] = useState('all');
  const [exporting,  setExporting ] = useState(false);

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'supervisor';

  const { data, isLoading } = useReportData(dateFrom, dateTo, site);

  const handleExport = async () => {
    setExporting(true);
    try { await generateTechControlReport(dateFrom, dateTo, site); }
    catch (err) { console.error('Export failed', err); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">Rapports</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Statistiques par période et site</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="secondary" onClick={handleExport} loading={exporting} disabled={exporting}>
            <Download className="w-3.5 h-3.5" />
            Exporter Excel
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="border border-[#E6E8F0] rounded-xl bg-white px-5 py-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label-base">Du</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-base" />
          </div>
          <div className="flex-1">
            <label className="label-base">Au</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-base" />
          </div>
          <div className="flex-1">
            <label className="label-base">Site</label>
            <select value={site} onChange={(e) => setSite(e.target.value)} className="select-base">
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
                icon: Users,    label: 'Présences enregistrées',
                value: data?.attendance.total ?? 0, color: 'text-blue-500', iconColor: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                icon: Wrench,   label: 'Interventions signalées',
                value: data?.interventions.total ?? 0, color: 'text-red-500', iconColor: 'text-red-600',
                bg: 'bg-red-50',
              },
              {
                icon: Truck,    label: 'GSE opérationnels',
                value: data?.gse.operational ?? 0, color: 'text-emerald-500', iconColor: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: Droplets, label: 'Carburant consommé',
                value: `${(data?.fuel.conso.total ?? 0).toFixed(0)} L`,
                color: 'text-amber-500', iconColor: 'text-amber-600',
                bg: 'bg-amber-50',
              },
            ].map((kpi) => {
              const KpiIcon = kpi.icon;
              return (
                <div key={kpi.label}
                  className={['border border-[#E6E8F0] rounded-xl px-5 py-5 flex items-center gap-4 shadow-card', kpi.bg].join(' ')}>
                  <div className="flex-1 min-w-0">
                    <p className={['text-[26px] font-bold leading-none tabular-nums truncate', kpi.color].join(' ')}>
                      {kpi.value}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-2 font-medium leading-tight">{kpi.label}</p>
                  </div>
                  <KpiIcon className={['w-8 h-8 opacity-20 flex-shrink-0', kpi.iconColor].join(' ')} />
                </div>
              );
            })}
          </div>

          {/* Detail cards — row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SectionCard icon={Users} title="Présences" iconColor="text-blue-600">
              <StatRow label="Présents"  value={data?.attendance.present ?? 0} color="text-emerald-500" />
              <StatRow label="En retard" value={data?.attendance.late    ?? 0} color="text-amber-500" />
              <StatRow label="Absents"   value={data?.attendance.absent  ?? 0} color="text-red-500" />
              <div className="pt-3 mt-1">
                <BigMetric value={data?.attendance.total ?? 0} label="Total pointages" color="text-zinc-700" />
              </div>
            </SectionCard>

            <SectionCard icon={Wrench} title="Interventions GSE" iconColor="text-red-600">
              <StatRow label="Critiques"  value={data?.interventions.critical   ?? 0} color="text-red-500" />
              <StatRow label="En cours"   value={data?.interventions.inProgress ?? 0} color="text-amber-500" />
              <StatRow label="Résolues"   value={data?.interventions.resolved   ?? 0} color="text-emerald-500" />
              <StatRow label="Ouvertes"   value={data?.interventions.open       ?? 0} color="text-zinc-500" />
              <div className="pt-3 mt-1">
                <BigMetric value={data?.interventions.total ?? 0} label="Total interventions" color="text-zinc-700" />
              </div>
            </SectionCard>

            <SectionCard icon={Truck} title="GSE" iconColor="text-orange-600">
              <StatRow label="Opérationnels (OP)"  value={data?.gse.operational ?? 0} color="text-emerald-500" />
              <StatRow label="Hors service (INOP)" value={data?.gse.inop        ?? 0} color="text-red-500" />
              <div className="pt-3 mt-1">
                <BigMetric value={data?.gse.total ?? 0} label="Total équipements" color="text-zinc-700" />
              </div>
            </SectionCard>
          </div>

          {/* Detail cards — row 2 : Carburant */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SectionCard icon={Droplets} title="Consommations" iconColor="text-amber-600">
              <StatRow label="Gasoil"  value={`${(data?.fuel.conso.gasoil  ?? 0).toFixed(0)} L`} color="text-amber-600" />
              <StatRow label="Essence" value={`${(data?.fuel.conso.essence ?? 0).toFixed(0)} L`} color="text-blue-600" />
              <StatRow label="Huile"   value={`${(data?.fuel.conso.huile   ?? 0).toFixed(0)} L`} color="text-emerald-600" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={`${(data?.fuel.conso.total ?? 0).toFixed(0)} L`}
                  label="Total consommé sur la période"
                  color="text-zinc-700"
                />
              </div>
            </SectionCard>

            <SectionCard icon={Droplets} title="Approvisionnements" iconColor="text-emerald-600">
              <StatRow label="Gasoil"  value={`+${(data?.fuel.appro.gasoil  ?? 0).toFixed(0)} L`} color="text-amber-600" />
              <StatRow label="Essence" value={`+${(data?.fuel.appro.essence ?? 0).toFixed(0)} L`} color="text-blue-600" />
              <StatRow label="Huile"   value={`+${(data?.fuel.appro.huile   ?? 0).toFixed(0)} L`} color="text-emerald-600" />
              <div className="pt-3 mt-1">
                <BigMetric
                  value={`+${(data?.fuel.appro.total ?? 0).toFixed(0)} L`}
                  label="Total approvisionné sur la période"
                  color="text-zinc-700"
                />
              </div>
            </SectionCard>

            <SectionCard icon={Droplets} title="Stock actuel" iconColor="text-zinc-500">
              <StatRow label="Gasoil"  value={`${(data?.fuel.stock.gasoil  ?? 0).toFixed(0)} L`} color="text-amber-600" />
              <StatRow label="Essence" value={`${(data?.fuel.stock.essence ?? 0).toFixed(0)} L`} color="text-blue-600" />
              <StatRow label="Huile"   value={`${(data?.fuel.stock.huile   ?? 0).toFixed(0)} L`} color="text-emerald-600" />
              <div className="pt-3 mt-1">
                <p className="text-[11px] text-zinc-400">Snapshot en temps réel — indépendant de la période sélectionnée</p>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
