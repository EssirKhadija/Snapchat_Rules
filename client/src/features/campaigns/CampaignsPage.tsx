import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Campaign, CampaignQuery } from './campaigns.types';
import { fetchCampaigns } from './campaigns.service';

const defaultQuery: CampaignQuery = {
  search: '',
  status: 'ALL',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  pageSize: 8
};

const mockCampaigns: Campaign[] = Array.from({ length: 12 }).map((_, index) => ({
  id: `camp-${index + 1}`,
  name: `Campagne ${index + 1}`,
  status: index % 3 === 0 ? 'PAUSED' : 'ACTIVE',
  budget: 1500 + index * 200,
  spend: 500 + index * 100,
  ctr: 1.5 + index * 0.1,
  cpm: 8 + index * 0.7,
  cpa: 25 + index * 1.5,
  roas: 2.5 + index * 0.2,
  syncStatus: index % 4 === 0 ? 'FAILED' : 'SYNCED',
  impressions: 10000 + index * 500,
  clicks: 150 + index * 10,
  conversions: 20 + index * 2
}));

const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
        <p className="mt-1 text-sm text-slate-500">Statut : {campaign.status}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${campaign.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-700' : campaign.syncStatus === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
        {campaign.syncStatus}
      </span>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">Budget</p>
        <p className="mt-2 text-xl font-semibold">€{campaign.budget.toFixed(0)}</p>
      </div>
      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">Dépense</p>
        <p className="mt-2 text-xl font-semibold">€{campaign.spend.toFixed(0)}</p>
      </div>
      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">CTR</p>
        <p className="mt-2 text-xl font-semibold">{campaign.ctr.toFixed(2)}%</p>
      </div>
      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">ROAS</p>
        <p className="mt-2 text-xl font-semibold">{campaign.roas.toFixed(2)}x</p>
      </div>
    </div>
  </div>
);

const CampaignsPage = () => {
  const [query, setQuery] = useState<CampaignQuery>(defaultQuery);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const fallbackData = { data: mockCampaigns.slice(0, 8), total: mockCampaigns.length };
  const { data = fallbackData } = useQuery({
    queryKey: ['campaigns', query],
    queryFn: () => fetchCampaigns(query),
    enabled: false
  });

  const campaigns = data.data;
  const totalPages = Math.ceil(data.total / query.pageSize);

  const filtered = useMemo(() => {
    const searchLower = query.search.toLowerCase();
    return mockCampaigns
      .filter(c => c.name.toLowerCase().includes(searchLower))
      .filter(c => query.status === 'ALL' ? true : c.status === query.status);
  }, [query.search, query.status]);

  const pageItems = filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Gestion des campagnes</h1>
            <p className="mt-2 text-slate-600">Recherchez, filtrez et consultez les performances des campagnes.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
              <input
                type="search"
                value={query.search}
                onChange={e => setQuery({ ...query, search: e.target.value, page: 1 })}
                placeholder="Rechercher une campagne"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              />
              <select
                value={query.status}
                onChange={e => setQuery({ ...query, status: e.target.value as CampaignQuery['status'], page: 1 })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">En pause</option>
                <option value="ARCHIVED">Archivée</option>
                <option value="DRAFT">Brouillon</option>
              </select>
              <select
                value={`${query.sortBy}-${query.sortOrder}`}
                onChange={e => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [CampaignQuery['sortBy'], CampaignQuery['sortOrder']];
                  setQuery({ ...query, sortBy, sortOrder });
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <option value="name-asc">Nom (A → Z)</option>
                <option value="name-desc">Nom (Z → A)</option>
                <option value="budget-desc">Budget (haut → bas)</option>
                <option value="spend-desc">Dépense (haut → bas)</option>
                <option value="ctr-desc">CTR (haut → bas)</option>
                <option value="roas-desc">ROAS (haut → bas)</option>
              </select>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="grid gap-4">
              {pageItems.map(campaign => (
                <div key={campaign.id} className="rounded-3xl border border-slate-200 p-4 hover:border-slate-400">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{campaign.name}</p>
                      <p className="text-sm text-slate-500">Statut : {campaign.status}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-500">Page {query.page} sur {Math.max(1, Math.ceil(filtered.length / query.pageSize))}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuery(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setQuery(prev => ({ ...prev, page: Math.min(Math.ceil(filtered.length / prev.pageSize), prev.page + 1) }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold">Détails de la campagne</h2>
            {!selectedCampaign ? (
              <p className="mt-4 text-slate-500">Sélectionne une campagne pour voir les statistiques.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Nom</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedCampaign.name}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Budget</p>
                    <p className="mt-2 text-lg font-semibold">€{selectedCampaign.budget.toFixed(0)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Statut</p>
                    <p className="mt-2 text-lg font-semibold">{selectedCampaign.status}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Impressions</p>
                    <p className="mt-2 text-lg font-semibold">{selectedCampaign.impressions.toLocaleString()}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Clics</p>
                    <p className="mt-2 text-lg font-semibold">{selectedCampaign.clicks.toLocaleString()}</p>
                  </div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Conversions</p>
                  <p className="mt-2 text-lg font-semibold">{selectedCampaign.conversions}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold">Statistiques globales</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total campagnes</p>
                <p className="mt-2 text-lg font-semibold">{filtered.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Taux de synchronisation</p>
                <p className="mt-2 text-lg font-semibold">{Math.round((filtered.filter(c => c.syncStatus === 'SYNCED').length / Math.max(1, filtered.length)) * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CampaignsPage;
