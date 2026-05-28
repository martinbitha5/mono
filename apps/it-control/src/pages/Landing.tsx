import { Link } from '@tanstack/react-router';
import {
  Plane, Monitor, Server, Wifi, Users, Calendar, BarChart3,
  ArrowRight, CheckCircle2, Shield,
  Activity, ChevronRight, RefreshCw, FileSpreadsheet, MessageSquare,
  AlertTriangle, Package,
} from 'lucide-react';

const FEATURES = [
  {
    icon: AlertTriangle,
    title: 'Incidents IT',
    desc: 'Signalez et gérez les tickets d\'incidents. Assignation, priorité critique/moyen/faible et suivi en temps réel.',
    color: 'red',
  },
  {
    icon: Server,
    title: 'Équipements',
    desc: 'Inventaire complet du matériel IT. Numéro de série, marque, état et affectation par site.',
    color: 'blue',
  },
  {
    icon: Wifi,
    title: 'Installations',
    desc: 'Suivi de chaque intervention d\'installation réseau et matériel. Statut, responsable et historique.',
    color: 'purple',
  },
  {
    icon: Users,
    title: 'Présences',
    desc: 'Pointage journalier du personnel IT. Vue équipe par site — présent, en retard ou absent.',
    color: 'emerald',
  },
  {
    icon: Calendar,
    title: 'Planning',
    desc: 'Organisez les interventions et congés de l\'équipe. Vue calendrier hebdomadaire par agent.',
    color: 'amber',
  },
  {
    icon: MessageSquare,
    title: 'Forum interne',
    desc: 'Communication d\'équipe intégrée. Discussions par sujet pour coordonner sans quitter la plateforme.',
    color: 'teal',
  },
];

const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
  red:     { icon: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200'     },
  blue:    { icon: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
  purple:  { icon: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-200'  },
  emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  amber:   { icon: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  teal:    { icon: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200'    },
};

export function ITLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A2540] overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4
        bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-100 flex-shrink-0">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#0A2540] leading-none tracking-tight">ATS IT Control</p>
            <p className="hidden sm:block text-[10px] text-[#697386] leading-none mt-0.5">Service Informatique · RDC</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#features" className="hidden sm:block text-[13px] text-[#425466] hover:text-[#0A2540] transition-colors font-medium">
            Fonctionnalités
          </a>
          <Link
            to="/login"
            className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white
              text-[12px] sm:text-[13px] font-semibold rounded-lg px-3 sm:px-4 py-2 transition-all shadow-md shadow-blue-100"
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
              background: 'radial-gradient(ellipse 80% 60% at 70% -10%, rgba(59,130,246,0.16) 0%, rgba(99,102,241,0.09) 40%, transparent 70%)',
            }}
          />
          <div className="absolute top-[-80px] right-[-60px] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-blue-100 blur-[130px] opacity-80" />
          <div className="absolute top-[200px] left-[-80px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full bg-indigo-50 blur-[110px]" />
          <div className="absolute bottom-0 right-[20%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] rounded-full bg-cyan-50 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 py-14 sm:py-20 lg:py-24">
          <div className="max-w-[800px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 sm:px-4 py-1.5 mb-6 sm:mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-[12px] text-blue-700 font-semibold tracking-wide">
                Plateforme IT centralisée · ATS Handling RDC
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[52px] lg:text-[76px] font-black text-[#0A2540] leading-[1.06] tracking-[-0.02em] mb-4 sm:mb-6">
              Maîtrisez chaque incident.<br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Chaque équipement. Chaque site.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[15px] sm:text-[17px] lg:text-[20px] text-[#425466] leading-relaxed max-w-[580px] mb-7 sm:mb-10">
              La plateforme IT centralisée pour ATS Handling RDC.
              Incidents, installations, équipements et présences — supervisés en temps réel sur tous les sites.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 sm:mb-14">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                  text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-7 py-3 sm:py-3.5 transition-all
                  shadow-xl shadow-blue-100"
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
                { icon: Shield,          label: 'Accès sécurisé par rôle' },
                { icon: RefreshCw,       label: 'Données en temps réel'   },
                { icon: FileSpreadsheet, label: 'Rapports Excel avancés'  },
                { icon: Activity,        label: '8 sites · Réseau RDC'    },
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
            <h2 className="text-[26px] sm:text-[34px] font-bold text-[#0A2540] tracking-tight">Tableau de bord opérationnel</h2>
            <p className="text-[14px] sm:text-[15px] text-[#425466] mt-3 max-w-xl mx-auto">
              Vision globale de l'état IT sur tous vos sites — en un coup d'œil.
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
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-mono truncate">it.ats-handling.cd/dashboard</span>
              </div>
            </div>

            <div className="flex h-[260px] sm:h-[380px] lg:h-[460px] overflow-hidden">
              {/* Sidebar — hidden on mobile */}
              <div className="hidden sm:flex w-[160px] lg:w-[190px] flex-shrink-0 bg-[#0A0A0D] border-r border-white/[0.05] p-3 flex-col gap-0.5">
                <div className="flex items-center gap-2 px-2 py-2.5 mb-2">
                  <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
                    <Plane className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-300">IT Control</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-blue-600/[0.12] border border-blue-500/[0.15]">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-semibold text-blue-300">Dashboard</span>
                </div>
                {[
                  { label: 'Incidents',    icon: AlertTriangle },
                  { label: 'Équipements', icon: Package       },
                  { label: 'Présences',   icon: Users         },
                  { label: 'Planning',    icon: Calendar      },
                  { label: 'Forum',       icon: MessageSquare },
                  { label: 'Rapports',    icon: BarChart3     },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg opacity-50">
                    <Icon className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[11px] text-zinc-500">{label}</span>
                  </div>
                ))}
                <div className="mt-auto pt-3 border-t border-white/[0.05]">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-blue-400">IT</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-400 truncate">Agent IT</p>
                      <p className="text-[9px] text-zinc-600">Kinshasa · it</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main — dark */}
              <div className="flex-1 bg-[#09090B] p-3 sm:p-5 overflow-hidden space-y-3 sm:space-y-4">
                <div>
                  <p className="text-[13px] sm:text-[14px] font-bold text-zinc-100">Tableau de bord</p>
                  <p className="text-[10px] sm:text-[11px] text-zinc-600">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {[
                    { label: 'Incidents',  value: '7',  cls: 'text-red-400'     },
                    { label: 'Critiques',  value: '2',  cls: 'text-red-500'     },
                    { label: 'Équipements', value: '84', cls: 'text-blue-400'   },
                    { label: 'Présences',  value: '12', cls: 'text-emerald-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0D0D10] border border-white/[0.06] rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <p className="text-[8px] sm:text-[9px] text-zinc-600 font-semibold uppercase tracking-[0.04em] mb-1 truncate">{s.label}</p>
                      <p className={`text-[16px] sm:text-[20px] font-black leading-none tabular-nums ${s.cls}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0D0D10] border border-white/[0.06] rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_56px_60px_70px] sm:grid-cols-[1fr_80px_80px_90px] gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-white/[0.05] bg-[#111116]">
                    {['Incident', 'Site', 'Priorité', 'Statut'].map(h => (
                      <span key={h} className="text-[8px] sm:text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.06em] sm:tracking-[0.08em] truncate">{h}</span>
                    ))}
                  </div>
                  {[
                    { title: 'Switch réseau hors service',  site: 'KIN', priority: 'critique', status: 'ouvert',   pCls: 'bg-red-500/10 text-red-400',           sCls: 'bg-amber-500/10 text-amber-400'    },
                    { title: 'Imprimante bureau HS',        site: 'LUB', priority: 'moyen',    status: 'en cours', pCls: 'bg-amber-500/10 text-amber-400',       sCls: 'bg-blue-500/10 text-blue-400'      },
                    { title: 'Accès VPN agent bloqué',      site: 'GOM', priority: 'critique', status: 'ouvert',   pCls: 'bg-red-500/10 text-red-400',           sCls: 'bg-amber-500/10 text-amber-400'    },
                    { title: 'Mise à jour antivirus',       site: 'KIN', priority: 'faible',   status: 'résolu',   pCls: 'bg-zinc-700/50 text-zinc-500',         sCls: 'bg-emerald-500/10 text-emerald-400'},
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_56px_60px_70px] sm:grid-cols-[1fr_80px_80px_90px] gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/[0.03] last:border-0 items-center">
                      <span className="text-[10px] sm:text-[11px] text-zinc-300 truncate">{row.title}</span>
                      <span className="text-[9px] sm:text-[10px] text-zinc-600 font-mono">{row.site}</span>
                      <span className={`text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-md inline-block truncate ${row.pCls}`}>{row.priority}</span>
                      <span className={`text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-md inline-block truncate ${row.sCls}`}>{row.status}</span>
                    </div>
                  ))}
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
              Tout ce dont votre équipe<br />informatique a besoin
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#425466] mt-4 max-w-xl mx-auto leading-relaxed">
              De la gestion d'incidents aux rapports de direction, chaque module est pensé pour le quotidien IT.
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
              { value: '8',    title: 'Sites IT supervisés',   sub: 'Kinshasa, Lubumbashi, Goma…'          },
              { value: '100%', title: 'Équipements tracés',    sub: 'Chaque device inventorié et suivi'     },
              { value: '24/7', title: 'Surveillance continue', sub: 'Incidents signalés en temps réel'      },
              { value: '0',    title: 'Incident non suivi',    sub: 'Chaque ticket a un statut et un responsable' },
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
              <p className="text-[11px] text-[#697386] font-semibold uppercase tracking-[0.14em] mb-4">Sécurité & fiabilité</p>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-[#0A2540] tracking-tight leading-tight mb-5 sm:mb-6">
                Construit pour les équipes<br />IT exigeantes
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#425466] leading-relaxed mb-6 sm:mb-8">
                Contrôle d'accès granulaire par rôle — chaque agent IT voit ses données, les superviseurs
                ont la vue globale multi-sites. Aucune donnée sensible exposée.
              </p>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { title: 'Séparation IT / Technique',       desc: 'Les agents IT ne sont visibles que dans IT Control. La séparation est garantie en base de données.' },
                  { title: 'Gestion multi-sites centralisée', desc: 'Superviseurs et admins ont une vue consolidée sur tous les sites. Filtrage par site en un clic.' },
                  { title: 'Traçabilité complète',            desc: 'Chaque action est horodatée — incidents, installations, présences, équipements — avec l\'auteur identifié.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200
                      flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[13px] sm:text-[14px] font-semibold text-[#0A2540]">{item.title}</p>
                      <p className="text-[12px] sm:text-[13px] text-[#425466] mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment mockup */}
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-lg shadow-gray-100">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0A2540]">Équipements IT</p>
                    <p className="text-[11px] text-[#697386] mt-0.5">Site · Kinshasa — 84 appareils</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] text-blue-700 font-semibold">Temps réel</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { name: 'Switch Cisco 24P',  serie: 'SN-001-KIN', type: 'Réseau',       status: 'Actif',    sCls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                    { name: 'Serveur HP DL380',  serie: 'SV-002-KIN', type: 'Serveur',      status: 'Actif',    sCls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                    { name: 'Imprimante HP 452', serie: 'PR-008-LUB', type: 'Périphérique', status: 'HS',       sCls: 'bg-red-50 text-red-700 border border-red-200'             },
                    { name: 'Laptop Dell E5540', serie: 'PC-022-GOM', type: 'Poste',        status: 'Révision', sCls: 'bg-amber-50 text-amber-700 border border-amber-200'       },
                  ].map((eq, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <Server className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#0A2540] truncate">{eq.name}</p>
                        <p className="text-[10px] text-[#697386] truncate">{eq.serie} · {eq.type}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${eq.sCls}`}>{eq.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident alert card */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-red-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-red-800">Incident critique · Switch réseau</p>
                  <p className="text-[11px] text-red-600/70 mt-0.5">KIN · Signalé il y a 12 min · Assigné à Jean-Paul K.</p>
                </div>
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 animate-pulse mt-1.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative py-16 sm:py-24 lg:py-28 bg-[#0A2540] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 right-[-100px] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-blue-500/[0.10] blur-[120px]" />
          <div className="absolute bottom-[-100px] left-[-50px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full bg-indigo-400/[0.08] blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-[11px] text-blue-400 font-semibold uppercase tracking-[0.14em] mb-4 sm:mb-5">Prêt à commencer ?</p>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-white tracking-tight leading-tight mb-4">
            Votre infrastructure IT<br />sous contrôle total.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-blue-200/70 mb-8 sm:mb-10 leading-relaxed">
            Connectez-vous et centralisez incidents, équipements
            et présences sur tous vos sites — en temps réel.
          </p>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2.5 bg-blue-500 hover:bg-blue-400
              text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-8 py-3.5 sm:py-4 transition-all shadow-xl shadow-blue-900/40"
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
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Plane className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-[12px] text-blue-200/60">ATS IT Control</p>
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
