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

export async function fetchDashboardStats(
  startDate: string,
  endDate: string,
  campaignId?: string
): Promise<DashboardStatsResponse> {
  const response = await api.get('/campaigns/stats', {
    params: { startDate, endDate, campaignId: campaignId || undefined }
  });
  return response.data;
}

export async function fetchSnapchatAccount(): Promise<SnapchatAccountResponse> {
  const response = await api.get('/snapchat/me');
  return response.data;
}

export async function getSnapchatAuthorizeUrl(): Promise<string> {
  const response = await api.get('/snapchat/authorize');
  const url = response.data?.url;
  if (!url) throw new Error('Missing authorization URL from server');
  return url;
}

export async function fetchSnapchatPendingAccounts(): Promise<Array<{ id: string; name: string; organizationId: string; currency: string; timezone: string;}>> {
  try {
    const response = await api.get('/snapchat/pending');
    return response.data?.accounts ?? [];
  } catch (error: any) {
    if (error?.message?.includes('No pending Snapchat connection found') || error?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function selectSnapchatAccount(payload: { adAccountId: string; organizationId: string; displayName: string; }): Promise<void> {
  await api.post('/snapchat/select', payload);
}

export async function disconnectSnapchatAccount(): Promise<void> {
  await api.delete('/snapchat/disconnect');
}