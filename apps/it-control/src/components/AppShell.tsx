import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';
import {
  LayoutDashboard, Users, Calendar, Package,
  MessageSquare, FileText, AlertTriangle, MonitorCheck,
  LogOut, Monitor, X,
  Bell, Zap, Wrench, Info, Truck, Menu,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NavItem {
  to:     string;
  label:  string;
  icon:   typeof LayoutDashboard;
  roles?: string[];
}

// ── Navigation ────────────────────────────────────────────────────────────────
const OPS_NAV: NavItem[] = [
  { to: '/dashboard',     label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/attendance',    label: 'Présences',        icon: Users           },
  { to: '/installations', label: 'Installations',    icon: MonitorCheck    },
  { to: '/incidents',     label: 'Incidents',        icon: AlertTriangle   },
  { to: '/schedule',      label: 'Planning',         icon: Calendar        },
  { to: '/equipment',     label: 'Équipements',      icon: Package         },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/users',   label: 'Agents',   icon: Wrench,        roles: ['admin', 'supervisor'] },
  { to: '/forum',   label: 'Forum',    icon: MessageSquare                                  },
  { to: '/reports', label: 'Rapports', icon: FileText,      roles: ['admin', 'supervisor'] },
];

// Primary 4 items shown in the mobile bottom bar
const BOTTOM_NAV: NavItem[] = [
  { to: '/dashboard',  label: 'Accueil',     icon: LayoutDashboard },
  { to: '/incidents',  label: 'Incidents',   icon: AlertTriangle   },
  { to: '/installations', label: 'Installs', icon: MonitorCheck    },
  { to: '/equipment',  label: 'Équipements', icon: Package         },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const roleLabel: Record<string, string> = {
  admin:      'Administrateur',
  supervisor: 'Superviseur',
  it_agent:   'Agent IT',
  tech_agent: 'Agent Technique',
};

const SITE_CODES: Record<string, string> = {
  Kinshasa: 'KIN', Lubumbashi: 'LUB', Goma: 'GOM',
  Bukavu: 'BKV', Kisangani: 'KIS', 'Mbuji-Mayi': 'MBM',
  Kananga: 'KAN', Kolwezi: 'KLW',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function useLiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

function NotifTypeIcon({ type }: { type: AppNotification['type'] }) {
  const cls = 'w-3 h-3';
  if (type === 'gse_inop')     return <Truck         className={cls} />;
  if (type === 'intervention') return <Wrench        className={cls} />;
  if (type === 'incident')     return <AlertTriangle className={cls} />;
  if (type === 'maintenance')  return <Zap           className={cls} />;
  return <Info className={cls} />;
}

function notifIconBg(type: AppNotification['type']) {
  if (type === 'gse_inop')     return 'bg-red-500/15 text-red-400';
  if (type === 'intervention') return 'bg-orange-500/15 text-orange-400';
  if (type === 'incident')     return 'bg-amber-500/15 text-amber-400';
  if (type === 'maintenance')  return 'bg-blue-500/15 text-blue-400';
  return 'bg-zinc-700 text-zinc-400';
}

// ── Notification panel ────────────────────────────────────────────────────────
function NotifPanel({
  notifications, unreadCount, markAllRead, onClose,
}: {
  notifications: AppNotification[];
  unreadCount:   number;
  markAllRead:   () => void;
  onClose:       () => void;
}) {
  return (
    <div className="absolute right-0 top-11 w-[calc(100vw-2rem)] sm:w-80 max-w-sm
      bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-zinc-100">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-semibold">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
            Tout lire
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell className="w-8 h-8 text-zinc-700" />
            <p className="text-[12px] text-zinc-600">Aucune notification</p>
          </div>
        ) : (
          notifications.map(n => {
            const itemCls = [
              'block px-4 py-3 border-b border-zinc-800/60 last:border-0 transition-colors',
              !n.read ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20',
              n.link ? 'cursor-pointer' : '',
            ].join(' ');
            const inner = (
              <div className="flex items-start gap-2.5">
                <div className={[
                  'mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                  notifIconBg(n.type),
                ].join(' ')}>
                  <NotifTypeIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-semibold text-zinc-100 leading-tight truncate flex-1">
                      {n.title}
                    </p>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-zinc-700 mt-1">{relativeTime(n.created_at)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} className={itemCls} onClick={onClose}>
                {inner}
              </Link>
            ) : (
              <div key={n.id} className={itemCls}>
                {inner}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Desktop sidebar nav section ───────────────────────────────────────────────
function SidebarSection({
  heading, items, currentPath, role,
}: {
  heading: string; items: NavItem[]; currentPath: string; role?: string;
}) {
  const visible = items.filter(it => !it.roles || (role && it.roles.includes(role)));
  if (!visible.length) return null;
  return (
    <div>
      <p className="px-3 mb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.1em]">{heading}</p>
      <div className="space-y-px">
        {visible.map(item => {
          const active = currentPath === item.to;
          const Icon   = item.icon;
          return (
            <Link
              key={item.to} to={item.to}
              className={[
                'flex items-center gap-2.5 px-3 py-[7px] rounded-lg',
                'text-[13px] font-medium transition-colors duration-100',
                active
                  ? 'bg-blue-50 text-blue-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950',
              ].join(' ')}
            >
              <Icon className={['w-[15px] h-[15px] flex-shrink-0', active ? 'text-blue-500' : 'text-zinc-600'].join(' ')} />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut }                        = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const { location }                = useRouterState();
  const currentPath                 = location.pathname;
  const time                        = useLiveClock();
  const siteCode                    = SITE_CODES[profile?.site ?? ''] ?? '—';
  const initial                     = profile?.full_name?.charAt(0).toUpperCase() ?? '?';
  const notifRef                    = useRef<HTMLDivElement>(null);

  // Close notif panel on outside click
  useEffect(() => {
    if (!notifOpen) return;
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [notifOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const toggleNotif = () => setNotifOpen(o => { if (!o) markAllRead(); return !o; });
  const closeDrawer = () => setDrawerOpen(false);

  // All nav items visible to this user (for mobile drawer)
  const allNav = [
    ...OPS_NAV,
    ...ADMIN_NAV.filter(it => !it.roles || (profile?.role && it.roles.includes(profile.role))),
  ];

  return (
    <div className="flex h-[100dvh] bg-zinc-950 overflow-hidden">

      {/* ══════════════════════════════════════════════════
          DESKTOP SIDEBAR  (hidden on mobile / tablet)
      ══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Monitor className="w-[15px] h-[15px] text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-zinc-50 leading-tight truncate">ATS IT Control</p>
            <p className="text-[10px] text-zinc-500 leading-tight mt-px">Service Informatique</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
          <SidebarSection heading="Opérations" items={OPS_NAV}   currentPath={currentPath} role={profile?.role} />
          <SidebarSection heading="Gestion"    items={ADMIN_NAV} currentPath={currentPath} role={profile?.role} />
        </nav>

        {/* User */}
        <div className="flex-shrink-0 px-3 py-3 border-t border-zinc-800">
          <div className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-zinc-950 transition-colors cursor-default">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 select-none">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-zinc-200 truncate leading-tight">{profile?.full_name ?? '—'}</p>
              <p className="text-[10px] text-zinc-500 leading-tight mt-px truncate">{roleLabel[profile?.role ?? ''] ?? profile?.role}</p>
            </div>
            <button onClick={signOut} title="Se déconnecter"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-50">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MOBILE FULL-SCREEN DRAWER
      ══════════════════════════════════════════════════ */}
      <div className={[
        'lg:hidden fixed inset-0 z-50 flex flex-col bg-zinc-900',
        'transition-transform duration-300 ease-in-out',
        drawerOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-[15px] h-[15px] text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-zinc-50 leading-tight">ATS IT Control</p>
              <p className="text-[10px] text-zinc-500 leading-tight mt-px">Service Informatique</p>
            </div>
          </div>
          <button onClick={closeDrawer}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {allNav.map(item => {
              const active = currentPath === item.to;
              const Icon   = item.icon;
              return (
                <Link
                  key={item.to} to={item.to} onClick={closeDrawer}
                  className={[
                    'flex items-center gap-3.5 px-3 py-3.5 rounded-xl',
                    'text-[15px] font-medium transition-colors',
                    active
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                  ].join(' ')}
                >
                  <Icon className={['w-5 h-5 flex-shrink-0', active ? 'text-blue-500' : 'text-zinc-600'].join(' ')} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Drawer user + logout */}
        <div className="flex-shrink-0 border-t border-zinc-800 px-3 py-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0 select-none">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-zinc-200 truncate">{profile?.full_name ?? '—'}</p>
              <p className="text-[11px] text-zinc-500 truncate">{roleLabel[profile?.role ?? ''] ?? profile?.role}</p>
              {profile?.site && (
                <p className="text-[11px] text-zinc-600 truncate">{profile.site} · {siteCode}</p>
              )}
            </div>
          </div>
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top header (responsive) ── */}
        <header className="flex-shrink-0 flex items-center h-14 px-4 lg:px-6 bg-zinc-900 border-b border-zinc-800">

          {/* Mobile: app branding */}
          <div className="flex lg:hidden items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-[14px] h-[14px] text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-zinc-100 leading-tight">ATS IT Control</p>
              {profile?.site && (
                <p className="text-[10px] text-zinc-500 leading-none mt-px">{profile.site} · {siteCode}</p>
              )}
            </div>
          </div>

          {/* Desktop: clock + date + site */}
          <div className="hidden lg:flex flex-1 items-center gap-4 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="font-mono tabular-nums text-zinc-400">
                {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-zinc-800">·</span>
            <span className="text-zinc-500">
              {time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            {profile?.site && (
              <>
                <span className="text-zinc-800">·</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">{profile.site}</span>
                  <span className="px-1.5 py-px bg-zinc-950 border border-zinc-800 rounded text-[10px] font-mono font-semibold text-zinc-400">
                    {siteCode}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Notification bell (always visible) */}
          <div className="relative ml-2" ref={notifRef}>
            <button
              onClick={toggleNotif}
              className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5
                  bg-blue-500 rounded-full text-[9px] font-bold text-white
                  flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <NotifPanel
                notifications={notifications}
                unreadCount={unreadCount}
                markAllRead={markAllRead}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 lg:py-7">
            {children}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE BOTTOM NAV  (hidden on desktop)
      ══════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-zinc-900 border-t border-zinc-800">
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map(item => {
            const active = currentPath === item.to;
            const Icon   = item.icon;
            return (
              <Link
                key={item.to} to={item.to}
                className={[
                  'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
                  active ? 'text-blue-500' : 'text-zinc-600 hover:text-zinc-400',
                ].join(' ')}
              >
                <Icon className="w-[22px] h-[22px]" />
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}

          {/* More → opens drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Menu className="w-[22px] h-[22px]" />
            <span className="text-[9px] font-medium leading-none">Menu</span>
          </button>
        </div>
      </nav>

    </div>
  );
}
