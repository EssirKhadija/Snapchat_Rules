import api from '../../shared/lib/api';

export interface DashboardStatsResponse {
  campaignCount: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpa: number;
  roas: number;
}

export interface SnapchatAccountResponse {
  externalAccountId: string;
  displayName: string;
  status: string;
  tokenExpiresAt: string | null;
}

export async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await api.get('/campaigns/stats');
  return response.data;
}

export async function fetchSnapchatAccount(): Promise<SnapchatAccountResponse> {
  const response = await api.get('/snapchat/me');
  return response.data;
}

export async function getSnapchatAuthorizeUrl(): Promise<string> {
  const response = await api.get('/snapchat/authorize');
  const url = response.data?.url;
  if (!url) {
    throw new Error('Missing authorization URL from server');
  }
  return url;
}

