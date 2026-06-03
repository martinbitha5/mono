import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Eye, EyeOff, Monitor, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

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
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/IMG_9478.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-zinc-950/75" />

      {/* Subtle blue tint */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 70% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

      {/* Glass card */}
      <div className="relative w-full max-w-[420px] z-10">
        <div
          className="rounded-2xl border border-white/[0.10] p-8 shadow-2xl"
          style={{
            background: 'rgba(9, 9, 11, 0.72)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {/* Logo — texte + icône discret */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-500/[0.15] border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-zinc-50 leading-tight">ATS IT Control</p>
              <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">Service Informatique · RDC</p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-[24px] font-black text-zinc-50 tracking-tight">Connexion</h1>
            <p className="text-[13px] text-zinc-400 mt-1.5">Accédez à votre espace informatique</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 mb-2 uppercase tracking-[0.08em]">
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
              <label className="block text-[11px] font-semibold text-zinc-500 mb-2 uppercase tracking-[0.08em]">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <p className="text-[12px] text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                text-white text-[13px] font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2
                transition-all shadow-lg shadow-blue-900/30 mt-2"
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

          <div className="mt-7 pt-5 border-t border-white/[0.06] space-y-2">
            {[
              'Accès sécurisé par rôle et service',
              'Données en temps réel · RLS Supabase',
            ].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-zinc-500">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-4">
          Accès réservé au personnel IT ATS Handling RDC
        </p>
      </div>
    </div>
  );
}
