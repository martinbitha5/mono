import type React from 'react';
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
    desc: "Pointage journalier de toute l'équipe technique. Statut présent, en retard ou absent — par site et par période.",
    color: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'Rapports Excel',
    desc: 'Export professionnel multi-feuilles avec couleurs et titres : GSE, interventions, carburant, présences — par période.',
    color: 'purple',
  },
];

const colorMap: Record<string, { icon: string; border: string; bg: string }> = {
  orange:  { icon: 'text-orange-400',  border: 'border-orange-500/20',  bg: 'bg-orange-500/10'  },
  amber:   { icon: 'text-amber-400',   border: 'border-amber-500/20',   bg: 'bg-amber-500/10'   },
  red:     { icon: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-500/10'     },
  blue:    { icon: 'text-blue-400',    border: 'border-blue-500/20',    bg: 'bg-blue-500/10'    },
  emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  purple:  { icon: 'text-purple-400',  border: 'border-purple-500/20',  bg: 'bg-purple-500/10'  },
};

/* Vrai glass : fond blanc semi-transparent + blur fort */
const GLASS_CARD = 'rounded-2xl p-5 sm:p-6 transition-all';
const GLASS_BG: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.10)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.16)',
  boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
};

export function TechLandingPage() {
  return (
    <div
      className="min-h-screen text-zinc-200 overflow-x-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* ── Background image (fixed) ── */}
      <div className="fixed inset-0 -z-10">
        <img src="/IMG_9478.jpeg" alt="" className="w-full h-full object-cover" />
        {/* Overlay 45% — image visible, texte lisible */}
        <div className="absolute inset-0" style={{ background: 'rgba(5,6,10,0.45)' }} />
        {/* Vignette bords */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.40) 100%)' }} />
      </div>

      {/* ── Navigation ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4 border-b border-white/[0.07]"
        style={{ background: 'rgba(7,9,14,0.65)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
      >
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-[13px] font-bold text-zinc-50 leading-none tracking-tight">ATS Tech Control</p>
            <p className="hidden sm:block text-[10px] text-zinc-500 leading-none mt-0.5">Service Technique · RDC</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#features" className="hidden sm:block text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors font-medium">
            Fonctionnalités
          </a>
          <Link
            to="/login"
            className="flex items-center gap-1.5 sm:gap-2 bg-orange-500 hover:bg-orange-400 text-white
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
              className="inline-flex items-center gap-2 border border-orange-500/30 rounded-full px-3 sm:px-4 py-1.5 mb-6 sm:mb-10"
              style={{ background: 'rgba(249,115,22,0.08)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-[12px] text-orange-400 font-semibold tracking-wide">
                Plateforme opérationnelle · ATS Handling RDC
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[36px] sm:text-[52px] lg:text-[72px] font-black text-zinc-50 leading-[1.06] tracking-[-0.02em] mb-4 sm:mb-6">
              Gérez chaque engin.<br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Anticipez chaque panne.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[15px] sm:text-[17px] lg:text-[19px] text-zinc-200 leading-relaxed max-w-[580px] mb-7 sm:mb-10">
              La plateforme centralisée pour le service technique d'ATS Handling RDC.
              Parc GSE, maintenance, interventions, carburant et présences — tout en un seul écran.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 sm:mb-14">
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400
                  text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-7 py-3 sm:py-3.5 transition-all
                  shadow-xl shadow-orange-900/30"
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
                { icon: Shield,          label: 'Accès sécurisé par rôle'    },
                { icon: RefreshCw,       label: 'Refresh temps réel — 15 s'  },
                { icon: FileSpreadsheet, label: 'Export Excel professionnel'  },
                { icon: Activity,        label: '8 sites couverts · RDC'      },
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
              Tout ce dont votre équipe<br />technique a besoin
            </h2>
            <p className="text-[14px] sm:text-[16px] text-zinc-300 mt-4 max-w-xl mx-auto leading-relaxed">
              De la gestion d'engins à l'export Excel, chaque module est pensé pour le terrain.
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
                  <p className="text-[13px] text-zinc-300 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="py-12 sm:py-16 border-y border-white/[0.08]" style={{ background: 'rgba(7,9,14,0.52)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 text-center">
            {[
              { value: '8',    title: 'Sites opérationnels',   sub: 'Kinshasa, Lubumbashi, Goma…'         },
              { value: '24/7', title: 'Surveillance continue',  sub: 'Données rafraîchies toutes les 15 s' },
              { value: '100%', title: 'Carburant tracé',        sub: 'Chaque litre suivi et horodaté'      },
              { value: 'RDC',  title: 'Couverture nationale',   sub: 'Déployé sur tout le réseau ATS'      },
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
              <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-[0.14em] mb-4">Fiabilité</p>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-zinc-50 tracking-tight leading-tight mb-5 sm:mb-6">
                Sécurisé, rapide<br />et toujours disponible
              </h2>
              <p className="text-[14px] sm:text-[15px] text-zinc-300 leading-relaxed mb-6 sm:mb-8">
                Construit sur Supabase avec contrôle d'accès par rôle. Chaque agent accède uniquement à ses données.
                Les superviseurs ont une vision globale multi-sites en temps réel.
              </p>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { title: "Contrôle d'accès par rôle",    desc: "Admin, superviseur, agent technique — chacun voit exactement ce qui le concerne." },
                  { title: 'Synchronisation temps réel',     desc: 'Rafraîchissement automatique toutes les 15 secondes. Aucun rechargement manuel.' },
                  { title: 'Export Excel professionnel',     desc: 'Rapport multi-feuilles avec couleurs, titres et statistiques prêt pour la direction.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[13px] sm:text-[14px] font-semibold text-zinc-100">{item.title}</p>
                      <p className="text-[12px] sm:text-[13px] text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className={GLASS_CARD} style={GLASS_BG}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-100">Daily Checklist</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">TRACTOR 01 · AT-122</p>
                </div>
                <span className="text-[10px] text-zinc-500 bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-md">
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
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                      c.ok ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/[0.08]'
                    }`}>
                      {c.ok && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <span className={`text-[13px] ${c.ok ? 'text-zinc-600 line-through decoration-zinc-700' : 'text-zinc-200'}`}>
                      {c.item}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-1">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-zinc-500">Progression</span>
                  <span className="text-zinc-200 font-semibold">4 / 6 items</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: '67%' }} />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">67% — 2 points à vérifier avant mise en service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative py-16 sm:py-24 lg:py-28 border-t border-white/[0.08]" style={{ background: 'rgba(7,9,14,0.60)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-[11px] text-orange-400 font-semibold uppercase tracking-[0.14em] mb-4 sm:mb-5">Prêt à commencer ?</p>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-zinc-50 tracking-tight leading-tight mb-4">
            Votre équipe technique<br />mérite les bons outils.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-zinc-400 mb-8 sm:mb-10 leading-relaxed">
            Connectez-vous et prenez le contrôle de votre parc GSE, de votre maintenance
            et de vos interventions — dès maintenant.
          </p>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-400
              text-white text-[14px] sm:text-[15px] font-semibold rounded-xl px-6 sm:px-8 py-3.5 sm:py-4 transition-all shadow-xl shadow-orange-900/30"
          >
            Accéder à l'application
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] py-6 sm:py-8" style={{ background: 'rgba(7,9,14,0.68)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[12px] text-zinc-500 font-semibold">ATS Tech Control</p>
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
