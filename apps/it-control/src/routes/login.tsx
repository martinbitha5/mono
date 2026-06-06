import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      {/* Overlay sombre — 35% pour garder l'image lisible */}
      <div className="absolute inset-0" style={{ background: 'rgba(5, 6, 10, 0.38)' }} />

      {/* Vignette bords pour profondeur */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

      {/* Carte glass — vrai frosted glass */}
      <div className="relative w-full max-w-[400px] z-10">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* En-tête — texte uniquement, sans badge */}
          <div className="mb-8">
            <p className="text-[13px] font-black text-white leading-none tracking-tight uppercase">
              ATS IT Control
            </p>
            <p className="text-[10px] text-white/95 leading-none mt-1.5 tracking-wide">
              Service Informatique · RDC
            </p>
          </div>

          <div className="mb-7">
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none">Connexion</h1>
            <p className="text-[13px] text-white mt-2">Accédez à votre espace informatique</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white mb-2 uppercase tracking-[0.10em]">
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
              <label className="block text-[10px] font-bold text-white mb-2 uppercase tracking-[0.10em]">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                text-white text-[13px] font-bold rounded-xl py-3 flex items-center justify-center gap-2
                transition-all mt-2"
              style={{ boxShadow: loading || !email || !password ? 'none' : '0 4px 20px rgba(59,130,246,0.40)' }}
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

          <div className="mt-6 pt-5 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              'Accès sécurisé par rôle et service',
              'Données en temps réel · RLS Supabase',
            ].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] text-white/95">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-white/90 mt-4">
          Accès réservé au personnel IT ATS Handling RDC
        </p>
      </div>
    </div>
  );
}
