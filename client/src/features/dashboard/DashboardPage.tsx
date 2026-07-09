import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchSnapchatAccount, getSnapchatAuthorizeUrl } from './dashboard.service';
import { DashboardStatsResponse, SnapchatAccountResponse } from './dashboard.service';
import { ExecutionItem, NotificationItem } from './dashboard.types';

const demoExecutions: ExecutionItem[] = [
  { id: 'exec-001', ruleName: 'Augmenter budget CPC faible', status: 'SUCCEEDED', message: 'Budget augmenté de 15%', executedAt: '2026-06-25 15:23' },
  { id: 'exec-002', ruleName: 'Pause campagne test', status: 'FAILED', message: 'API Snapchat non disponible', executedAt: '2026-06-25 14:50' },
  { id: 'exec-003', ruleName: 'Réduction budget conversion', status: 'SKIPPED', message: 'Condition non remplie', executedAt: '2026-06-25 13:30' }
];

const demoNotifications: NotificationItem[] = [
  { id: 'notif-001', title: 'Connexion Snapchat réussie', message: 'Votre compte Snapchat a été connecté avec succès.', read: true, createdAt: '2026-06-25 12:10' },
  { id: 'notif-002', title: 'Règle exécutée', message: 'La règle "Pause campagne test" a échoué.', read: false, createdAt: '2026-06-25 14:50' },
  { id: 'notif-003', title: 'Campagne synchronisée', message: 'Les données des campagnes ont été mises à jour.', read: false, createdAt: '2026-06-25 15:00' }
];

const statusConfig: Record<string, { label: string; classes: string }> = {
  SUCCEEDED: { label: 'Succès', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  FAILED: { label: 'Échec', classes: 'bg-red-50 text-red-600 border border-red-200' },
  SKIPPED: { label: 'Ignoré', classes: 'bg-snap-soft text-snap-muted border border-snap-border' },
};

const DashboardPage = () => {
  const { data: stats, error: statsError } = useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60,
    retry: false
  });

  const { data: account, isLoading: isAccountLoading } = useQuery<SnapchatAccountResponse>({
    queryKey: ['snapchat', 'me'],
    queryFn: fetchSnapchatAccount,
    staleTime: 1000 * 60,
    retry: false
  });

  const onConnectSnapchat = async () => {
    try {
      const url = await getSnapchatAuthorizeUrl();
      if (!url) {
        throw new Error('Authorization URL not returned from server');
      }
      window.location.assign(url);
    } catch (error) {
      console.error('Unable to fetch Snapchat authorization URL', error);
      alert('Impossible de lancer l’autorisation Snapchat. Vérifiez votre connexion ou rechargez la page.');
    }
  };

  const metricCards = useMemo(() => {
    if (!stats) {
      return [
        { label: 'Campagnes', value: '—', sub: 'Chargement...', accent: true },
        { label: 'En pause', value: '—', sub: 'Chargement...', accent: false },
        { label: 'Dépenses', value: '—', sub: 'Chargement...', accent: false },
        { label: 'CTR', value: '—', sub: 'Chargement...', accent: false },
        { label: 'CPM', value: '—', sub: 'Chargement...', accent: false },
        { label: 'CPA', value: '—', sub: 'Chargement...', accent: false },
        { label: 'ROAS', value: '—', sub: 'Chargement...', accent: false }
      ];
    }

    return [
      { label: 'Campagnes', value: stats.campaignCount, sub: `${stats.activeCampaigns} actives`, accent: true },
      { label: 'En pause', value: stats.pausedCampaigns, sub: 'Campagnes en pause', accent: false },
      { label: 'Dépenses', value: `€${stats.spend.toLocaleString()}`, sub: 'Total des dépenses', accent: false },
      { label: 'CTR', value: `${stats.ctr}%`, sub: 'Taux de clics', accent: false },
      { label: 'CPM', value: `€${stats.cpm.toFixed(2)}`, sub: 'Coût pour mille', accent: false },
      { label: 'CPA', value: `€${stats.cpa.toFixed(2)}`, sub: 'Coût par acquisition', accent: false },
      { label: 'ROAS', value: `${stats.roas.toFixed(1)}x`, sub: 'Retour sur dépenses', accent: false }
    ];
  }, [stats]);

  const isConnected = Boolean(account?.externalAccountId);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-snap-border bg-snap-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-snap-ink">Tableau de bord</h1>
            <p className="mt-1 text-sm text-snap-muted">Vue d'ensemble des performances Snapchat Ads.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs text-snap-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Synchro. il y a 5 min
            </div>
            {isAccountLoading ? (
              <div className="rounded-xl border border-snap-border bg-snap-soft px-4 py-2 text-xs text-snap-muted">Chargement compte...</div>
            ) : isConnected ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Connecté
              </div>
            ) : (
              <button
                type="button"
                onClick={onConnectSnapchat}
                className="rounded-xl border border-snap-border bg-snap-soft px-4 py-2 text-xs font-semibold text-snap-ink transition-colors hover:border-snap-muted"
              >
                Connecter Snapchat
              </button>
            )}
          </div>
        </div>
      </header>

      {statsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Impossible de charger les statistiques Snapchat. Vérifiez votre connexion ou reconnectez votre compte.
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(card => (
          <article
            key={card.label}
            className={`rounded-2xl border p-5 transition-all duration-150 hover:border-snap-muted ${
              card.accent
                ? 'border-yellow-300 bg-snap-yellow/10'
                : 'border-snap-border bg-snap-card'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">{card.label}</p>
            <div className={`mt-3 text-3xl font-semibold ${card.accent ? 'text-yellow-600' : 'text-snap-ink'}`}>
              {card.value}
            </div>
            <p className="mt-1 text-xs text-snap-muted">{card.sub}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-snap-border bg-snap-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-snap-ink">Exécutions récentes</h2>
              <p className="mt-0.5 text-xs text-snap-muted">Historique des dernières règles automatisées.</p>
            </div>
            <span className="rounded-xl border border-snap-border bg-snap-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
              {demoExecutions.length} éléments
            </span>
          </div>
          <div className="space-y-3">
            {demoExecutions.map(exec => {
              const s = statusConfig[exec.status] ?? statusConfig.SKIPPED;
              return (
                <div key={exec.id} className="rounded-xl border border-snap-border bg-snap-soft p-4 transition-colors hover:border-snap-muted">
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
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    note.read
                      ? 'border-snap-border bg-snap-soft'
                      : 'border-yellow-300 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs font-semibold ${note.read ? 'text-snap-muted' : 'text-snap-ink'}`}>
                      {note.title}
                    </h3>
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
                Toutes les règles sont actives.
              </li>
              <li className="flex items-center gap-3 text-xs text-snap-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                10 campagnes sont en pause.
              </li>
              <li className="flex items-center gap-3 text-xs text-snap-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-snap-muted/40" />
                Prochaine synchronisation dans 5 minutes.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

