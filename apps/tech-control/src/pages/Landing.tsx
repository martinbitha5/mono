import { Link } from '@tanstack/react-router';
import {
  Wrench, Truck, AlertTriangle, Users, Droplets,
  ArrowRight, CheckCircle2, BarChart3, Shield,
  Activity, ChevronRight, RefreshCw, FileSpreadsheet,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Truck,
    title: 'Parc GSE',
    desc: 'Inventaire complet de vos engins. Horamètre, statut OP/INOP, marque et type — tout en temps réel par site.',
    color: 'orange',
  },
  {
    icon: Wrench,
    title: 'Maintenance planifiée',
    desc: 'Ne ratez plus jamais une révision. Alertes automatiques basées sur les intervalles horamètre de chaque engin.',
    color: 'amber',
  },
  {
    icon: AlertTriangle,
    title: 'Interventions',
    desc: 'Signalez, assignez et résolvez les pannes en temps réel. Priorités critique, moyen et faible avec historique complet.',
    color: 'red',
  },
  {
    icon: Droplets,
    title: 'Gestion Carburant',
    desc: 'Stocks par site, consommations par engin, approvisionnements tracés. Alertes de seuil et historique détaillé.',
    color: 'blue',
  },
  {
    icon: Users,
    title: 'Présences',
    desc: 'Pointage journalier de toute l\'équipe technique. Statut présent, en retard ou absent — par site et par période.',
    color: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'Rapports Excel',
    desc: 'Export professionnel multi-feuilles avec couleurs et titres : GSE, interventions, carburant, présences — par période.',
    color: 'purple',
  },
];

const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
  orange:  { icon: 'text-orange-500',  bg: 'bg-orange-50',  border: 'border-orange-200'  },
  amber:   { icon: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  red:     { icon: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200'     },
  blue:    { icon: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  purple:  { icon: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-200'  },
};

export function TechLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A2540] overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4
        bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#0A2540] leading-none tracking-tight">ATS Tech Control</p>
            <p className="hidden sm:block text-[10px] text-[#697386] leading-none mt-0.5">Service Technique · RDC</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#features" className="hidden sm:block text-[13px] text-[#425466] hover:text-[#0A2540] transition-colors font-medium">
            Fonctionnalités
          </a>
          <Link
            to="/login"
            className="flex items-center gap-1.5 sm:gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white
              text-[12px] sm:text-[13px] font-semibold rounded-lg px-3 sm:px-4 py-2 transition-all shadow-md shadow-orange-200"
          >
            Se connecter <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none">
          <div
            className="absolute top-0 left-0 right-0 h-full"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 60% -10%, rgba(251,146,60,0.18) 0%, rgba(251,191,36,0.10) 40%, transparent 70%)',
            }}
          />
          <div className="absolute top-[-80px] right-[-60px] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-orange-100 blur-[130px] opacity-80" />
          <div className="absolute top-[200px] left-[-80px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full bg-amber-50 blur-[110px]" />
          <div className="absolute bottom-0 right-[20%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] rounded-full bg-orange-50 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 py-14 sm:py-20 lg:py-24">
          <div className="max-w-[800px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-3 sm:px-4 py-1.5 mb-6 sm:mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-[12px] text-orange-600 font-semibold tracking-wide">
                Plateforme opérationnelle · ATS Handling RDC
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[52px] lg:text-[76px] font-black text-[#0A2540] leading-[1.06] tracking-[-0.02em] mb-4 sm:mb-6">
              Gérez chaque engin.<br />
              <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 bg-clip-text text-transparent">
                Anticipez chaque panne.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[15px] sm:text-[17px] lg:text-[20px] text-[#425466] leading-relaxed max-w-[580px] mb-7 sm:mb-10">
              La plateforme centralisée pour le service technique d'ATS Handling RDC.
              Parc GSE, maintenance, interventions, carburant et présences — tout en un seul écran.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 sm:mb-14">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                  text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-7 py-3 sm:py-3.5 transition-all
                  shadow-xl shadow-orange-200/80"
              >
                Accéder à l'application
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center sm:justify-start gap-2 text-[#425466] hover:text-[#0A2540] text-[14px] sm:text-[15px] font-medium transition-colors px-2 py-3"
              >
                Voir les fonctionnalités <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-7 gap-y-2.5 pt-6 sm:pt-8 border-t border-gray-200">
              {[
                { icon: Shield,          label: 'Accès sécurisé par rôle'    },
                { icon: RefreshCw,       label: 'Refresh temps réel — 15 s'  },
                { icon: FileSpreadsheet, label: 'Export Excel professionnel'  },
                { icon: Activity,        label: '8 sites couverts · RDC'      },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-[11px] sm:text-[12px] text-[#697386]">
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── App mockup ── */}
      <section className="py-14 sm:py-20 bg-[#F6F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-[11px] text-[#697386] font-semibold uppercase tracking-[0.14em] mb-3">Interface</p>
            <h2 className="text-[26px] sm:text-[34px] font-bold text-[#0A2540] tracking-tight">Conçu pour l'opérationnel</h2>
            <p className="text-[14px] sm:text-[15px] text-[#425466] mt-3 max-w-xl mx-auto">
              Pas de formation requise — chaque technicien prend en main l'outil en quelques minutes.
            </p>
          </div>

          {/* Browser mockup */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.12)] ring-1 ring-gray-100">
            {/* Chrome bar */}
            <div className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-gray-100 border-b border-gray-200">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28CA42]" />
              <div className="flex-1 mx-2 sm:mx-4 max-w-[180px] sm:max-w-[260px] bg-white border border-gray-200 rounded-md h-5 sm:h-6 flex items-center gap-2 px-2 sm:px-3">
                <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-mono truncate">tech.ats-handling.cd/gse</span>
              </div>
            </div>

            <div className="flex h-[260px] sm:h-[380px] lg:h-[460px] overflow-hidden">
              {/* Sidebar — hidden on mobile */}
              <div className="hidden sm:flex w-[160px] lg:w-[190px] flex-shrink-0 bg-[#0A0A0D] border-r border-white/[0.06] p-3 flex-col gap-0.5">
                <div className="flex items-center gap-2 px-2 py-2.5 mb-2">
                  <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center">
                    <Wrench className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-300">Tech Control</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-orange-500/[0.12] border border-orange-500/[0.15]">
                  <Truck className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[11px] font-semibold text-orange-300">Parc GSE</span>
                </div>
                {[
                  { label: 'Maintenance',   icon: Wrench       },
                  { label: 'Interventions', icon: AlertTriangle },
                  { label: 'Carburant',     icon: Droplets     },
                  { label: 'Présences',     icon: Users        },
                  { label: 'Rapports',      icon: BarChart3    },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg opacity-50">
                    <Icon className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[11px] text-zinc-500">{label}</span>
                  </div>
                ))}
                <div className="mt-auto pt-3 border-t border-white/[0.05]">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-orange-400">AT</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-400 truncate">Agent Tech</p>
                      <p className="text-[9px] text-zinc-600">Kinshasa · tech</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main — dark app */}
              <div className="flex-1 bg-[#09090B] p-3 sm:p-5 overflow-hidden space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] sm:text-[14px] font-bold text-zinc-100">Parc GSE</p>
                    <p className="text-[10px] sm:text-[11px] text-zinc-600">24 équipements · 5 alertes</p>
                  </div>
                  <div className="h-6 px-2.5 sm:px-3 bg-orange-500 rounded-md flex items-center">
                    <span className="text-[10px] font-semibold text-white">+ Ajouter</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {[
                    { label: 'Total',         value: '24', cls: 'text-zinc-200'    },
                    { label: 'Opér.',         value: '21', cls: 'text-emerald-400' },
                    { label: 'INOP',          value: '3',  cls: 'text-red-400'     },
                    { label: 'Alertes',       value: '5',  cls: 'text-amber-400'   },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0D0D10] border border-white/[0.06] rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <p className="text-[8px] sm:text-[9px] text-zinc-600 font-semibold uppercase tracking-[0.04em] sm:tracking-[0.06em] mb-1 truncate">{s.label}</p>
                      <p className={`text-[16px] sm:text-[20px] font-black leading-none tabular-nums ${s.cls}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2.5">
                  {[
                    { name: 'TRACTOR 01', serie: 'AT-122 · TLD', statut: 'OP',   bar: 90,  delta: '+12h', dCls: 'text-red-400',     bCls: 'bg-red-500',     lCls: 'border-l-red-500'     },
                    { name: 'GPU-02',     serie: 'GP-044 · ITW', statut: 'OP',   bar: 45,  delta: '-85h', dCls: 'text-emerald-400', bCls: 'bg-emerald-500', lCls: 'border-l-emerald-400' },
                    { name: 'PUSHBACK',   serie: 'PB-007',       statut: 'INOP', bar: 100, delta: '+3h',  dCls: 'text-red-400',     bCls: 'bg-red-500',     lCls: 'border-l-red-500'     },
                  ].map((eq, i) => (
                    <div key={eq.serie} className={`bg-[#0D0D10] border border-white/[0.05] rounded-xl p-3 border-l-2 ${eq.lCls} ${i > 0 ? 'hidden sm:block' : ''}`}>
                      <div className="flex items-start justify-between mb-2.5">
                        <div>
                          <p className="text-[11px] font-bold text-zinc-200 leading-tight">{eq.name}</p>
                          <p className="text-[9px] text-zinc-600 mt-0.5">{eq.serie}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          eq.statut === 'OP' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{eq.statut}</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full ${eq.bCls}`} style={{ width: `${eq.bar}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-zinc-700">Delta rév.</span>
                        <span className={eq.dCls}>{eq.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-amber-500/[0.07] border border-amber-500/[0.18] rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] text-amber-400 font-medium">5 engins nécessitent une révision prochaine</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-[11px] text-[#697386] font-semibold uppercase tracking-[0.14em] mb-3">Fonctionnalités</p>
            <h2 className="text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-[#0A2540] tracking-tight leading-tight">
              Tout ce dont votre équipe<br />technique a besoin
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#425466] mt-4 max-w-xl mx-auto leading-relaxed">
              De la gestion d'engins à l'export Excel, chaque module est pensé pour le terrain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f) => {
              const cfg = colorMap[f.color];
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group bg-white border border-gray-200 rounded-2xl p-5 sm:p-6
                    hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mb-4 sm:mb-5`}>
                    <Icon className={`w-5 h-5 ${cfg.icon}`} />
                  </div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-[#0A2540] mb-2">{f.title}</h3>
                  <p className="text-[13px] text-[#425466] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="py-12 sm:py-16 bg-[#F6F9FC] border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 text-center">
            {[
              { value: '8',    title: 'Sites opérationnels',   sub: 'Kinshasa, Lubumbashi, Goma…'         },
              { value: '24/7', title: 'Surveillance continue',  sub: 'Données rafraîchies toutes les 15 s' },
              { value: '100%', title: 'Carburant tracé',        sub: 'Chaque litre suivi et horodaté'      },
              { value: 'RDC',  title: 'Couverture nationale',   sub: 'Déployé sur tout le réseau ATS'      },
            ].map(s => (
              <div key={s.title}>
                <p className="text-[38px] sm:text-[48px] lg:text-[52px] font-black text-[#0A2540] leading-none mb-2 tabular-nums">{s.value}</p>
                <p className="text-[13px] sm:text-[14px] font-semibold text-[#0A2540] mb-1">{s.title}</p>
                <p className="text-[11px] sm:text-[12px] text-[#697386] leading-snug">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust section ── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] text-[#697386] font-semibold uppercase tracking-[0.14em] mb-4">Fiabilité</p>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-[#0A2540] tracking-tight leading-tight mb-5 sm:mb-6">
                Sécurisé, rapide<br />et toujours disponible
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#425466] leading-relaxed mb-6 sm:mb-8">
                Construit sur Supabase avec contrôle d'accès par rôle. Chaque agent accède uniquement à ses données.
                Les superviseurs ont une vision globale multi-sites en temps réel.
              </p>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { title: 'Contrôle d\'accès par rôle',    desc: 'Admin, superviseur, agent technique — chacun voit exactement ce qui le concerne.' },
                  { title: 'Synchronisation temps réel',     desc: 'Rafraîchissement automatique toutes les 15 secondes. Aucun rechargement manuel.' },
                  { title: 'Export Excel professionnel',     desc: 'Rapport multi-feuilles avec couleurs, titres et statistiques prêt pour la direction.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-orange-100 border border-orange-200
                      flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[13px] sm:text-[14px] font-semibold text-[#0A2540]">{item.title}</p>
                      <p className="text-[12px] sm:text-[13px] text-[#425466] mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist mockup */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-lg shadow-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div>
                  <p className="text-[13px] font-semibold text-[#0A2540]">Daily Checklist</p>
                  <p className="text-[11px] text-[#697386] mt-0.5">TRACTOR 01 · AT-122</p>
                </div>
                <span className="text-[10px] text-[#697386] bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                  06:32 · Kinshasa
                </span>
              </div>
              <div className="space-y-0">
                {[
                  { item: 'Niveau huile moteur',     ok: true  },
                  { item: 'Pression pneus avant',    ok: true  },
                  { item: 'Pression pneus arrière',  ok: true  },
                  { item: 'Éclairages fonctionnels', ok: true  },
                  { item: 'Extincteur à bord',       ok: false },
                  { item: 'Carnet de bord à jour',   ok: false },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                      c.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      {c.ok && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    </div>
                    <span className={`text-[13px] ${
                      c.ok ? 'text-gray-400 line-through decoration-gray-300' : 'text-[#0A2540]'
                    }`}>{c.item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-1">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-[#697386]">Progression</span>
                  <span className="text-[#0A2540] font-semibold">4 / 6 items</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: '67%' }} />
                </div>
                <p className="text-[10px] text-[#697386] mt-1.5">67% — 2 points à vérifier avant mise en service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative py-16 sm:py-24 lg:py-28 bg-[#0A2540] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 right-[-100px] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-orange-500/[0.12] blur-[120px]" />
          <div className="absolute bottom-[-100px] left-[-50px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full bg-amber-400/[0.08] blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-[11px] text-orange-400 font-semibold uppercase tracking-[0.14em] mb-4 sm:mb-5">Prêt à commencer ?</p>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-white tracking-tight leading-tight mb-4">
            Votre équipe technique<br />mérite les bons outils.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-blue-200/70 mb-8 sm:mb-10 leading-relaxed">
            Connectez-vous et prenez le contrôle de votre parc GSE, de votre maintenance
            et de vos interventions — dès maintenant.
          </p>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400
              text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-8 py-3.5 sm:py-4 transition-all shadow-xl shadow-orange-900/40"
          >
            Accéder à l'application
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0A2540] border-t border-white/[0.08] py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center flex-shrink-0">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-[12px] text-blue-200/60">ATS Tech Control</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-[12px] text-blue-200/40">
            <span>ATS Handling RDC</span>
            <span>© {new Date().getFullYear()}</span>
            <span>Accès réservé au personnel autorisé</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
