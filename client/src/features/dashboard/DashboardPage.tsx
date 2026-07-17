import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchSnapchatAccount, getSnapchatAuthorizeUrl } from './dashboard.service';
import { DashboardStatsResponse, SnapchatAccountResponse } from './dashboard.service';
import { ExecutionItem, NotificationItem } from './dashboard.types';
import { useTranslation } from '../../shared/lib/i18n';

const demoExecutions: ExecutionItem[] = [
  { id: 'exec-001', ruleName: 'Augmenter budget CPC faible', status: 'SUCCEEDED', message: 'Budget augmenté de 15%', executedAt: '2026-06-25 15:23' },
  { id: 'exec-002', ruleName: 'Pause campagne test', status: 'FAILED', message: 'API Snapchat non disponible', executedAt: '2026-06-25 14:50' },
  { id: 'exec-003', ruleName: 'Réduction budget conversion', status: 'SKIPPED', message: 'Condition non remplie', executedAt: '2026-06-25 13:30' }
];

const demoNotifications: NotificationItem[] = [
  { id: 'notif-001', title: 'Connexion Snapchat réussie', message: 'Compte connecté avec succès.', read: true, createdAt: '2026-06-25 12:10' },
  { id: 'notif-002', title: 'Règle exécutée', message: 'La règle "Pause campagne test" a échoué.', read: false, createdAt: '2026-06-25 14:50' },
  { id: 'notif-003', title: 'Campagne synchronisée', message: 'Les données ont été mises à jour.', read: false, createdAt: '2026-06-25 15:00' }
];

const statusConfig: Record<string, { label: string; classes: string }> = {
  SUCCEEDED: { label: 'Succès',  classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  FAILED:    { label: 'Échec',   classes: 'bg-red-50 text-red-600 border border-red-200'             },
  SKIPPED:   { label: 'Ignoré',  classes: 'bg-snap-soft text-snap-muted border border-snap-border'   },
};

// Presets de période comme Facebook Ads
const PRESETS = [
  { label: 'Aujourd\'hui',    getDates: () => { const d = fmt(new Date()); return { start: d, end: d }; } },
  { label: 'Hier',            getDates: () => { const d = new Date(); d.setDate(d.getDate()-1); const s = fmt(d); return { start: s, end: s }; } },
  { label: '7 derniers jours',getDates: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-7); return { start: fmt(s), end: fmt(e) }; } },
  { label: '30 derniers jours',getDates: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-30); return { start: fmt(s), end: fmt(e) }; } },
  { label: 'Ce mois',         getDates: () => { const n = new Date(); return { start: fmt(new Date(n.getFullYear(), n.getMonth(), 1)), end: fmt(n) }; } },
  { label: 'Mois dernier',    getDates: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth()-1, 1); const e = new Date(n.getFullYear(), n.getMonth(), 0); return { start: fmt(s), end: fmt(e) }; } },
];

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

const DashboardPage = () => {
  const { t } = useTranslation();

  // Défaut : 30 derniers jours
  const [dateRange, setDateRange] = useState(() => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - 30);
    return { start: fmt(s), end: fmt(e) };
  });
  const [activePreset, setActivePreset] = useState('30 derniers jours');
  const [showCustom, setShowCustom] = useState(false);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard', 'stats', dateRange.start, dateRange.end],
    queryFn: () => fetchDashboardStats(dateRange.start, dateRange.end),
    staleTime: 1000 * 60,
    retry: false,
  });

  const { data: account, isLoading: isAccountLoading } = useQuery<SnapchatAccountResponse>({
    queryKey: ['snapchat', 'me'],
    queryFn: fetchSnapchatAccount,
    staleTime: 1000 * 60,
    retry: false,
  });

  const onConnectSnapchat = async () => {
    try {
      const url = await getSnapchatAuthorizeUrl();
      window.location.assign(url);
    } catch {
      alert('Impossible de lancer l\'autorisation Snapchat.');
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const dates = preset.getDates();
    setDateRange(dates);
    setActivePreset(preset.label);
    setShowCustom(false);
  };

  const metricCards = useMemo(() => {
    const loading = statsLoading || !stats;
    return [
      { label: 'Campagnes',  value: loading ? '—' : stats.campaignCount,                        sub: loading ? '...' : `${stats.activeCampaigns} actives`,  accent: true  },
      { label: 'En pause',   value: loading ? '—' : stats.pausedCampaigns,                       sub: 'Campagnes en pause',                                   accent: false },
      { label: 'Dépenses',   value: loading ? '—' : `$${stats.spend.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Total dépensé',    accent: false },
      { label: 'Impressions',value: loading ? '—' : stats.impressions.toLocaleString('fr-FR'),   sub: 'Vues totales',                                         accent: false },
      { label: 'CTR',        value: loading ? '—' : `${stats.ctr}%`,                             sub: 'Taux de clics',                                        accent: false },
      { label: 'CPM',        value: loading ? '—' : `$${stats.cpm.toFixed(2)}`,                  sub: 'Coût pour mille',                                      accent: false },
      { label: 'CPA',        value: loading ? '—' : `$${stats.cpa.toFixed(2)}`,                  sub: 'Coût par action',                                      accent: false },
    ];
  }, [stats, statsLoading]);

  const isConnected = Boolean(account?.externalAccountId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="rounded-2xl border border-snap-border bg-snap-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-snap-ink">Tableau de bord</h1>
            <p className="mt-1 text-sm text-snap-muted">Performances Snapchat Ads</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs text-snap-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Synchro. en direct
            </div>
            {isAccountLoading ? null : isConnected ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Connecté
              </div>
            ) : (
              <button onClick={onConnectSnapchat} className="rounded-xl bg-snap-yellow px-4 py-2 text-xs font-semibold text-snap-ink hover:brightness-105 transition-all">
                Connecter Snapchat
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filtre de dates — style Facebook Ads */}
      <div className="rounded-2xl border border-snap-border bg-snap-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted mr-1">Période</span>

          {/* Presets */}
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activePreset === preset.label && !showCustom
                  ? 'bg-snap-yellow text-snap-ink'
                  : 'border border-snap-border bg-snap-soft text-snap-muted hover:text-snap-ink hover:border-snap-muted'
              }`}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom */}
          <button
            onClick={() => { setShowCustom(true); setActivePreset(''); }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              showCustom
                ? 'bg-snap-yellow text-snap-ink'
                : 'border border-snap-border bg-snap-soft text-snap-muted hover:text-snap-ink'
            }`}
          >
            Personnalisé
          </button>

          {/* Date range affiché */}
          <span className="ml-auto text-xs text-snap-muted">
            {dateRange.start} → {dateRange.end}
          </span>
        </div>

        {/* Inputs custom */}
        {showCustom && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-snap-border pt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-snap-muted">Du</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                className="rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs text-snap-ink focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-snap-muted">Au</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                className="rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs text-snap-ink focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200"
              />
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-xl bg-snap-yellow px-4 py-1.5 text-xs font-semibold text-snap-ink hover:brightness-105 transition-all"
            >
              Appliquer
            </button>
          </div>
        )}
      </div>

      {statsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Impossible de charger les statistiques. Vérifiez votre connexion Snapchat.
        </div>
      )}

      {/* Metric cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(card => (
          <article
            key={card.label}
            className={`rounded-2xl border p-5 transition-all duration-150 hover:border-snap-muted ${
              card.accent ? 'border-yellow-300 bg-snap-yellow/10' : 'border-snap-border bg-snap-card'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">{card.label}</p>
            <div className={`mt-3 text-3xl font-semibold ${card.accent ? 'text-yellow-600' : 'text-snap-ink'} ${statsLoading ? 'animate-pulse' : ''}`}>
              {card.value}
            </div>
            <p className="mt-1 text-xs text-snap-muted">{card.sub}</p>
          </article>
        ))}
      </section>

      {/* Bottom sections */}
      <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-snap-border bg-snap-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-snap-ink">Exécutions récentes</h2>
              <p className="mt-0.5 text-xs text-snap-muted">Historique des règles automatisées.</p>
            </div>
            <span className="rounded-xl border border-snap-border bg-snap-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
              {demoExecutions.length} éléments
            </span>
          </div>
          <div className="space-y-3">
            {demoExecutions.map(exec => {
              const s = statusConfig[exec.status] ?? statusConfig.SKIPPED;
              return (
                <div key={exec.id} className="rounded-xl border border-snap-border bg-snap-soft p-4 hover:border-snap-muted transition-colors">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-sm font-medium text-snap-ink">{exec.ruleName}</h3>
                      <p className="mt-0.5 text-xs text-snap-muted">{exec.message}</p>
                    </div>
                    <span className="text-[11px] text-snap-muted shrink-0">{exec.executedAt}</span>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${s.classes}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-snap-border bg-snap-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-snap-ink">Notifications</h2>
                <p className="mt-0.5 text-xs text-snap-muted">Alertes et mises à jour.</p>
              </div>
              <span className="rounded-lg bg-yellow-100 px-2 py-1 text-[10px] font-semibold text-yellow-700">
                {demoNotifications.filter(n => !n.read).length} new
              </span>
            </div>
            <div className="space-y-2">
              {demoNotifications.map(note => (
                <div
                  key={note.id}
                  className={`rounded-xl border px-4 py-3 transition-colors ${note.read ? 'border-snap-border bg-snap-soft' : 'border-yellow-300 bg-yellow-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs font-semibold ${note.read ? 'text-snap-muted' : 'text-snap-ink'}`}>{note.title}</h3>
                    {!note.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />}
                  </div>
                  <p className="mt-1 text-[11px] text-snap-muted leading-relaxed">{note.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-snap-border bg-snap-card p-5">
            <h2 className="text-base font-semibold text-snap-ink">Résumé rapide</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3 text-xs text-snap-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {stats ? `${stats.activeCampaigns} campagne(s) active(s)` : 'Chargement...'}
              </li>
              <li className="flex items-center gap-3 text-xs text-snap-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {stats ? `${stats.pausedCampaigns} campagne(s) en pause` : 'Chargement...'}
              </li>
              <li className="flex items-center gap-3 text-xs text-snap-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-snap-muted/40" />
                Période : {dateRange.start} → {dateRange.end}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;