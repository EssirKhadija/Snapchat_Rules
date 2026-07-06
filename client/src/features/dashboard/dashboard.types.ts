export interface DashboardOverview {
  campaignCount: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  spend: number;
  ctr: number;
  cpm: number;
  cpa: number;
  roas: number;
}

export interface ExecutionItem {
  id: string;
  ruleName: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING' | 'SKIPPED';
  message: string;
  executedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
