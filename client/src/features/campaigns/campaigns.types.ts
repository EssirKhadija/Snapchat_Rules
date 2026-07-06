export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DRAFT';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  budget: number;
  spend: number;
  ctr: number;
  cpm: number;
  cpa: number;
  roas: number;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface CampaignQuery {
  search: string;
  status: CampaignStatus | 'ALL';
  sortBy: 'name' | 'budget' | 'spend' | 'ctr' | 'roas';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
