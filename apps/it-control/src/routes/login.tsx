import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@ats/supabase/client';
import { Eye, EyeOff, Monitor, ArrowRight, AlertCircle,
  Server, Wifi, Users, CheckCircle2, Shield } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return; }
    await navigate({ to: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left — branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 relative overflow-hidden p-10 bg-[#F6F9FC] border-r border-gray-200">
        {/* Gradient mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ background: 'radial-gradient(ellipse 90% 70% at 30% 0%, rgba(99,102,241,0.18) 0%, rgba(59,130,246,0.10) 40%, transparent 70%)' }} className="absolute inset-0" />
          <div className="absolute top-[-80px] right-[-40px] w-[400px] h-[400px] rounded-full bg-blue-100 blur-[120px] opacity-70" />
          <div className="absolute bottom-[0] left-[-60px] w-[350px] h-[350px] rounded-full bg-indigo-50 blur-[100px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#0A2540] leading-tight">ATS IT Control</p>
            <p className="text-[11px] text-[#697386] leading-tight mt-0.5">Service Informatique · RDC</p>
          </div>
        </div>

        {/* Middle */}
        <div className="relative">
          <h2 className="text-[32px] font-black text-[#0A2540] tracking-tight leading-[1.15] mb-4">
            Gestion IT &<br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              infrastructure réseau
            </span>
          </h2>
          <p className="text-[13px] text-[#425466] leading-relaxed mb-8">
            Supervisez les équipements, incidents et accès réseau sur l'ensemble des sites ATS Handling RDC.
          </p>
          <div className="space-y-2.5">
            {[
              { icon: Server,  label: 'Inventaire matériel & équipements réseau' },
              { icon: Wifi,    label: 'Supervision réseau & connectivité sites'   },
              { icon: Shield,  label: 'Incidents IT & tickets de support'          },
              { icon: Users,   label: 'Accès utilisateurs & droits système'        },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-[12px] text-[#425466]">{label}</span>
              </div>
            ))}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-8">
            {[
              { value: '8',    label: 'Sites actifs'  },
              { value: 'IT',   label: 'Équipements'   },
              { value: '24/7', label: 'Monitoring'    },
              { value: 'RDC',  label: 'Couverture'    },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-[22px] font-black text-[#0A2540] leading-none tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-[#697386] mt-1.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-[#697386]">
          ATS Handling RDC © {new Date().getFullYear()} · v2.0
        </p>
      </div>

      {/* ── Right — form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-100">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <p className="text-[13px] font-bold text-[#0A2540]">ATS IT Control</p>
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-black text-[#0A2540] tracking-tight">Connexion</h1>
            <p className="text-[14px] text-[#425466] mt-1.5">Accédez à votre espace informatique</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#425466] mb-2 uppercase tracking-[0.08em]">
                Adresse email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13px] text-[#0A2540] placeholder:text-gray-400
                  focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                placeholder="vous@ats-handling.cd"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#425466] mb-2 uppercase tracking-[0.08em]">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 pr-10 text-[13px] text-[#0A2540] placeholder:text-gray-400
                    focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-[12px] text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed
                text-white text-[13px] font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2
                transition-all shadow-lg shadow-blue-100 mt-2"
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

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
            {[
              'Accès sécurisé par rôle et service',
              'Données en temps réel · RLS Supabase',
            ].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-[#697386]">{t}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-4">
            Accès réservé au personnel IT ATS Handling RDC
          </p>
        </div>
      </div>
    </div>
  );
}
