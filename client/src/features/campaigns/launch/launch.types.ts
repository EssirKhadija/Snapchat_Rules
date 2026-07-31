export interface CampaignTemplate {
  id: string;
  name: string;
  objectiveV2Type: 'AWARENESS_AND_ENGAGEMENT' | 'SALES' | 'TRAFFIC' | 'APP_PROMOTION' | 'LEADS';
  optimizationGoal: string;
  bidStrategy: 'AUTO_BID' | 'LOWEST_COST_WITH_MAX_BID';
  bidAmount?: number;
  countries: string[];
  ageMin: number;
  ageMax: number;
  gender: 'ALL' | 'MALE' | 'FEMALE';
  placement: 'AUTOMATIC' | 'SNAP_ADS' | 'STORIES';
  pixelId?: string;
  callToAction: string;
  brandName: string;
  destinationUrl: string;
  createdAt: string;
}

export interface BulkRow {
  id: string;
  campaignName: string;
  adSquadName: string;
  adName: string;
  budget: string;
  startDate: string;
  endDate: string;
  headline: string;
  // Creative — URL ou fichier (un des deux)
  creativeUrl: string;
  creativeFile?: File | null;
  creativePreview?: string; // base64 preview local
  status: 'idle' | 'launching' | 'success' | 'error';
  error?: string;
}

export interface LaunchResult {
  rowId: string;
  success: boolean;
  campaignId?: string;
  error?: string;
}