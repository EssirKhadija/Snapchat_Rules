import axios, { AxiosInstance } from 'axios';
import prisma from '../../prisma/client';
import { getSnapchatAccount, getValidAccessToken } from '../snapchat.service';

const API_BASE = 'https://adsapi.snapchat.com/v1';

async function getAuthorizedAxios(userId: string): Promise<AxiosInstance> {
  const accessToken = await getValidAccessToken(userId);
  return axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
}

export async function fetchCampaigns(userId: string) {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/adaccounts/${account.externalAccountId}/campaigns`);

  const campaigns: any[] = response.data?.campaigns ?? [];
  return campaigns.map((item: any) => {
    const c = item.campaign ?? item;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective ?? null,
      dailyBudget: c.daily_budget_micro ? c.daily_budget_micro / 1_000_000 : null,
      startTime: c.start_time ?? null,
      endTime: c.end_time ?? null,
    };
  });
}

export async function fetchAdSquads(userId: string, campaignId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/campaigns/${campaignId}/adsquads`);
  const squads: any[] = response.data?.adsquads ?? [];
  return squads.map((item: any) => {
    const s = item.adsquad ?? item;
    return {
      id: s.id,
      name: s.name,
      status: s.status,
      dailyBudget: s.daily_budget_micro ? s.daily_budget_micro / 1_000_000 : null,
      bidAmount: s.bid_micro ? s.bid_micro / 1_000_000 : null,
    };
  });
}

export async function fetchCampaignStats(userId: string, adAccountId: string) {
  const client = await getAuthorizedAxios(userId);
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = now.toISOString();

    const response = await client.get(`/adaccounts/${adAccountId}/stats`, {
      params: {
        granularity: 'TOTAL',
        fields: 'impressions,swipes,spend',
        start_time: start,
        end_time: end,
      },
    });
    return response.data?.total_stats?.[0]?.total_stat?.breakdown_stats ?? null;
  } catch {
    return null;
  }
}

export async function getDashboardStats(userId: string, startDateParam?: string, endDateParam?: string) {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const campaigns = await fetchCampaigns(userId);
  console.log('u{1F3AF} Campaigns:', JSON.stringify(campaigns.map(c => ({ id: c.id, name: c.name, status: c.status })), null, 2));
  console.log('CAMPAIGNS:', JSON.stringify(campaigns.map(c => ({ id: c.id, name: c.name, status: c.status }))));
  const campaignCount = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status?.toUpperCase() === 'ACTIVE').length;
  const pausedCampaigns = campaigns.filter(c => c.status?.toUpperCase() === 'PAUSED').length;

  let spend = 0, impressions = 0, clicks = 0;
  try {
    const client = await getAuthorizedAxios(userId);
    const now = new Date();

    const fmt = (d: Date) => d.toISOString().split('.')[0] + '+00:00';
    const todayStr = now.toISOString().split('T')[0];

    // Start : dÃ©but du jour demandÃ© Ã  minuit UTC
    const startRaw = startDateParam
      ? new Date(startDateParam + 'T00:00:00Z')
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30, 0, 0, 0));
    const start = new Date(Date.UTC(startRaw.getUTCFullYear(), startRaw.getUTCMonth(), startRaw.getUTCDate(), 0, 0, 0));

    // End : si jour passÃ© â†’ minuit du lendemain (= fin de la journÃ©e complÃ¨te)
    //        si aujourd'hui â†’ heure courante pile (Snapchat exige heure ronde)
    let endHour: Date;
    const endDateStr = endDateParam ?? todayStr;

    if (endDateStr < todayStr) {
      // Jour passÃ© : couvrir la journÃ©e entiÃ¨re jusqu'Ã  minuit
      const endRaw = new Date(endDateStr + 'T00:00:00Z');
      endHour = new Date(Date.UTC(endRaw.getUTCFullYear(), endRaw.getUTCMonth(), endRaw.getUTCDate() + 1, 0, 0, 0));
    } else {
      // Aujourd'hui : heure courante arrondie Ã  l'heure pile
      endHour = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0));
      // Si mÃªme heure que start, avancer d'1h
      if (endHour.getTime() <= start.getTime()) {
        endHour = new Date(endHour.getTime() + 3600 * 1000);
      }
    }

    console.log('ðŸ“Š Stats period:', fmt(start), '->', fmt(endHour));

    // Spend au niveau adaccount (seul champ acceptÃ© Ã  ce niveau)
    const accountStatsRes = await client.get(
      `/adaccounts/${account.externalAccountId}/stats`,
      { params: { granularity: 'TOTAL', fields: 'spend', start_time: fmt(start), end_time: fmt(endHour) } }
    );
    const accountStat = accountStatsRes.data?.total_stats?.[0]?.total_stat;
    spend = accountStat?.stats?.spend ? accountStat.stats.spend / 1_000_000 : 0;
    // Impressions + swipes au niveau campagne
    // Impressions + swipes — seulement sur la campagne ACTIVE pour débugger
const activeCampaign = campaigns.find(c => c.status === 'ACTIVE');
console.log('🎯 Active campaign:', activeCampaign?.id, activeCampaign?.name);

const campaignStatsResults = await Promise.allSettled(
  campaigns.map(c =>
    client.get(`/campaigns/${c.id}/stats`, {
      params: { granularity: 'TOTAL', fields: 'impressions,swipes', start_time: fmt(start), end_time: fmt(endHour) }
    })
  )
);

for (const result of campaignStatsResults) {
  if (result.status === 'fulfilled') {
    const totalStat = result.value.data?.total_stats?.[0]?.total_stat;
    if (totalStat?.stats) {
      // Les données sont dans .stats, pas directement sur total_stat
      impressions += totalStat.stats.impressions ?? 0;
      clicks += totalStat.stats.swipes ?? 0;
    }
  }
}

    console.log('âœ… spend:', spend, '| impressions:', impressions, '| swipes:', clicks);

  } catch (err: any) {
    console.error('âŒ Stats failed:', err.response?.status, err.response?.data ?? err.message);
  }

  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
  const cpm = impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(2)) : 0;
  const cpa = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;

  return { campaignCount, activeCampaigns, pausedCampaigns, spend, impressions, clicks, ctr, cpm, cpa, roas: 0 };
}
export async function syncCampaigns(userId: string) {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const campaigns = await fetchCampaigns(userId);
  console.log('u{1F3AF} Campaigns:', JSON.stringify(campaigns.map(c => ({ id: c.id, name: c.name, status: c.status })), null, 2));
  console.log('ðŸŽ¯ All campaigns:', JSON.stringify(campaigns.map(c => ({ id: c.id, name: c.name, status: c.status })), null, 2));

  const updates = await Promise.all(
    campaigns.map((campaign: any) =>
      prisma.campaign.upsert({
        where: { externalId: campaign.id },
        create: {
          snapchatAccountId: account.id,
          externalId: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          dailyBudget: campaign.dailyBudget,
          startTime: campaign.startTime ? new Date(campaign.startTime) : null,
          endTime: campaign.endTime ? new Date(campaign.endTime) : null,
        },
        update: {
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          dailyBudget: campaign.dailyBudget,
          startTime: campaign.startTime ? new Date(campaign.startTime) : null,
          endTime: campaign.endTime ? new Date(campaign.endTime) : null,
        },
      })
    )
  );

  return updates;
}

export async function syncAdSquads(userId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { snapchatAccount: { userId } },
  });

  const updates = [];
  for (const campaign of campaigns) {
    const squads = await fetchAdSquads(userId, campaign.externalId);
    for (const squad of squads) {
      updates.push(
        await prisma.adSquad.upsert({
          where: { externalId: squad.id },
          create: {
            campaignId: campaign.id,
            externalId: squad.id,
            name: squad.name,
            status: squad.status,
            dailyBudget: squad.dailyBudget,
            bidAmount: squad.bidAmount,
          },
          update: {
            name: squad.name,
            status: squad.status,
            dailyBudget: squad.dailyBudget,
            bidAmount: squad.bidAmount,
          },
        })
      );
    }
  }
  return updates;
}
export async function fetchAds(userId: string, adSquadId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/adsquads/${adSquadId}/ads`);
  const ads: any[] = response.data?.ads ?? [];
  return ads.map((item: any) => {
    const a = item.ad ?? item;
    return {
      id: a.id,
      name: a.name,
      status: a.status,
      type: a.type ?? null,
    };
  });
}
