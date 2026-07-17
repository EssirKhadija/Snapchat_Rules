import api from '../../shared/lib/api';
import { Campaign, AdSquad, CampaignQuery } from './campaigns.types';

export interface CampaignListResponse {
  data: Campaign[];
  total: number;
}

export async function fetchCampaigns(query: CampaignQuery): Promise<CampaignListResponse> {
  const params = {
    q: query.search || undefined,
    status: query.status !== 'ALL' ? query.status : undefined,
    page: query.page,
    pageSize: query.pageSize,
  };
  const response = await api.get('/campaigns', { params });
  return response.data;
}

export async function fetchAdSquads(campaignId: string): Promise<AdSquad[]> {
  // Appel backend qui appelle Snapchat API
  const response = await api.get(`/campaigns/${campaignId}/adsquads`);
  return response.data?.data ?? response.data ?? [];
}
export interface Ad {
  id: string;
  name: string;
  status: string;
  type?: string | null;
}

export async function fetchAds(adSquadId: string): Promise<Ad[]> {
  const response = await api.get(`/campaigns/adsquads/${adSquadId}/ads`);
  return response.data?.data ?? response.data ?? [];
}