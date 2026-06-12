import { Link } from '@tanstack/react-router';
import {
  MonitorCheck, AlertTriangle, Package, Users, CalendarDays, FileSpreadsheet,
  ArrowRight, ArrowUpRight, Check,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   ATS IT CONTROL — Landing
   Direction : console opérationnelle industrielle.
   Fond noir uni, bordures 1px, micro-labels monospace, un seul accent.
═══════════════════════════════════════════════════════════════════ */

const MODULES = [
  { n: '01', icon: MonitorCheck,    title: 'Installations',  desc: 'Validation quotidienne des systèmes d’enregistrement par site. Check-in, BRS, réseau — statut consolidé.' },
  { n: '02', icon: AlertTriangle,   title: 'Incidents',      desc: 'Signalement, assignation et résolution des incidents IT. Priorités critique / moyen / faible, historique complet.' },
  { n: '03', icon: Package,         title: 'Équipements',    desc: 'Inventaire du matériel informatique par site. Statut opérationnel, en panne ou en maintenance.' },
  { n: '04', icon: Users,           title: 'Présences',      desc: 'Pointage journalier des équipes IT. Statut présent, retard ou absent — consolidé par site.' },
  { n: '05', icon: CalendarDays,    title: 'Planning',       desc: 'Organisation des shifts et des rotations d’équipe. Vue hebdomadaire par site et par agent.' },
  { n: '06', icon: FileSpreadsheet, title: 'Rapports',       desc: 'Export Excel multi-feuilles : incidents, installations, équipements, présences. Prêt pour la direction.' },
];

const SPECS = [
  { k: 'ACCÈS',         v: 'Contrôle par rôle — admin, superviseur, agent (RLS Supabase)' },
  { k: 'SYNCHRO',       v: 'Rafraîchissement automatique toutes les 15 secondes' },
  { k: 'COUVERTURE',    v: '8 sites opérationnels — réseau ATS Handling RDC' },
  { k: 'VALIDATION',    v: 'Installations contrôlées chaque matin avant ouverture' },
  { k: 'EXPORT',        v: 'XLSX multi-feuilles, mise en forme professionnelle' },
  { k: 'DISPONIBILITÉ', v: 'Surveillance continue 24 h / 24 — 7 j / 7' },
];

/* Données factices pour l'aperçu produit */
const PREVIEW_ROWS = [
  { dot: 'bg-red-400',     name: 'Switch HS — salle serveur',          site: 'Kinshasa',   tag: 'CRITIQUE', tagCls: 'text-red-600 border-red-200' },
  { dot: 'bg-amber-400',   name: 'Imprimante BP non détectée',         site: 'Lubumbashi', tag: 'EN COURS', tagCls: 'text-amber-600 border-amber-200' },
  { dot: 'bg-emerald-400', name: 'Check-in T1 — installation validée', site: 'Goma',       tag: 'VALIDÉ',   tagCls: 'text-emerald-600 border-emerald-200' },
  { dot: 'bg-amber-400',   name: 'VSAT — latence élevée',              site: 'Kisangani',  tag: 'EN COURS', tagCls: 'text-amber-600 border-amber-200' },
  { dot: 'bg-emerald-400', name: 'Poste agent remplacé — quai 3',      site: 'Kinshasa',   tag: 'RÉSOLU',   tagCls: 'text-emerald-600 border-emerald-200' },
];

export function ITLandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F5FA] text-zinc-800 antialiased" style={{ scrollBehavior: 'smooth' }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 border-b border-[#E6E8F0] bg-[#F4F5FA]/90 backdrop-blur-md">
        <div className="max-w-[1180px] mx-auto h-full px-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-500 flex-shrink-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 35% 100%, 0 65%)' }} />
            <span className="font-mono text-[12px] font-semibold tracking-[0.14em] text-zinc-900">
              ATS<span className="text-zinc-400 mx-1">/</span>IT CONTROL
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#modules" className="hidden sm:block text-[13px] text-zinc-500 hover:text-zinc-800 transition-colors">Modules</a>
            <a href="#plateforme" className="hidden sm:block text-[13px] text-zinc-500 hover:text-zinc-800 transition-colors">Plateforme</a>
            <Link
              to="/login"
              className="h-8 px-4 inline-flex items-center gap-2 bg-zinc-50 hover:bg-white text-zinc-950 text-[13px] font-medium rounded-md transition-colors"
            >
              Se connecter
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <header className="pt-36 sm:pt-44 pb-16 sm:pb-20">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-1.5 h-1.5 bg-blue-400" />
            <p className="font-mono text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
              ATS Handling RDC — Service Informatique
            </p>
          </div>

          <h1 className="text-[40px] sm:text-[58px] lg:text-[68px] font-semibold tracking-[-0.03em] leading-[1.04] text-zinc-900 max-w-[820px]">
            L'infrastructure IT, sous contrôle permanent<span className="text-blue-600">.</span>
          </h1>

          <p className="mt-6 text-[15px] sm:text-[16px] text-zinc-500 leading-relaxed max-w-[560px]">
            Installations, incidents, équipements et présences — une plateforme unique
            pour le service informatique, sur les 8 sites du réseau.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="h-11 px-6 inline-flex items-center justify-center gap-2.5 bg-blue-500 hover:bg-blue-600 text-white text-[14px] font-medium rounded-md transition-colors"
            >
              Accéder à la plateforme
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#modules"
              className="h-11 px-6 inline-flex items-center justify-center gap-2 border border-[#E6E8F0] hover:border-[#E6E8F0] text-zinc-700 hover:text-zinc-900 text-[14px] font-medium rounded-md transition-colors"
            >
              Explorer les modules
            </a>
          </div>
        </div>

        {/* Métriques — bande mono sous le hero */}
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 mt-16 sm:mt-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-[#E6E8F0] divide-x divide-[#EEF0F6]">
            {[
              { v: '08',   l: 'Sites opérationnels' },
              { v: '24/7', l: 'Surveillance continue' },
              { v: '15 s', l: 'Cycle de synchronisation' },
              { v: '100%', l: 'Incidents tracés' },
            ].map((m, i) => (
              <div key={m.l} className={['py-6 px-5 sm:px-7', i >= 2 ? 'border-t border-[#E6E8F0] lg:border-t-0' : ''].join(' ')}>
                <p className="font-mono text-[26px] sm:text-[30px] text-zinc-900 tabular-nums leading-none">{m.v}</p>
                <p className="mt-2.5 font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase">{m.l}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── APERÇU PRODUIT ──────────────────────────────── */}
      <section className="pb-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <div className="rounded-xl border border-[#E6E8F0] bg-white overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            {/* Barre de titre */}
            <div className="h-10 flex items-center justify-between px-4 border-b border-[#E6E8F0]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E6E8F0]" />
                <span className="w-2 h-2 rounded-full bg-[#E6E8F0]" />
                <span className="w-2 h-2 rounded-full bg-[#E6E8F0]" />
              </div>
              <span className="font-mono text-[11px] text-zinc-400">it-control — tableau de bord</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            {/* KPI factices */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#F4F5FA]">
              {[
                { l: 'PRÉSENTS',        v: '18',  c: 'text-zinc-900' },
                { l: 'INCIDENTS',       v: '03',  c: 'text-red-600' },
                { l: 'INSTALLATIONS',   v: '7/8', c: 'text-emerald-600' },
                { l: 'ÉQUIP. EN PANNE', v: '02',  c: 'text-amber-600' },
              ].map(k => (
                <div key={k.l} className="bg-white px-4 sm:px-5 py-4">
                  <p className="font-mono text-[9px] tracking-[0.16em] text-zinc-400">{k.l}</p>
                  <p className={['mt-1.5 font-mono text-[20px] sm:text-[22px] tabular-nums leading-none', k.c].join(' ')}>{k.v}</p>
                </div>
              ))}
            </div>
            {/* Table factice */}
            <div className="border-t border-[#E6E8F0]">
              <div className="hidden sm:grid grid-cols-[14px_1fr_110px_90px] gap-4 px-5 py-2.5 border-b border-[#E6E8F0]">
                {['', 'ÉVÉNEMENT', 'SITE', 'STATUT'].map((h, i) => (
                  <span key={i} className="font-mono text-[9px] tracking-[0.16em] text-zinc-400">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-[#EEF0F6]">
                {PREVIEW_ROWS.map(r => (
                  <div key={r.name} className="flex sm:grid sm:grid-cols-[14px_1fr_110px_90px] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3">
                    <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', r.dot].join(' ')} />
                    <span className="text-[12px] sm:text-[13px] text-zinc-700 font-medium truncate flex-1 sm:flex-none">{r.name}</span>
                    <span className="hidden sm:block text-[12px] text-zinc-400">{r.site}</span>
                    <span className={['font-mono text-[10px] border px-1.5 py-0.5 rounded w-fit', r.tagCls].join(' ')}>{r.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-center font-mono text-[10px] tracking-[0.14em] text-zinc-300 uppercase">
            Aperçu — données illustratives
          </p>
        </div>
      </section>

      {/* ── MODULES ─────────────────────────────────────── */}
      <section id="modules" className="py-20 sm:py-24 border-t border-[#E6E8F0]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="font-mono text-[11px] tracking-[0.22em] text-blue-600 uppercase mb-3">Modules</p>
              <h2 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-zinc-900 leading-tight">
                Six modules. Une seule plateforme.
              </h2>
            </div>
            <p className="text-[13px] text-zinc-400 max-w-[300px] leading-relaxed sm:text-right">
              Chaque module est conçu pour le terrain et alimenté en temps réel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E6E8F0] border border-[#E6E8F0] rounded-xl overflow-hidden">
            {MODULES.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.n} className="group bg-[#F4F5FA] hover:bg-white p-6 sm:p-7 transition-colors">
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-mono text-[11px] text-zinc-300 group-hover:text-blue-600 transition-colors">{m.n}</span>
                    <Icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-500 transition-colors" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-2">{m.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PHOTO TERRAIN ───────────────────────────────── */}
      <section className="pb-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <div className="rounded-xl border border-[#E6E8F0] overflow-hidden">
            <img
              src="/IMG_9478.jpeg"
              alt="Opérations — ATS Handling"
              className="w-full h-[260px] sm:h-[400px] object-cover saturate-[0.75] contrast-[1.02]"
            />
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-[#E6E8F0] bg-white">
              <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.14em] text-zinc-500 uppercase">Infrastructure aéroportuaire</span>
              <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.14em] text-zinc-400 uppercase">ATS Handling · RDC</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATEFORME / SPEC ───────────────────────────── */}
      <section id="plateforme" className="py-20 sm:py-24 border-t border-[#E6E8F0]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-blue-600 uppercase mb-3">Plateforme</p>
            <h2 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-zinc-900 leading-tight mb-5">
              Conçue pour la fiabilité opérationnelle.
            </h2>
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-8 max-w-[460px]">
              Chaque agent accède exactement à ce qui le concerne. Les superviseurs disposent
              d'une vision consolidée multi-sites, rafraîchie en continu — sans rechargement manuel.
            </p>
            <div className="space-y-4">
              {[
                'Authentification sécurisée et permissions par rôle',
                'Données temps réel sur l’ensemble des 8 sites',
                'Historique complet : incidents, installations, équipements',
                'Rapports Excel prêts pour la direction',
              ].map(t => (
                <div key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 w-4 h-4 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-blue-600" strokeWidth={3} />
                  </span>
                  <span className="text-[13px] text-zinc-500 leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fiche technique */}
          <div className="border border-[#E6E8F0] rounded-xl overflow-hidden self-start">
            <div className="px-5 py-3.5 border-b border-[#E6E8F0] bg-white">
              <span className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">Fiche technique</span>
            </div>
            <div className="divide-y divide-[#EEF0F6]">
              {SPECS.map(s => (
                <div key={s.k} className="grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-4 px-5 py-3.5">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-400 uppercase pt-0.5">{s.k}</span>
                  <span className="text-[13px] text-zinc-700 leading-snug">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
          <div className="border border-[#E6E8F0] rounded-xl bg-white px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-900 leading-tight">
                Prêt à prendre le contrôle ?
              </h3>
              <p className="mt-2 text-[14px] text-zinc-500">
                Connectez-vous avec vos identifiants ATS Handling.
              </p>
            </div>
            <Link
              to="/login"
              className="h-11 px-6 inline-flex items-center gap-2.5 bg-zinc-50 hover:bg-white text-zinc-950 text-[14px] font-medium rounded-md transition-colors flex-shrink-0"
            >
              Se connecter
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-[#E6E8F0] py-8">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 35% 100%, 0 65%)' }} />
            <span className="font-mono text-[11px] tracking-[0.14em] text-zinc-500">ATS / IT CONTROL</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
            <span>ATS Handling RDC</span>
            <span>© {new Date().getFullYear()}</span>
            <span>Accès réservé au personnel autorisé</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
