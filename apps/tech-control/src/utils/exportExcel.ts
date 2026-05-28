import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { supabase } from '@ats/supabase/client';

// ── Palette ARGB ─────────────────────────────────────────────────────────────
const C = {
  orange:      'FFF97316',
  white:       'FFFFFFFF',
  blue:        'FF4472C4',
  green:       'FF22C55E',
  red:         'FFEF4444',
  amber:       'FFF59E0B',
  emerald:     'FF10B981',
  purple:      'FF8B5CF6',
  gray:        'FF6B7280',
  // Statut léger
  bgGreen:     'FFD1FAE5',
  bgRed:       'FFFEE2E2',
  bgAmber:     'FFFEF3C7',
  bgEmerald:   'FFD1FAE5',
  bgBlue:      'FFDBEAFE',
  // Texte foncé
  txGreen:     'FF15803D',
  txRed:       'FFB91C1C',
  txAmber:     'FFB45309',
  txBlue:      'FF1D4ED8',
  txGray:      'FF374151',
  // Bordures
  border:      'FFE5E7EB',
  // Fond alternance
  rowAlt:      'FFF9FAFB',
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function styleHeaderRow(row: ExcelJS.Row, fillColor: string = C.orange) {
  row.font      = { bold: true, color: { argb: C.white }, size: 11 };
  row.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  row.height    = 26;
}

function applyBordersAndAlt(ws: ExcelJS.Worksheet, dataStartRow = 2) {
  ws.eachRow((row, rowNum) => {
    const isAlt = rowNum >= dataStartRow && rowNum % 2 === 0;
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top:    { style: 'thin', color: { argb: C.border } },
        left:   { style: 'thin', color: { argb: C.border } },
        bottom: { style: 'thin', color: { argb: C.border } },
        right:  { style: 'thin', color: { argb: C.border } },
      };
      if (isAlt && !cell.fill) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.rowAlt } };
      }
    });
  });
}

function colorCell(cell: ExcelJS.Cell, bg: string, text: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.font = { ...(cell.font ?? {}), color: { argb: text }, bold: true };
}

function setInfoRow(ws: ExcelJS.Worksheet, row: number, label: string, value: string | number, bold = false) {
  const a = ws.getCell(`A${row}`);
  const b = ws.getCell(`B${row}`);
  a.value = label;
  a.font  = { bold: true, color: { argb: C.txGray }, size: 10 };
  b.value = value;
  b.font  = { bold, color: { argb: C.txGray }, size: 10 };
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

const FuelLabel: Record<string, string> = { gasoil: 'Gasoil', essence: 'Essence', huile: 'Huile' };

function priorityCfg(p: string) {
  if (p === 'critique') return { bg: C.bgRed,   tx: C.txRed   };
  if (p === 'moyen')    return { bg: C.bgAmber,  tx: C.txAmber };
  return                       { bg: C.bgGreen,  tx: C.txGreen };
}
function statusCfg(s: string) {
  if (s === 'ouvert')   return { bg: C.bgRed,   tx: C.txRed   };
  if (s === 'en_cours') return { bg: C.bgAmber,  tx: C.txAmber };
  return                       { bg: C.bgGreen,  tx: C.txGreen };
}
function gseDeltaCfg(delta: number) {
  if (delta > 0)   return { bg: C.bgRed,   tx: C.txRed   };
  if (delta > -50) return { bg: C.bgAmber,  tx: C.txAmber };
  return                   { bg: C.bgGreen,  tx: C.txGreen };
}

// ═══════════════════════════════════════════════════════════════════════════════
export async function generateTechControlReport(
  dateFrom: string,
  dateTo:   string,
  site:     string,
): Promise<void> {
  const dateTo23   = dateTo + 'T23:59:59';
  const siteLabel  = site === 'all' ? 'Tous les sites' : site;
  const periodText = `Du ${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}`;

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const [
    { data: rawAtt    },
    { data: rawInv    },
    { data: rawGse    },
    { data: rawAgents },
    { data: rawFuelL  },
    { data: rawFuelA  },
    { data: rawStock  },
  ] = await Promise.all([
    supabase.from('attendance')
      .select('*, agent:profiles!user_id(full_name, role, service)')
      .gte('check_in_time', dateFrom).lte('check_in_time', dateTo23),
    supabase.from('gse_incidents')
      .select('*, reporter:profiles!reporter_id(full_name), assignee:profiles!assigned_to(full_name), equipment:gse_equipment!equipment_id(name, serie)')
      .gte('created_at', dateFrom).lte('created_at', dateTo23),
    supabase.from('gse_equipment').select('*'),
    supabase.from('profiles').select('id, full_name, site, role').in('service', ['tech', 'both']),
    supabase.from('fuel_logs')
      .select('*, equipment:gse_equipment!equipment_id(name, serie), agent:profiles!agent_id(full_name)')
      .gte('created_at', dateFrom).lte('created_at', dateTo23)
      .order('created_at', { ascending: false }),
    supabase.from('fuel_appro_logs')
      .select('*, agent:profiles!agent_id(full_name)')
      .gte('created_at', dateFrom).lte('created_at', dateTo23)
      .order('created_at', { ascending: false }),
    supabase.from('fuel_stock').select('*'),
  ]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const fs = <T extends { site?: string }>(arr: T[] | null) =>
    site === 'all' ? (arr ?? []) : (arr ?? []).filter((r) => r.site === site);

  const att   = (rawAtt ?? []).filter((a) => (a.agent as any)?.service !== 'it');
  const filtAtt   = fs(att   as any);
  const filtInv   = fs(rawInv   as any);
  const filtGse   = fs(rawGse   as any);
  const filtFuelL = fs(rawFuelL as any);
  const filtFuelA = fs(rawFuelA as any);
  const filtStock = fs(rawStock as any);

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const fuelSum = (arr: any[], type: string) =>
    arr.filter((f) => f.fuel_type === type).reduce((s, f) => s + Number(f.quantity), 0);

  const consoG = fuelSum(filtFuelL, 'gasoil');
  const consoE = fuelSum(filtFuelL, 'essence');
  const consoH = fuelSum(filtFuelL, 'huile');
  const approG = fuelSum(filtFuelA, 'gasoil');
  const approE = fuelSum(filtFuelA, 'essence');
  const approH = fuelSum(filtFuelA, 'huile');
  const stkG   = fuelSum(filtStock, 'gasoil');
  const stkE   = fuelSum(filtStock, 'essence');
  const stkH   = fuelSum(filtStock, 'huile');
  const gseOp  = filtGse.filter((g: any) => g.statut === 'op').length;
  const gseIn  = filtGse.filter((g: any) => g.statut === 'inop').length;
  const attP   = filtAtt.filter((a: any) => a.status === 'present').length;
  const attL   = filtAtt.filter((a: any) => a.status === 'late').length;
  const attA   = filtAtt.filter((a: any) => a.status === 'absent').length;
  const invCrit   = filtInv.filter((i: any) => i.priority === 'critique').length;
  const invResolu = filtInv.filter((i: any) => i.status === 'resolu').length;
  const invOuvert = filtInv.filter((i: any) => i.status === 'ouvert').length;
  const invEnCours= filtInv.filter((i: any) => i.status === 'en_cours').length;

  // ── Workbook ─────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'ATS Tech Control';
  wb.created  = new Date();
  wb.modified = new Date();

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 1 — RÉSUMÉ
  // ═══════════════════════════════════════════════════════════════════════════
  const wsSum = wb.addWorksheet('Résumé', {
    properties: { tabColor: { argb: C.orange } },
  });
  wsSum.getColumn('A').width = 38;
  wsSum.getColumn('B').width = 22;

  // Bannière titre
  wsSum.mergeCells('A1:B1');
  const title = wsSum.getCell('A1');
  title.value     = 'ATS TECH CONTROL — RAPPORT OPÉRATIONNEL';
  title.font      = { bold: true, size: 16, color: { argb: C.white } };
  title.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.orange } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSum.getRow(1).height = 36;

  wsSum.mergeCells('A2:B2');
  const sub = wsSum.getCell('A2');
  sub.value     = 'African Transport Services — Service Technique';
  sub.font      = { italic: true, size: 11, color: { argb: C.white } };
  sub.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
  sub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSum.getRow(2).height = 22;

  let r = 4;
  setInfoRow(wsSum, r++, 'Date d\'export',      new Date().toLocaleString('fr-FR'));
  setInfoRow(wsSum, r++, 'Période analysée',    periodText);
  setInfoRow(wsSum, r++, 'Site',                siteLabel);
  r++;

  // Section présences
  const secStyle = (row: ExcelJS.Row, color: string) => {
    row.font  = { bold: true, size: 12, color: { argb: C.white } };
    row.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    row.height = 22;
  };
  const addSum = (ws: ExcelJS.Worksheet, startRow: number, rows: [string, number | string][]) => {
    rows.forEach(([label, val]) => {
      const row = ws.getRow(startRow++);
      const ca  = row.getCell(1);
      const cb  = row.getCell(2);
      ca.value = label;
      ca.font  = { color: { argb: C.txGray }, size: 10 };
      cb.value = val;
      cb.font  = { bold: true, color: { argb: C.txGray }, size: 10 };
      cb.alignment = { horizontal: 'right' };
    });
    return startRow;
  };

  // Présences
  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.blue);
  wsSum.getRow(r).getCell(1).value = `PRÉSENCES (${filtAtt.length} pointages)`;
  r++;
  r = addSum(wsSum, r, [
    ['Présents',   attP],
    ['En retard',  attL],
    ['Absents',    attA],
  ]);
  r++;

  // Interventions
  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.red);
  wsSum.getRow(r).getCell(1).value = `INTERVENTIONS GSE (${filtInv.length} total)`;
  r++;
  r = addSum(wsSum, r, [
    ['Critiques',  invCrit],
    ['Ouvertes',   invOuvert],
    ['En cours',   invEnCours],
    ['Résolues',   invResolu],
  ]);
  r++;

  // GSE
  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.amber);
  wsSum.getRow(r).getCell(1).value = `GSE — ÉQUIPEMENTS (${filtGse.length} total)`;
  r++;
  r = addSum(wsSum, r, [
    ['Opérationnels (OP)',  gseOp],
    ['Hors service (INOP)', gseIn],
    ['Taux OP',            filtGse.length > 0 ? `${Math.round((gseOp / filtGse.length) * 100)}%` : '—'],
  ]);
  r++;

  // Carburant
  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.emerald);
  wsSum.getRow(r).getCell(1).value = 'CARBURANT — CONSOMMATIONS (période)';
  r++;
  r = addSum(wsSum, r, [
    ['Gasoil consommé',   `${consoG.toFixed(1)} L`],
    ['Essence consommée', `${consoE.toFixed(1)} L`],
    ['Huile consommée',   `${consoH.toFixed(1)} L`],
    ['TOTAL',             `${(consoG + consoE + consoH).toFixed(1)} L`],
  ]);
  r++;

  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.emerald);
  wsSum.getRow(r).getCell(1).value = 'CARBURANT — APPROVISIONNEMENTS (période)';
  r++;
  r = addSum(wsSum, r, [
    ['Gasoil approvisionné',   `+${approG.toFixed(1)} L`],
    ['Essence approvisionnée', `+${approE.toFixed(1)} L`],
    ['Huile approvisionnée',   `+${approH.toFixed(1)} L`],
  ]);
  r++;

  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.purple);
  wsSum.getRow(r).getCell(1).value = 'CARBURANT — STOCK ACTUEL';
  r++;
  addSum(wsSum, r, [
    ['Gasoil',  `${fmt(stkG)} L`],
    ['Essence', `${fmt(stkE)} L`],
    ['Huile',   `${fmt(stkH)} L`],
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 2 — PRÉSENCES
  // ═══════════════════════════════════════════════════════════════════════════
  const wsAtt = wb.addWorksheet('Présences', {
    properties: { tabColor: { argb: C.green } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsAtt.columns = [
    { header: 'Agent',         key: 'agent', width: 28 },
    { header: 'Site',          key: 'site',  width: 15 },
    { header: 'Date / Heure', key: 'date',  width: 22 },
    { header: 'Statut',       key: 'st',    width: 14 },
    { header: 'Notes',        key: 'notes', width: 35 },
  ];
  styleHeaderRow(wsAtt.getRow(1), C.green);

  filtAtt.forEach((a: any) => {
    const row = wsAtt.addRow({
      agent: a.agent?.full_name ?? 'Inconnu',
      site:  a.site ?? '',
      date:  a.check_in_time ? new Date(a.check_in_time).toLocaleString('fr-FR') : '',
      st:    a.status === 'present' ? 'Présent' : a.status === 'late' ? 'En retard' : 'Absent',
      notes: a.notes ?? '',
    });
    row.alignment = { vertical: 'middle' };
    const stCell = row.getCell('st');
    if (a.status === 'present') colorCell(stCell, C.bgGreen, C.txGreen);
    else if (a.status === 'late') colorCell(stCell, C.bgAmber, C.txAmber);
    else colorCell(stCell, C.bgRed, C.txRed);
  });
  applyBordersAndAlt(wsAtt);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 3 — INTERVENTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsInv = wb.addWorksheet('Interventions', {
    properties: { tabColor: { argb: C.red } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsInv.columns = [
    { header: 'Titre',       key: 'title', width: 35 },
    { header: 'Équipement', key: 'eq',    width: 22 },
    { header: 'Site',        key: 'site',  width: 15 },
    { header: 'Priorité',   key: 'prio',  width: 13 },
    { header: 'Statut',     key: 'st',    width: 13 },
    { header: 'Signalé par', key: 'rep',  width: 24 },
    { header: 'Assigné à',  key: 'ass',  width: 24 },
    { header: 'Date',        key: 'date', width: 22 },
  ];
  styleHeaderRow(wsInv.getRow(1), C.red);

  filtInv.forEach((i: any) => {
    const eq = i.equipment;
    const row = wsInv.addRow({
      title: i.title ?? '',
      eq:    eq ? `${eq.name} ${eq.serie}`.trim() : '—',
      site:  i.site ?? '',
      prio:  i.priority === 'critique' ? 'CRITIQUE' : i.priority === 'moyen' ? 'MOYEN' : 'FAIBLE',
      st:    i.status === 'ouvert' ? 'OUVERT' : i.status === 'en_cours' ? 'EN COURS' : 'RÉSOLU',
      rep:   i.reporter?.full_name ?? '—',
      ass:   i.assignee?.full_name ?? '—',
      date:  i.created_at ? new Date(i.created_at).toLocaleString('fr-FR') : '',
    });
    row.alignment = { vertical: 'middle' };
    const pc = priorityCfg(i.priority);
    const sc = statusCfg(i.status);
    colorCell(row.getCell('prio'), pc.bg, pc.tx);
    colorCell(row.getCell('st'),   sc.bg, sc.tx);
  });
  applyBordersAndAlt(wsInv);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 4 — GSE
  // ═══════════════════════════════════════════════════════════════════════════
  const wsGse = wb.addWorksheet('GSE', {
    properties: { tabColor: { argb: C.amber } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsGse.columns = [
    { header: 'Désignation',        key: 'name',  width: 24 },
    { header: 'Série',              key: 'serie', width: 13 },
    { header: 'Marque',             key: 'mark',  width: 13 },
    { header: 'Type',               key: 'type',  width: 14 },
    { header: 'Site',               key: 'site',  width: 14 },
    { header: 'Statut',             key: 'st',    width: 10 },
    { header: 'Horamètre (h)',      key: 'hora',  width: 14 },
    { header: 'Proch. Révision (h)', key: 'next', width: 18 },
    { header: 'Delta (h)',          key: 'delta', width: 11 },
    { header: 'Observations',       key: 'obs',   width: 35 },
  ];
  styleHeaderRow(wsGse.getRow(1), C.amber);

  filtGse.forEach((g: any) => {
    const row = wsGse.addRow({
      name:  g.name ?? '',
      serie: g.serie ?? '',
      mark:  g.marque ?? '',
      type:  g.type ?? '',
      site:  g.site ?? '',
      st:    g.statut?.toUpperCase() ?? '',
      hora:  g.horametre_actuel ?? 0,
      next:  g.horametre_prochain ?? 0,
      delta: g.delta ?? 0,
      obs:   g.obs ?? '',
    });
    row.alignment = { vertical: 'middle' };
    colorCell(row.getCell('st'),    g.statut === 'op' ? C.bgGreen : C.bgRed,    g.statut === 'op' ? C.txGreen : C.txRed);
    const dc = gseDeltaCfg(g.delta ?? 0);
    colorCell(row.getCell('delta'), dc.bg, dc.tx);
  });
  applyBordersAndAlt(wsGse);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 5 — CONSOMMATIONS CARBURANT
  // ═══════════════════════════════════════════════════════════════════════════
  const wsCons = wb.addWorksheet('Consommations', {
    properties: { tabColor: { argb: C.amber } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsCons.columns = [
    { header: 'Date',           key: 'date',  width: 22 },
    { header: 'Équipement',    key: 'eq',    width: 22 },
    { header: 'Série',          key: 'serie', width: 12 },
    { header: 'Site',           key: 'site',  width: 14 },
    { header: 'Type',           key: 'type',  width: 12 },
    { header: 'Quantité (L)',  key: 'qty',   width: 14 },
    { header: 'Horamètre (h)', key: 'hora',  width: 14 },
    { header: 'Notes',          key: 'notes', width: 32 },
    { header: 'Agent',          key: 'agent', width: 24 },
  ];
  styleHeaderRow(wsCons.getRow(1), C.amber);

  filtFuelL.forEach((f: any) => {
    const eq  = f.equipment;
    const row = wsCons.addRow({
      date:  f.created_at ? new Date(f.created_at).toLocaleString('fr-FR') : '',
      eq:    eq?.name ?? '—',
      serie: eq?.serie ?? '',
      site:  f.site ?? '',
      type:  FuelLabel[f.fuel_type] ?? f.fuel_type,
      qty:   Number(f.quantity),
      hora:  f.horametre_at_fill ?? 0,
      notes: f.notes ?? '',
      agent: f.agent?.full_name ?? '—',
    });
    row.alignment = { vertical: 'middle' };
    row.getCell('qty').numFmt = '#,##0.0';
  });
  applyBordersAndAlt(wsCons);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 6 — APPROVISIONNEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsAppro = wb.addWorksheet('Approvisionnements', {
    properties: { tabColor: { argb: C.emerald } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsAppro.columns = [
    { header: 'Date',           key: 'date',  width: 22 },
    { header: 'Site',           key: 'site',  width: 14 },
    { header: 'Type',           key: 'type',  width: 12 },
    { header: 'Quantité (L)',  key: 'qty',   width: 14 },
    { header: 'N° Bon / Notes', key: 'notes', width: 38 },
    { header: 'Agent',          key: 'agent', width: 24 },
  ];
  styleHeaderRow(wsAppro.getRow(1), C.emerald);

  filtFuelA.forEach((a: any) => {
    const row = wsAppro.addRow({
      date:  a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '',
      site:  a.site ?? '',
      type:  FuelLabel[a.fuel_type] ?? a.fuel_type,
      qty:   Number(a.quantity),
      notes: a.notes ?? '',
      agent: a.agent?.full_name ?? '—',
    });
    row.alignment = { vertical: 'middle' };
    const qtyCell = row.getCell('qty');
    qtyCell.numFmt = '#,##0.0';
    colorCell(qtyCell, C.bgEmerald, C.txGreen);
  });
  applyBordersAndAlt(wsAppro);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 7 — STOCK CARBURANT
  // ═══════════════════════════════════════════════════════════════════════════
  const wsStk = wb.addWorksheet('Stock Carburant', {
    properties: { tabColor: { argb: C.purple } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsStk.columns = [
    { header: 'Site',                  key: 'site',  width: 16 },
    { header: 'Type',                  key: 'type',  width: 14 },
    { header: 'Quantité actuelle (L)', key: 'qty',   width: 22 },
    { header: 'Seuil alerte (L)',      key: 'thr',   width: 18 },
    { header: 'Alerte',                key: 'alert', width: 12 },
    { header: 'Dernière mise à jour',  key: 'upd',   width: 24 },
  ];
  styleHeaderRow(wsStk.getRow(1), C.purple);

  filtStock.forEach((s: any) => {
    const isAlert = Number(s.quantity) <= Number(s.threshold);
    const row = wsStk.addRow({
      site:  s.site ?? '',
      type:  FuelLabel[s.fuel_type] ?? s.fuel_type,
      qty:   Number(s.quantity),
      thr:   Number(s.threshold),
      alert: isAlert ? '⚠ ALERTE' : 'OK',
      upd:   s.updated_at ? new Date(s.updated_at).toLocaleString('fr-FR') : '',
    });
    row.alignment = { vertical: 'middle' };
    row.getCell('qty').numFmt = '#,##0';
    row.getCell('thr').numFmt = '#,##0';
    colorCell(row.getCell('alert'), isAlert ? C.bgRed : C.bgGreen, isAlert ? C.txRed : C.txGreen);
  });
  applyBordersAndAlt(wsStk);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 8 — AGENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsAg = wb.addWorksheet('Agents', {
    properties: { tabColor: { argb: C.gray } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsAg.columns = [
    { header: 'Nom complet', key: 'name', width: 28 },
    { header: 'Rôle',        key: 'role', width: 16 },
    { header: 'Site',        key: 'site', width: 16 },
  ];
  styleHeaderRow(wsAg.getRow(1), C.gray);

  (rawAgents ?? []).forEach((a: any) => {
    const row = wsAg.addRow({ name: a.full_name ?? '', role: a.role ?? '', site: a.site ?? '' });
    row.alignment = { vertical: 'middle' };
  });
  applyBordersAndAlt(wsAg);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(blob, `ATS_TechControl_${dateStr}_${dateFrom}_${dateTo}.xlsx`);
}
