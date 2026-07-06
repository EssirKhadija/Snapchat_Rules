import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/rules/builder', label: 'Règles', icon: '⚡' },
  { to: '/campaigns', label: 'Campagnes', icon: '◈' },
];

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-snap-border bg-snap-card p-5 lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-8">
        <div>
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-snap-yellow text-snap-ink'
                      : 'text-snap-muted hover:bg-snap-soft hover:text-snap-ink'
                  }`
                }
              >
                <span className="text-base">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="rounded-2xl border border-snap-border bg-snap-soft p-4">
          <p className="text-[11px] font-medium text-snap-muted">Compte connecté</p>
          <p className="mt-1 text-sm font-semibold text-snap-ink">Snapchat Ads</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-snap-muted">Synchronisé</span>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className="mt-6 rounded-xl border border-snap-border bg-snap-soft px-4 py-3 text-sm font-medium text-snap-muted transition-all duration-150 hover:border-snap-muted hover:text-snap-ink"
      >
        Déconnexion
      </button>
    </aside>
  );
};

export default Sidebar;