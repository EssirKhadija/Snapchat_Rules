import axios from 'axios';
import { decrypt } from '../../utils/crypto';
import prisma from '../../prisma/client';
import { getSnapchatAccount } from '../snapchat.service';

const API_BASE = 'https://adsapi.snapchat.com/v1';

export async function getAuthorizedAxios(userId: string) {
  const account = await getSnapchatAccount(userId);
  if (!account) throw new Error('Snapchat account not connected');

  const accessToken = decrypt(account.accessTokenEncrypted);
  return axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export async function fetchCampaigns(userId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get('/adaccounts');
  return response.data;
}

export async function fetchCampaignDetails(userId: string, campaignId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/campaigns/${campaignId}`);
  return response.data;
}

export async function fetchAdSquads(userId: string, campaignId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/campaigns/${campaignId}/adSquads`);
  return response.data;
}

export async function fetchAds(userId: string, adSquadId: string) {
  const client = await getAuthorizedAxios(userId);
  const response = await client.get(`/adSquads/${adSquadId}/ads`);
  return response.data;
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
        dailyBudget: campaign.daily_budget,
        spent: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        ctr: campaign.ctr,
        cpc: campaign.cpc
      },
      update: {
        name: campaign.name,
        status: campaign.status,
        dailyBudget: campaign.daily_budget,
        spent: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        ctr: campaign.ctr,
        cpc: campaign.cpc
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
