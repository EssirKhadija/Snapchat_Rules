export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DRAFT';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective?: string | null;
  dailyBudget?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface AdSquad {
  id: string;
  name: string;
  status: string;
  dailyBudget?: number | null;
  bidAmount?: number | null;
}

export interface CampaignQuery {
  search: string;
  status: CampaignStatus | 'ALL';
  sortBy: 'name' | 'dailyBudget';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface Ad {
  id: string;
  name: string;
  status: string;
  type?: string | null;
}