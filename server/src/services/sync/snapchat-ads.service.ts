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

export async function getDashboardStats(
  userId: string,
  startDateParam?: string,
  endDateParam?: string,
  campaignIdParam?: string
) {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const allCampaigns = await fetchCampaigns(userId);

  const campaigns = campaignIdParam
    ? allCampaigns.filter(c => c.id === campaignIdParam)
    : allCampaigns;

  const campaignCount = allCampaigns.length;
  const activeCampaigns = allCampaigns.filter(c => c.status?.toUpperCase() === 'ACTIVE').length;
  const pausedCampaigns = allCampaigns.filter(c => c.status?.toUpperCase() === 'PAUSED').length;

  let spend = 0, impressions = 0, clicks = 0, conversions = 0;

  try {
    const client = await getAuthorizedAxios(userId);
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split('.')[0] + '+00:00';
    const todayStr = now.toISOString().split('T')[0];

    const startRaw = startDateParam
      ? new Date(startDateParam + 'T00:00:00Z')
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30, 0, 0, 0));
    const start = new Date(Date.UTC(
      startRaw.getUTCFullYear(),
      startRaw.getUTCMonth(),
      startRaw.getUTCDate(),
      0, 0, 0
    ));

    let endHour: Date;
    const endDateStr = endDateParam ?? todayStr;

    if (endDateStr < todayStr) {
      const endRaw = new Date(endDateStr + 'T00:00:00Z');
      endHour = new Date(Date.UTC(
        endRaw.getUTCFullYear(),
        endRaw.getUTCMonth(),
        endRaw.getUTCDate() + 1,
        0, 0, 0
      ));
    } else {
      endHour = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        0, 0
      ));
      if (endHour.getTime() <= start.getTime()) {
        endHour = new Date(endHour.getTime() + 3600 * 1000);
      }
    }

    console.log('📊 Stats period:', fmt(start), '->', fmt(endHour));
    console.log('📊 Fetching stats for', campaigns.length, 'campaign(s)');

    // Spend + impressions + swipes + conversions au niveau campagne
    const campaignStatsResults = await Promise.allSettled(
      campaigns.map(c =>
        client.get(`/campaigns/${c.id}/stats`, {
          params: {
            granularity: 'TOTAL',
            fields: 'impressions,swipes,spend,conversion_purchases',
            start_time: fmt(start),
            end_time: fmt(endHour),
          },
        })
      )
    );

    for (const result of campaignStatsResults) {
      if (result.status === 'fulfilled') {
        const stat = result.value.data?.total_stats?.[0]?.total_stat?.stats;
        if (stat) {
          impressions += stat.impressions ?? 0;
          clicks += stat.swipes ?? 0;
          conversions += stat.conversion_purchases ?? 0;
          spend += stat.spend ? stat.spend / 1_000_000 : 0;
        }
      } else {
        console.error('❌ Campaign stat failed:', result.reason?.response?.data ?? result.reason?.message);
      }
    }

    console.log('✅ spend:', spend, '| impressions:', impressions, '| swipes:', clicks, '| conversions:', conversions);

  } catch (err: any) {
    console.error('❌ Stats failed:', err.response?.status, err.response?.data ?? err.message);
  }

  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
  const cpm = impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(2)) : 0;
  const cpa = conversions > 0 ? Number((spend / conversions).toFixed(2)) : 0;

  return {
    campaignCount,
    activeCampaigns,
    pausedCampaigns,
    spend,
    impressions,
    clicks,
    conversions,
    ctr,
    cpm,
    cpa,
    roas: 0,
  };
}

export async function syncCampaigns(userId: string) {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const campaigns = await fetchCampaigns(userId);

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