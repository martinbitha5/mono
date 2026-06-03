import { Link } from '@tanstack/react-router';
import {
  Server, Wifi, Users, Calendar,
  ArrowRight, CheckCircle2, Shield,
  Activity, ChevronRight, RefreshCw, FileSpreadsheet, MessageSquare,
  AlertTriangle,
} from 'lucide-react';

const FEATURES = [
  {
    icon: AlertTriangle,
    title: 'Incidents IT',
    desc: "Signalez et gérez les tickets d'incidents. Assignation, priorité critique/moyen/faible et suivi en temps réel.",
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
    desc: "Suivi de chaque intervention d'installation réseau et matériel. Statut, responsable et historique.",
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
    desc: "Organisez les interventions et congés de l'équipe. Vue calendrier hebdomadaire par agent.",
    color: 'amber',
  },
  {
    icon: MessageSquare,
    title: 'Forum interne',
    desc: "Communication d'équipe intégrée. Discussions par sujet pour coordonner sans quitter la plateforme.",
    color: 'teal',
  },
];

const colorMap: Record<string, { icon: string; border: string; bg: string }> = {
  red:     { icon: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-500/10'     },
  blue:    { icon: 'text-blue-400',    border: 'border-blue-500/20',    bg: 'bg-blue-500/10'    },
  purple:  { icon: 'text-purple-400',  border: 'border-purple-500/20',  bg: 'bg-purple-500/10'  },
  emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  amber:   { icon: 'text-amber-400',   border: 'border-amber-500/20',   bg: 'bg-amber-500/10'   },
  teal:    { icon: 'text-teal-400',    border: 'border-teal-500/20',    bg: 'bg-teal-500/10'    },
};

const GLASS_CARD = 'border border-white/[0.08] rounded-2xl p-5 sm:p-6 transition-colors hover:border-white/[0.14]';
const GLASS_BG   = { background: 'rgba(24,24,27,0.65)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)' };

export function ITLandingPage() {
  return (
    <div
      className="min-h-screen text-zinc-200 overflow-x-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* ── Background image (fixed) ── */}
      <div className="fixed inset-0 -z-10">
        <img src="/IMG_9478.jpeg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-zinc-950/80" />
      </div>

      {/* ── Navigation ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4 border-b border-white/[0.07]"
        style={{ background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-[13px] font-bold text-zinc-50 leading-none tracking-tight">ATS IT Control</p>
            <p className="hidden sm:block text-[10px] text-zinc-500 leading-none mt-0.5">Service Informatique · RDC</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#features" className="hidden sm:block text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors font-medium">
            Fonctionnalités
          </a>
          <Link
            to="/login"
            className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white
              text-[12px] sm:text-[13px] font-semibold rounded-lg px-3 sm:px-4 py-2 transition-all"
          >
            Se connecter <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-14 overflow-hidden">
        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 py-14 sm:py-20 lg:py-24">
          <div className="max-w-[800px]">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 border border-blue-500/30 rounded-full px-3 sm:px-4 py-1.5 mb-6 sm:mb-10"
              style={{ background: 'rgba(59,130,246,0.08)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-[12px] text-blue-400 font-semibold tracking-wide">
                Plateforme IT centralisée · ATS Handling RDC
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[52px] lg:text-[72px] font-black text-zinc-50 leading-[1.06] tracking-[-0.02em] mb-4 sm:mb-6">
              Maîtrisez chaque incident.<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Chaque équipement. Chaque site.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[15px] sm:text-[17px] lg:text-[19px] text-zinc-400 leading-relaxed max-w-[580px] mb-7 sm:mb-10">
              La plateforme IT centralisée pour ATS Handling RDC.
              Incidents, installations, équipements et présences — supervisés en temps réel sur tous les sites.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 sm:mb-14">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500
                  text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-7 py-3 sm:py-3.5 transition-all
                  shadow-xl shadow-blue-900/30"
              >
                Accéder à l'application
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center sm:justify-start gap-2 text-zinc-400 hover:text-zinc-100 text-[14px] sm:text-[15px] font-medium transition-colors px-2 py-3"
              >
                Voir les fonctionnalités <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-7 gap-y-2.5 pt-6 sm:pt-8 border-t border-white/[0.07]">
              {[
                { icon: Shield,          label: 'Accès sécurisé par rôle' },
                { icon: RefreshCw,       label: 'Données en temps réel'   },
                { icon: FileSpreadsheet, label: 'Rapports Excel avancés'  },
                { icon: Activity,        label: '8 sites · Réseau RDC'    },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-[11px] sm:text-[12px] text-zinc-500">
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-600 flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-[0.14em] mb-3">Fonctionnalités</p>
            <h2 className="text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-zinc-50 tracking-tight leading-tight">
              Tout ce dont votre équipe<br />informatique a besoin
            </h2>
            <p className="text-[14px] sm:text-[16px] text-zinc-400 mt-4 max-w-xl mx-auto leading-relaxed">
              De la gestion d'incidents aux rapports de direction, chaque module est pensé pour le quotidien IT.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f) => {
              const cfg = colorMap[f.color];
              const Icon = f.icon;
              return (
                <div key={f.title} className={GLASS_CARD} style={GLASS_BG}>
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mb-4 sm:mb-5`}>
                    <Icon className={`w-5 h-5 ${cfg.icon}`} />
                  </div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-zinc-100 mb-2">{f.title}</h3>
                  <p className="text-[13px] text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="py-12 sm:py-16 border-y border-white/[0.06]" style={{ background: 'rgba(9,9,11,0.60)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 text-center">
            {[
              { value: '8',    title: 'Sites IT supervisés',   sub: 'Kinshasa, Lubumbashi, Goma…'          },
              { value: '100%', title: 'Équipements tracés',    sub: 'Chaque device inventorié et suivi'     },
              { value: '24/7', title: 'Surveillance continue', sub: 'Incidents signalés en temps réel'      },
              { value: '0',    title: 'Incident non suivi',    sub: 'Chaque ticket a un statut et un responsable' },
            ].map(s => (
              <div key={s.title}>
                <p className="text-[38px] sm:text-[48px] lg:text-[52px] font-black text-zinc-50 leading-none mb-2 tabular-nums">{s.value}</p>
                <p className="text-[13px] sm:text-[14px] font-semibold text-zinc-200 mb-1">{s.title}</p>
                <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-snug">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust section ── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-[0.14em] mb-4">Sécurité & fiabilité</p>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-zinc-50 tracking-tight leading-tight mb-5 sm:mb-6">
                Construit pour les équipes<br />IT exigeantes
              </h2>
              <p className="text-[14px] sm:text-[15px] text-zinc-400 leading-relaxed mb-6 sm:mb-8">
                Contrôle d'accès granulaire par rôle — chaque agent IT voit ses données, les superviseurs
                ont la vue globale multi-sites. Aucune donnée sensible exposée.
              </p>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { title: 'Séparation IT / Technique',       desc: 'Les agents IT ne sont visibles que dans IT Control. La séparation est garantie en base de données.' },
                  { title: 'Gestion multi-sites centralisée', desc: 'Superviseurs et admins ont une vue consolidée sur tous les sites. Filtrage par site en un clic.' },
                  { title: 'Traçabilité complète',            desc: "Chaque action est horodatée — incidents, installations, présences, équipements — avec l'auteur identifié." },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[13px] sm:text-[14px] font-semibold text-zinc-100">{item.title}</p>
                      <p className="text-[12px] sm:text-[13px] text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment mockup */}
            <div className="space-y-3">
              <div className={GLASS_CARD} style={GLASS_BG}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-100">Équipements IT</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Site · Kinshasa — 84 appareils</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] text-blue-400 font-semibold">Temps réel</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { name: 'Switch Cisco 24P',  serie: 'SN-001-KIN', type: 'Réseau',       status: 'Actif',    sCls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
                    { name: 'Serveur HP DL380',  serie: 'SV-002-KIN', type: 'Serveur',      status: 'Actif',    sCls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
                    { name: 'Imprimante HP 452', serie: 'PR-008-LUB', type: 'Périphérique', status: 'HS',       sCls: 'bg-red-500/10 text-red-400 border border-red-500/20'             },
                    { name: 'Laptop Dell E5540', serie: 'PC-022-GOM', type: 'Poste',        status: 'Révision', sCls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'       },
                  ].map((eq, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Server className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-zinc-200 truncate">{eq.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{eq.serie} · {eq.type}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${eq.sCls}`}>{eq.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident alert */}
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-red-300">Incident critique · Switch réseau</p>
                  <p className="text-[11px] text-red-400/70 mt-0.5">KIN · Signalé il y a 12 min · Assigné à Jean-Paul K.</p>
                </div>
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 animate-pulse mt-1.5" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative py-16 sm:py-24 lg:py-28 border-t border-white/[0.06]" style={{ background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-[11px] text-blue-400 font-semibold uppercase tracking-[0.14em] mb-4 sm:mb-5">Prêt à commencer ?</p>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-zinc-50 tracking-tight leading-tight mb-4">
            Votre infrastructure IT<br />sous contrôle total.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-zinc-400 mb-8 sm:mb-10 leading-relaxed">
            Connectez-vous et centralisez incidents, équipements
            et présences sur tous vos sites — en temps réel.
          </p>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500
              text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-8 py-3.5 sm:py-4 transition-all shadow-xl shadow-blue-900/30"
          >
            Accéder à l'application
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-6 sm:py-8" style={{ background: 'rgba(9,9,11,0.80)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[12px] text-zinc-500 font-semibold">ATS IT Control</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-[12px] text-zinc-600">
            <span>ATS Handling RDC</span>
            <span>© {new Date().getFullYear()}</span>
            <span>Accès réservé au personnel autorisé</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
