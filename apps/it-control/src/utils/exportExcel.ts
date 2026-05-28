import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { supabase } from '@ats/supabase/client';

// ── Palette ARGB ─────────────────────────────────────────────────────────────
const C = {
  blue:        'FF3B82F6',
  blueDeep:    'FF1D4ED8',
  white:       'FFFFFFFF',
  green:       'FF22C55E',
  red:         'FFEF4444',
  amber:       'FFF59E0B',
  emerald:     'FF10B981',
  purple:      'FF8B5CF6',
  gray:        'FF6B7280',
  // Light backgrounds
  bgGreen:     'FFD1FAE5',
  bgRed:       'FFFEE2E2',
  bgAmber:     'FFFEF3C7',
  bgBlue:      'FFDBEAFE',
  bgPurple:    'FFEDE9FE',
  // Dark text
  txGreen:     'FF15803D',
  txRed:       'FFB91C1C',
  txAmber:     'FFB45309',
  txBlue:      'FF1D4ED8',
  txGray:      'FF374151',
  // Borders
  border:      'FFE5E7EB',
  rowAlt:      'FFF9FAFB',
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function styleHeaderRow(row: ExcelJS.Row, fillColor: string = C.blue) {
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

function setInfoRow(ws: ExcelJS.Worksheet, row: number, label: string, value: string | number) {
  const a = ws.getCell(`A${row}`);
  const b = ws.getCell(`B${row}`);
  a.value = label;
  a.font  = { bold: true, color: { argb: C.txGray }, size: 10 };
  b.value = value;
  b.font  = { color: { argb: C.txGray }, size: 10 };
}

function priorityCfg(p: string) {
  if (p === 'critical') return { bg: C.bgRed,   tx: C.txRed   };
  if (p === 'medium')   return { bg: C.bgAmber,  tx: C.txAmber };
  return                       { bg: C.bgGreen,  tx: C.txGreen };
}
function statusCfg(s: string) {
  if (s === 'open')     return { bg: C.bgRed,   tx: C.txRed   };
  if (s === 'in_progress') return { bg: C.bgAmber, tx: C.txAmber };
  return                       { bg: C.bgGreen,  tx: C.txGreen };
}
function eqStatusCfg(s: string) {
  if (s === 'faulty')      return { bg: C.bgRed,   tx: C.txRed   };
  if (s === 'maintenance') return { bg: C.bgAmber,  tx: C.txAmber };
  return                          { bg: C.bgGreen,  tx: C.txGreen };
}

// ═══════════════════════════════════════════════════════════════════════════════
export async function generateItControlReport(
  dateFrom: string,
  dateTo:   string,
  site:     string,
): Promise<void> {
  const dateTo23   = dateTo + 'T23:59:59';
  const siteLabel  = site === 'all' ? 'Tous les sites' : site;
  const periodText = `Du ${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}`;

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const [
    { data: rawAtt        },
    { data: rawIncidents  },
    { data: rawInst       },
    { data: rawEquipment  },
    { data: rawAgents     },
  ] = await Promise.all([
    supabase.from('attendance')
      .select('*, agent:profiles!user_id(full_name, role, service)')
      .gte('check_in_time', dateFrom).lte('check_in_time', dateTo23),
    supabase.from('incidents')
      .select('*, reporter:profiles!reported_by(full_name), assignee:profiles!assigned_to(full_name)')
      .gte('created_at', dateFrom).lte('created_at', dateTo23),
    supabase.from('installations')
      .select('*')
      .gte('created_at', dateFrom).lte('created_at', dateTo23),
    supabase.from('equipment').select('*'),
    supabase.from('profiles').select('id, full_name, site, role, fonction, status').in('service', ['it', 'both']),
  ]);

  // ── Filter by site ──────────────────────────────────────────────────────────
  const fs = <T extends { site?: string | null }>(arr: T[] | null) =>
    site === 'all' ? (arr ?? []) : (arr ?? []).filter((r) => r.site === site);

  // Attendance : exclure les agents tech-only
  const allAtt    = (rawAtt ?? []).filter((a) => (a.agent as any)?.service !== 'tech');
  const filtAtt   = fs(allAtt as any);
  const filtInc   = fs(rawIncidents as any);
  const filtInst  = fs(rawInst as any);
  const filtEq    = site === 'all'
    ? (rawEquipment ?? [])
    : (rawEquipment ?? []).filter((e: any) => e.site === site);

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const attP     = filtAtt.filter((a: any)  => a.status === 'present').length;
  const attL     = filtAtt.filter((a: any)  => a.status === 'late').length;
  const attA     = filtAtt.filter((a: any)  => a.status === 'absent').length;
  const incCrit  = filtInc.filter((i: any)  => i.priority === 'critical').length;
  const incResol = filtInc.filter((i: any)  => i.status === 'resolved').length;
  const incOpen  = filtInc.filter((i: any)  => i.status === 'open').length;
  const incProg  = filtInc.filter((i: any)  => i.status === 'in_progress').length;
  const instOk   = filtInst.filter((i: any) => i.status === 'validated').length;
  const instKo   = filtInst.filter((i: any) => i.status === 'issue_detected').length;
  const eqFault  = filtEq.filter((e: any)   => e.status === 'faulty').length;
  const eqOk     = filtEq.filter((e: any)   => e.status === 'operational').length;

  // ── Workbook ─────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'ATS IT Control';
  wb.created  = new Date();
  wb.modified = new Date();

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 1 — RÉSUMÉ
  // ═══════════════════════════════════════════════════════════════════════════
  const wsSum = wb.addWorksheet('Résumé', {
    properties: { tabColor: { argb: C.blue } },
  });
  wsSum.getColumn('A').width = 38;
  wsSum.getColumn('B').width = 22;

  // Bannière titre
  wsSum.mergeCells('A1:B1');
  const title = wsSum.getCell('A1');
  title.value     = 'ATS IT CONTROL — RAPPORT OPÉRATIONNEL';
  title.font      = { bold: true, size: 16, color: { argb: C.white } };
  title.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.blue } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSum.getRow(1).height = 36;

  wsSum.mergeCells('A2:B2');
  const sub = wsSum.getCell('A2');
  sub.value     = 'African Transport Services — Service Informatique';
  sub.font      = { italic: true, size: 11, color: { argb: C.white } };
  sub.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.blueDeep } };
  sub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSum.getRow(2).height = 22;

  let r = 4;
  setInfoRow(wsSum, r++, "Date d'export",   new Date().toLocaleString('fr-FR'));
  setInfoRow(wsSum, r++, 'Période analysée', periodText);
  setInfoRow(wsSum, r++, 'Site',             siteLabel);
  r++;

  const secStyle = (row: ExcelJS.Row, color: string) => {
    row.font   = { bold: true, size: 12, color: { argb: C.white } };
    row.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
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

  // Incidents
  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.red);
  wsSum.getRow(r).getCell(1).value = `INCIDENTS IT (${filtInc.length} total)`;
  r++;
  r = addSum(wsSum, r, [
    ['Critiques',  incCrit],
    ['Ouverts',    incOpen],
    ['En cours',   incProg],
    ['Résolus',    incResol],
  ]);
  r++;

  // Installations
  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.emerald);
  wsSum.getRow(r).getCell(1).value = `INSTALLATIONS / VALIDATIONS (${filtInst.length} total)`;
  r++;
  r = addSum(wsSum, r, [
    ['Validées',             instOk],
    ['Problèmes détectés',  instKo],
    ['Non validées',        filtInst.length - instOk - instKo],
  ]);
  r++;

  // Équipements
  wsSum.mergeCells(`A${r}:B${r}`);
  secStyle(wsSum.getRow(r), C.amber);
  wsSum.getRow(r).getCell(1).value = `ÉQUIPEMENTS IT (${filtEq.length} total)`;
  r++;
  addSum(wsSum, r, [
    ['Opérationnels',   eqOk],
    ['En panne',        eqFault],
    ['Taux fonctionnel', filtEq.length > 0
      ? `${Math.round((eqOk / filtEq.length) * 100)}%`
      : '—'],
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 2 — PRÉSENCES
  // ═══════════════════════════════════════════════════════════════════════════
  const wsAtt = wb.addWorksheet('Présences', {
    properties: { tabColor: { argb: C.green } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsAtt.columns = [
    { header: 'Agent',        key: 'agent', width: 28 },
    { header: 'Site',         key: 'site',  width: 15 },
    { header: 'Date / Heure',key: 'date',  width: 22 },
    { header: 'Statut',      key: 'st',    width: 14 },
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
    if (a.status === 'present')     colorCell(stCell, C.bgGreen, C.txGreen);
    else if (a.status === 'late')   colorCell(stCell, C.bgAmber, C.txAmber);
    else                            colorCell(stCell, C.bgRed, C.txRed);
  });
  applyBordersAndAlt(wsAtt);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 3 — INCIDENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsInc = wb.addWorksheet('Incidents', {
    properties: { tabColor: { argb: C.red } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsInc.columns = [
    { header: 'Titre',        key: 'title', width: 35 },
    { header: 'Site',         key: 'site',  width: 14 },
    { header: 'Priorité',    key: 'prio',  width: 13 },
    { header: 'Statut',      key: 'st',    width: 13 },
    { header: 'Signalé par', key: 'rep',   width: 24 },
    { header: 'Assigné à',   key: 'ass',   width: 24 },
    { header: 'Description', key: 'desc',  width: 40 },
    { header: 'Date',         key: 'date',  width: 22 },
  ];
  styleHeaderRow(wsInc.getRow(1), C.red);

  filtInc.forEach((i: any) => {
    const row = wsInc.addRow({
      title: i.title ?? '',
      site:  i.site ?? '',
      prio:  i.priority === 'critical' ? 'CRITIQUE' : i.priority === 'medium' ? 'MOYEN' : 'FAIBLE',
      st:    i.status === 'open' ? 'OUVERT' : i.status === 'in_progress' ? 'EN COURS' : 'RÉSOLU',
      rep:   (i.reporter as any)?.full_name ?? '—',
      ass:   (i.assignee as any)?.full_name ?? '—',
      desc:  i.description ?? '',
      date:  i.created_at ? new Date(i.created_at).toLocaleString('fr-FR') : '',
    });
    row.alignment = { vertical: 'middle' };
    colorCell(row.getCell('prio'), priorityCfg(i.priority).bg, priorityCfg(i.priority).tx);
    colorCell(row.getCell('st'),   statusCfg(i.status).bg,    statusCfg(i.status).tx);
  });
  applyBordersAndAlt(wsInc);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 4 — INSTALLATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const wsInst = wb.addWorksheet('Installations', {
    properties: { tabColor: { argb: C.emerald } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsInst.columns = [
    { header: 'Désignation',  key: 'name',   width: 32 },
    { header: 'Site',          key: 'site',   width: 14 },
    { header: 'Statut',       key: 'st',     width: 18 },
    { header: 'Responsable',  key: 'resp',   width: 22 },
    { header: 'Notes',         key: 'notes',  width: 40 },
    { header: 'Date',          key: 'date',   width: 22 },
  ];
  styleHeaderRow(wsInst.getRow(1), C.emerald);

  filtInst.forEach((i: any) => {
    const stLabel = i.status === 'validated'
      ? 'VALIDÉE'
      : i.status === 'issue_detected'
        ? 'PROBLÈME DÉTECTÉ'
        : 'EN ATTENTE';
    const row = wsInst.addRow({
      name:  i.name ?? i.title ?? '',
      site:  i.site ?? '',
      st:    stLabel,
      resp:  i.responsible ?? i.agent ?? '—',
      notes: i.notes ?? i.description ?? '',
      date:  i.created_at ? new Date(i.created_at).toLocaleString('fr-FR') : '',
    });
    row.alignment = { vertical: 'middle' };
    if (i.status === 'validated')       colorCell(row.getCell('st'), C.bgGreen, C.txGreen);
    else if (i.status === 'issue_detected') colorCell(row.getCell('st'), C.bgRed, C.txRed);
    else                                colorCell(row.getCell('st'), C.bgAmber, C.txAmber);
  });
  applyBordersAndAlt(wsInst);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 5 — ÉQUIPEMENTS IT
  // ═══════════════════════════════════════════════════════════════════════════
  const wsEq = wb.addWorksheet('Équipements', {
    properties: { tabColor: { argb: C.amber } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsEq.columns = [
    { header: 'Désignation',  key: 'name',    width: 28 },
    { header: 'Type',          key: 'type',    width: 15 },
    { header: 'Marque',        key: 'brand',   width: 15 },
    { header: 'Modèle',       key: 'model',   width: 15 },
    { header: 'Site',          key: 'site',    width: 14 },
    { header: 'Statut',       key: 'st',      width: 16 },
    { header: 'N° Série',     key: 'serial',  width: 18 },
    { header: 'Propriétaire', key: 'owner',   width: 20 },
    { header: 'Affecté à',    key: 'assign',  width: 20 },
  ];
  styleHeaderRow(wsEq.getRow(1), C.amber);

  filtEq.forEach((e: any) => {
    const stLabel = e.status === 'operational' ? 'OPÉRATIONNEL'
                  : e.status === 'faulty'       ? 'EN PANNE'
                  : e.status === 'maintenance'  ? 'MAINTENANCE'
                  : e.status ?? '';
    const row = wsEq.addRow({
      name:   e.name ?? '',
      type:   e.type ?? '',
      brand:  e.brand ?? '',
      model:  e.model ?? '',
      site:   e.site ?? '',
      st:     stLabel,
      serial: e.serial_number ?? '',
      owner:  e.owner ?? '',
      assign: e.assignment ?? '',
    });
    row.alignment = { vertical: 'middle' };
    const cfg = eqStatusCfg(e.status ?? '');
    colorCell(row.getCell('st'), cfg.bg, cfg.tx);
  });
  applyBordersAndAlt(wsEq);

  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 6 — AGENTS IT
  // ═══════════════════════════════════════════════════════════════════════════
  const wsAg = wb.addWorksheet('Agents IT', {
    properties: { tabColor: { argb: C.gray } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  wsAg.columns = [
    { header: 'Nom complet', key: 'name',   width: 28 },
    { header: 'Rôle',        key: 'role',   width: 16 },
    { header: 'Site',        key: 'site',   width: 16 },
    { header: 'Fonction',    key: 'fn',     width: 22 },
    { header: 'Statut',     key: 'st',     width: 12 },
  ];
  styleHeaderRow(wsAg.getRow(1), C.gray);

  (rawAgents ?? []).forEach((a: any) => {
    const row = wsAg.addRow({
      name: a.full_name ?? '',
      role: a.role ?? '',
      site: a.site ?? '',
      fn:   a.fonction ?? '',
      st:   a.status ?? '',
    });
    row.alignment = { vertical: 'middle' };
    if (a.status === 'active') colorCell(row.getCell('st'), C.bgGreen, C.txGreen);
    else                       colorCell(row.getCell('st'), C.bgRed,   C.txRed);
  });
  applyBordersAndAlt(wsAg);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const buffer  = await wb.xlsx.writeBuffer();
  const blob    = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const dateStr = new Date().toISOString().split('T')[0];
  saveAs(blob, `ATS_ITControl_${dateStr}_${dateFrom}_${dateTo}.xlsx`);
}
