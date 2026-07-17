import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Campaign, AdSquad, CampaignQuery } from './campaigns.types';
import { fetchCampaigns, fetchAdSquads, fetchAds } from './campaigns.service';
import RuleModal from './components/RuleModal';
import type { Ad } from './campaigns.types';
import { useTranslation } from '../../shared/lib/i18n';

const defaultQuery: CampaignQuery = {
  search: '',
  status: 'ALL',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20,
};

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  ACTIVE:   { label: 'Active',    dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAUSED:   { label: 'En pause',  dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200'       },
  ARCHIVED: { label: 'Archivée',  dot: 'bg-snap-muted',  badge: 'bg-snap-soft text-snap-muted border-snap-border'   },
  DRAFT:    { label: 'Brouillon', dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200'          },
};

// ── Petite ligne de statut avec badge ──────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const s = statusConfig[status] ?? statusConfig.ARCHIVED;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Ligne Ad ────────────────────────────────────────────────────
const AdRow = ({ ad, onCreateRule }: { ad: Ad; onCreateRule: (target: { type: 'ad'; id: string; name: string }) => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-snap-border bg-white px-4 py-2.5 transition-colors hover:border-snap-muted">
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-snap-border bg-snap-bg">
        <span className="text-[9px] text-snap-muted">🎯</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-snap-ink">{ad.name}</p>
        {ad.type && <p className="text-[10px] text-snap-muted">{ad.type}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <StatusBadge status={ad.status} />
      <button
        onClick={() => onCreateRule({ type: 'ad', id: ad.id, name: ad.name })}
        className="flex items-center gap-1 rounded-lg border border-snap-yellow/30 bg-snap-yellow/10 px-2.5 py-1 text-[10px] font-semibold text-yellow-700 hover:bg-snap-yellow/20 transition-all"
      >
        ⚡
      </button>
    </div>
  </div>
);

// ── Ligne Ad Squad avec expand ads ─────────────────────────────
const AdSquadRow = ({
  squad,
  onCreateRule,
}: {
  squad: AdSquad;
  onCreateRule: (target: { type: 'campaign' | 'adsquad' | 'ad'; id: string; name: string }) => void;
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const { data: ads = [], isLoading } = useQuery<Ad[]>({
    queryKey: ['ads', squad.id],
    queryFn: () => fetchAds(squad.id),
    enabled: expanded,
  });

  return (
    <div className={`rounded-xl border transition-all duration-150 ${expanded ? 'border-snap-border bg-snap-soft' : 'border-snap-border bg-snap-bg'}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setExpanded(p => !p)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-snap-border bg-snap-card transition-transform duration-150"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <span className="text-[9px] text-snap-muted">▶</span>
          </button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-snap-border bg-snap-card">
            <span className="text-[10px] text-snap-muted">Ad</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-snap-ink">{squad.name}</p>
            <p className="text-xs text-snap-muted">
              {squad.dailyBudget ? `$${squad.dailyBudget.toFixed(2)}/j` : t('campaigns.budget.undefined')}
              {squad.bidAmount ? ` · Enchère $${squad.bidAmount.toFixed(2)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={squad.status} />
          <button
            onClick={() => onCreateRule({ type: 'adsquad', id: squad.id, name: squad.name })}
            className="flex items-center gap-1.5 rounded-xl border border-snap-yellow/40 bg-snap-yellow/10 px-3 py-1.5 text-[11px] font-semibold text-yellow-700 hover:bg-snap-yellow/20 transition-all"
          >
            {t('campaigns.rule.adsetButton')}
          </button>
        </div>
      </div>

      {/* Ads expandables */}
      {expanded && (
        <div className="border-t border-snap-border/50 px-4 pb-3 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
            {t('campaigns.adsets.title')} ({isLoading ? '...' : ads.length})
          </p>
          {isLoading ? (
            <div className="space-y-1.5">
              {[1, 2].map(i => <div key={i} className="h-10 rounded-xl bg-snap-card animate-pulse" />)}
            </div>
          ) : ads.length === 0 ? (
            <p className="text-xs text-snap-muted">{t('campaigns.ads.none')}</p>
          ) : (
            <div className="space-y-1.5">
              {ads.map(ad => (
                <AdRow key={ad.id} ad={ad} onCreateRule={onCreateRule} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Ligne Campagne avec expand ──────────────────────────────────
const CampaignRow = ({
  campaign,
  isExpanded,
  onToggle,
  onCreateRule,
}: {
  campaign: Campaign;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateRule: (target: { type: 'campaign' | 'adsquad' | 'ad'; id: string; name: string }) => void;
}) => {
  const { t } = useTranslation();
  const { data: adSquads = [], isLoading } = useQuery<AdSquad[]>({
    queryKey: ['adsquads', campaign.id],
    queryFn: () => fetchAdSquads(campaign.id),
    enabled: isExpanded,
  });

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-snap-yellow/30 bg-snap-yellow/5' : 'border-snap-border bg-snap-card'}`}>
      {/* Header campagne */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggle}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-snap-border bg-snap-soft transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <span className="text-xs text-snap-muted">▶</span>
        </button>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-snap-ink">{campaign.name}</p>
          <p className="mt-0.5 text-xs text-snap-muted">
            {campaign.objective ?? t('campaigns.objective.undefined')}
            {campaign.dailyBudget ? ` · $${campaign.dailyBudget.toFixed(0)}/j` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={campaign.status} />
          <button
            onClick={() => onCreateRule({ type: 'campaign', id: campaign.id, name: campaign.name })}
            className="flex items-center gap-1.5 rounded-xl bg-snap-yellow px-3 py-1.5 text-[11px] font-semibold text-snap-ink hover:brightness-105 transition-all"
          >
            {t('campaigns.rule.campaignButton')}
          </button>
        </div>
      </div>

      {/* Ad Squads expandables */}
      {isExpanded && (
        <div className="border-t border-snap-border/50 px-4 pb-4 pt-3">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-snap-muted">
            {t('campaigns.adsets.title')} ({isLoading ? '...' : adSquads.length})
          </p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-snap-soft animate-pulse" />)}
            </div>
          ) : adSquads.length === 0 ? (
            <p className="text-xs text-snap-muted">{t('campaigns.adsets.none')}</p>
          ) : (
            <div className="space-y-2">
              {adSquads.map(squad => (
                <AdSquadRow key={squad.id} squad={squad} onCreateRule={onCreateRule} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Page principale ─────────────────────────────────────────────
const CampaignsPage = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState<CampaignQuery>(defaultQuery);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [ruleTarget, setRuleTarget] = useState<{ type: 'campaign' | 'adsquad' | 'ad'; id: string; name: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaigns', query],
    queryFn: () => fetchCampaigns(query),
  });

  const campaigns = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="rounded-2xl border border-snap-border bg-snap-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-snap-ink">{t('campaigns.title')}</h1>
              <p className="mt-1 text-sm text-snap-muted">
                {isLoading ? t('dashboard.loading') : (total === 1 ? t('campaigns.subtitle.single', { count: total }) : t('campaigns.subtitle.multi', { count: total }))}
              </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs text-snap-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t('campaigns.liveStatus')}
            </div>
          </div>
        </div>
      </header>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-snap-muted px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-snap-yellow text-[9px] font-bold text-snap-ink">⚡</span>
          {t('campaigns.legend.campaign')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 rounded-xl border border-snap-yellow/40 bg-snap-yellow/10 px-2 text-[9px] font-bold text-yellow-700 items-center">⚡ Règle</span>
          {t('campaigns.legend.adset')}
        </span>
      </div>

      {/* Filtres */}
      <div className="rounded-2xl border border-snap-border bg-snap-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="search"
            value={query.search}
            onChange={e => setQuery({ ...query, search: e.target.value, page: 1 })}
            placeholder={t('campaigns.filters.searchPlaceholder')}
            className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink placeholder:text-snap-muted focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-200 transition-all"
          />
          <select
            value={query.status}
            onChange={e => setQuery({ ...query, status: e.target.value as CampaignQuery['status'], page: 1 })}
            className="w-full rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-ink focus:border-yellow-400 focus:outline-none transition-all"
          >
            <option value="ALL">{t('campaigns.filters.status.All')}</option>
            <option value="ACTIVE">{t('campaigns.filters.status.ACTIVE')}</option>
            <option value="PAUSED">{t('campaigns.filters.status.PAUSED')}</option>
            <option value="ARCHIVED">{t('campaigns.filters.status.ARCHIVED')}</option>
            <option value="DRAFT">{t('campaigns.filters.status.DRAFT')}</option>
          </select>
          <button
            onClick={() => setExpandedIds(prev => prev.size > 0 ? new Set() : new Set(campaigns.map(c => c.id)))}
            className="rounded-xl border border-snap-border bg-snap-soft px-4 py-2.5 text-sm text-snap-muted hover:text-snap-ink transition-all"
          >
            {expandedIds.size > 0 ? t('campaigns.button.collapseAll') : t('campaigns.button.expandAll')}
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {t('campaigns.error.load')}
        </div>
      )}

      {/* Liste campagnes */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-snap-border bg-snap-card animate-pulse" />
          ))
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-snap-border bg-snap-card p-12 text-center">
            <p className="text-sm text-snap-muted">{t('campaigns.empty')}</p>
          </div>
        ) : (
          campaigns.map(campaign => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              isExpanded={expandedIds.has(campaign.id)}
              onToggle={() => toggleExpand(campaign.id)}
              onCreateRule={setRuleTarget}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > query.pageSize && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-snap-muted">{t('campaigns.pagination.page', { current: query.page, total: totalPages })}</span>
          <div className="flex gap-2">
            <button
              disabled={query.page <= 1}
              onClick={() => setQuery(p => ({ ...p, page: p.page - 1 }))}
              className="rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs text-snap-muted hover:text-snap-ink disabled:opacity-40 transition-all"
            >
              {t('campaigns.pagination.previous')}
            </button>
            <button
              disabled={query.page >= totalPages}
              onClick={() => setQuery(p => ({ ...p, page: p.page + 1 }))}
              className="rounded-xl border border-snap-border bg-snap-soft px-3 py-1.5 text-xs text-snap-muted hover:text-snap-ink disabled:opacity-40 transition-all"
            >
              {t('campaigns.pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Modal Rule */}
      {ruleTarget && (
        <RuleModal
          target={ruleTarget}
          onClose={() => setRuleTarget(null)}
        />
      )}
    </div>
  );
};

export default CampaignsPage;