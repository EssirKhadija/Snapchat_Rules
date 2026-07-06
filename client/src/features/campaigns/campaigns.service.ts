import api from '../../shared/lib/api';
import { Campaign, CampaignQuery } from './campaigns.types';

export interface CampaignListResponse {
  data: Campaign[];
  total: number;
}

export async function fetchCampaigns(query: CampaignQuery): Promise<CampaignListResponse> {
  const params = {
    q: query.search,
    status: query.status !== 'ALL' ? query.status : undefined,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    page: query.page,
    pageSize: query.pageSize
  };

  const response = await api.get('/campaigns', { params });
  return response.data;
}

export async function fetchCampaignDetails(id: string): Promise<Campaign> {
  const response = await api.get(`/campaigns/${id}`);
  return response.data;
}
