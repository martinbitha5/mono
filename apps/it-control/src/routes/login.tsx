import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

/* ════════════════════════════════════════════════════════════════
   ATS IT CONTROL — Connexion
   Split-screen : formulaire à gauche, panneau système à droite.
   Fond dot-grid, aucune image, un seul accent.
═══════════════════════════════════════════════════════════════════ */

function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail   ] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw  ] = useState(false);
  const [error,    setError   ] = useState<string | null>(null);
  const [loading,  setLoading ] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return; }
    await navigate({ to: '/dashboard' });
  };

  return (
    <div className="min-h-[100dvh] bg-[#F4F5FA] text-zinc-800 antialiased lg:grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_520px]">

      {/* ── COLONNE FORMULAIRE ──────────────────────────── */}
      <div
        className="relative min-h-[100dvh] lg:min-h-0 flex flex-col"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(29,30,44,0.10) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Halo accent discret en haut */}
        <div
          className="pointer-events-none absolute top-0 inset-x-0 h-[280px]"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(79,70,229,0.09), transparent 70%)' }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 sm:px-10 h-16 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 35% 100%, 0 65%)' }} />
            <span className="font-mono text-[12px] font-semibold tracking-[0.14em] text-zinc-900">
              ATS<span className="text-zinc-400 mx-1">/</span>IT CONTROL
            </span>
          </Link>
          <span className="hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Système opérationnel
          </span>
        </div>

        {/* Formulaire centré */}
        <div className="relative flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[380px]">
            <p className="font-mono text-[10px] tracking-[0.22em] text-blue-600 uppercase mb-3">
              Service Informatique · RDC
            </p>
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-zinc-900 leading-none">
              Connexion
            </h1>
            <p className="mt-2.5 text-[13px] text-zinc-500">
              Identifiez-vous pour accéder à la plateforme informatique.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block font-mono text-[10px] font-semibold text-zinc-500 mb-2 uppercase tracking-[0.14em]">
                  Adresse email
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                  className="input-base"
                  placeholder="vous@ats-handling.cd"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] font-semibold text-zinc-500 mb-2 uppercase tracking-[0.14em]">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    className="input-base pr-10"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 rounded-md px-3.5 py-2.5 border border-red-200 bg-red-50">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <p className="text-[12px] text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading || !email || !password}
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                  text-white text-[13px] font-semibold rounded-md flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                ) : (
                  <>Accéder au système <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>

            <p className="mt-8 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase leading-relaxed">
              Accès réservé au personnel informatique<br />ATS Handling RDC
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-6 sm:px-10 h-14 flex items-center justify-between flex-shrink-0 border-t border-[#E6E8F0]">
          <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-300 uppercase">© {new Date().getFullYear()} ATS Handling RDC</span>
          <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-300 uppercase">v2.0</span>
        </div>
      </div>

      {/* ── PANNEAU SYSTÈME (desktop) ───────────────────── */}
      <aside className="hidden lg:flex flex-col justify-between border-l border-[#E6E8F0] bg-white p-10 xl:p-12">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-400 uppercase">État du réseau</span>
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-emerald-600 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Opérationnel
          </span>
        </div>

        <div>
          <h2 className="text-[26px] xl:text-[30px] font-semibold tracking-[-0.02em] text-zinc-900 leading-[1.15] mb-4">
            Une seule plateforme pour l'ensemble de l'infrastructure IT.
          </h2>
          <p className="text-[13px] text-zinc-500 leading-relaxed max-w-[380px]">
            Installations, incidents, équipements et présences —
            consolidés en temps réel sur les 8 sites du réseau ATS Handling.
          </p>

          {/* Grille de stats */}
          <div className="mt-10 grid grid-cols-2 gap-px bg-[#E6E8F0] border border-[#E6E8F0] rounded-lg overflow-hidden">
            {[
              { v: '08',   l: 'Sites couverts' },
              { v: '24/7', l: 'Surveillance' },
              { v: '15 s', l: 'Synchronisation' },
              { v: '100%', l: 'Incidents tracés' },
            ].map(s => (
              <div key={s.l} className="bg-white px-5 py-4">
                <p className="font-mono text-[22px] text-zinc-900 tabular-nums leading-none">{s.v}</p>
                <p className="mt-2 font-mono text-[9px] tracking-[0.16em] text-zinc-400 uppercase">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-zinc-300 uppercase">
          <span>RLS Supabase — accès par rôle</span>
          <span>KIN · FIH</span>
        </div>
      </aside>
    </div>
  );
}
