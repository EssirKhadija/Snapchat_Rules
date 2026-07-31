import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTranslation } from '../lib/i18n';

const navItems = [
  { to: '/dashboard', label: 'sidebar.dashboard', icon: '▦' },
  { to: '/dashboard/campaigns', label: 'sidebar.campaigns', icon: '◈' },
  { to: '/dashboard/campaigns/launch', label: 'Bulk Launch', icon: '⚡' },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-snap-border bg-snap-card lg:flex lg:flex-col" style={{ height: 'calc(100vh - 56px)', position: 'sticky', top: '56px' }}>
      <div className="flex flex-col h-full p-5">
        {/* Navigation */}
        <div>
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
            {t('sidebar.navigation')}
          </p>
          <nav className="space-y-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-snap-yellow text-snap-ink'
                      : 'text-snap-muted hover:bg-snap-soft hover:text-snap-ink'
                  }`
                }
              >
                <span className="text-base">{icon}</span>
                {t(label)}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Connected account */}
        <div className="mt-6 rounded-2xl border border-snap-border bg-snap-soft p-4">
          <p className="text-[11px] font-medium text-snap-muted">{t('sidebar.connectedAccount')}</p>
          <p className="mt-1 text-sm font-semibold text-snap-ink">Snapchat Ads</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-snap-muted">{t('sidebar.synced')}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout — collé en bas */}
        <button
          onClick={logout}
          className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-3 text-sm font-medium text-snap-muted transition-all duration-150 hover:border-snap-muted hover:text-snap-ink"
        >
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;