import axios, { AxiosInstance } from 'axios';
import { decrypt } from '../../utils/crypto';
import prisma from '../../prisma/client';
import { getSnapchatAccount, refreshSnapchatToken } from '../snapchat.service';

const API_BASE = 'https://adsapi.snapchat.com/v1';

function normalizeSnapchatResponse<T>(response: any): T[] {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
}

async function getValidAccessToken(userId: string): Promise<string> {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() <= Date.now()) {
    await refreshSnapchatToken(account.externalAccountId);
    const refreshed = await getSnapchatAccount(userId);
    if (!refreshed) throw new Error('Snapchat account not connected after refresh');
    return decrypt(refreshed.accessTokenEncrypted);
  }

  return decrypt(account.accessTokenEncrypted);
}

async function getAuthorizedAxios(userId: string): Promise<AxiosInstance> {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const accessToken = await getValidAccessToken(userId);
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  client.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;
        await refreshSnapchatToken(account.externalAccountId);
        const refreshed = await getSnapchatAccount(userId);
        if (!refreshed) throw error;
        const newToken = decrypt(refreshed.accessTokenEncrypted);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export async function fetchCampaigns(userId: string) {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/adaccounts/${account.externalAccountId}/campaigns`, {
    params: {
      fields: 'id,name,status,spend,impressions,clicks,ctr,cpm,cpa,roas'
    }
  });

  return normalizeSnapchatResponse<any>(response).map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    spend: Number(campaign.spend ?? 0),
    impressions: Number(campaign.impressions ?? 0),
    clicks: Number(campaign.clicks ?? 0),
    ctr: Number(campaign.ctr ?? 0),
    cpm: Number(campaign.cpm ?? 0),
    cpa: Number(campaign.cpa ?? 0),
    roas: Number(campaign.roas ?? 0)
  }));
}

export async function fetchAdSquads(userId: string, campaignId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/campaigns/${campaignId}/adSquads`, {
    params: {
      fields: 'id,name,status,daily_budget,spend,impressions,clicks'
    }
  });
  return normalizeSnapchatResponse<any>(response);
}

export async function fetchAds(userId: string, adSquadId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/adSquads/${adSquadId}/ads`, {
    params: {
      fields: 'id,name,status,spend,impressions,clicks'
    }
  });
  return normalizeSnapchatResponse<any>(response);
}

export async function getDashboardStats(userId: string) {
  const campaigns = await fetchCampaigns(userId);
  const campaignCount = campaigns.length;
  const activeCampaigns = campaigns.filter(c => ['ACTIVE', 'ENABLED'].includes(c.status?.toString().toUpperCase())).length;
  const pausedCampaigns = campaigns.filter(c => ['PAUSED', 'PAUSE', 'DISABLED'].includes(c.status?.toString().toUpperCase())).length;
  const spend = campaigns.reduce((sum, campaign) => sum + (Number(campaign.spend) || 0), 0);
  const impressions = campaigns.reduce((sum, campaign) => sum + (Number(campaign.impressions) || 0), 0);
  const clicks = campaigns.reduce((sum, campaign) => sum + (Number(campaign.clicks) || 0), 0);
  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
  const cpm = impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(2)) : 0;
  const cpa = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;
  const roasValues = campaigns.filter(c => !isNaN(Number(c.roas))).map(c => Number(c.roas));
  const roas = roasValues.length > 0 ? Number((roasValues.reduce((sum, value) => sum + value, 0) / roasValues.length).toFixed(2)) : 0;

  const squadsSettled = await Promise.allSettled(campaigns.map(campaign => fetchAdSquads(userId, campaign.id)));
  const adSquads = squadsSettled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const adSquadCount = adSquads.length;

  const adsSettled = await Promise.allSettled(adSquads.map((squad: any) => fetchAds(userId, squad.id)));
  const ads = adsSettled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const adCount = ads.length;

  return {
    campaignCount,
    activeCampaigns,
    pausedCampaigns,
    spend,
    impressions,
    clicks,
    ctr,
    cpm,
    cpa,
    roas,
    adSquadCount,
    adCount
  };
}

export async function syncCampaigns(userId: string) {
  const campaigns = await fetchCampaigns(userId);
  if (!Array.isArray(campaigns)) throw new Error('Invalid campaigns payload');
  const updates = await Promise.all(campaigns.map(async (campaign: any) => {
    return prisma.campaign.upsert({
      where: { externalCampaignId_snapchatAccountId: { externalCampaignId: campaign.id, snapchatAccountId: campaign.account_id } },
      create: {
        snapchatAccountId: campaign.account_id,
        externalCampaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
        dailyBudget: campaign.dailyBudget,
        spent: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        ctr: campaign.ctr,
        cpc: campaign.cpm
      },
      update: {
        name: campaign.name,
        status: campaign.status,
        dailyBudget: campaign.dailyBudget,
        spent: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        ctr: campaign.ctr,
        cpc: campaign.cpm
      }
    });
  }));
  return updates;
}

export async function syncAdSquads(userId: string) {
  const campaigns = await fetchCampaigns(userId);
  if (!Array.isArray(campaigns)) throw new Error('Invalid campaigns payload');

  const updates = [];
  for (const campaign of campaigns) {
    const squads = await fetchAdSquads(userId, campaign.id);
    if (!Array.isArray(squads)) continue;
    for (const squad of squads) {
      updates.push(await prisma.adSquad.upsert({
        where: { externalAdSquadId_campaignId: { externalAdSquadId: squad.id, campaignId: campaign.id } },
        create: {
          campaignId: campaign.id,
          externalAdSquadId: squad.id,
          name: squad.name,
          status: squad.status,
          dailyBudget: squad.daily_budget,
          spent: squad.spend || 0,
          impressions: squad.impressions || 0,
          clicks: squad.clicks || 0
        },
        update: {
          name: squad.name,
          status: squad.status,
          dailyBudget: squad.daily_budget,
          spent: squad.spend || 0,
          impressions: squad.impressions || 0,
          clicks: squad.clicks || 0
        }
      }));
    }
  }
  return updates;
}

export async function syncAds(userId: string) {
  const campaigns = await fetchCampaigns(userId);
  if (!Array.isArray(campaigns)) throw new Error('Invalid campaigns payload');

  const updates = [];
  for (const campaign of campaigns) {
    const squads = await fetchAdSquads(userId, campaign.id);
    if (!Array.isArray(squads)) continue;
    for (const squad of squads) {
      const ads = await fetchAds(userId, squad.id);
      if (!Array.isArray(ads)) continue;
      for (const ad of ads) {
        updates.push(await prisma.ad.upsert({
          where: { externalAdId_adSquadId: { externalAdId: ad.id, adSquadId: squad.id } },
          create: {
            campaignId: campaign.id,
            adSquadId: squad.id,
            externalAdId: ad.id,
            name: ad.name,
            status: ad.status,
            spent: ad.spend || 0,
            impressions: ad.impressions || 0,
            clicks: ad.clicks || 0
          },
          update: {
            name: ad.name,
            status: ad.status,
            spent: ad.spend || 0,
            impressions: ad.impressions || 0,
            clicks: ad.clicks || 0
          }
        }));
      }
    }
  }
  return updates;
}
