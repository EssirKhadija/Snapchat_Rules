import { Request, Response, NextFunction } from 'express';
import { fetchCampaigns, fetchAdSquads, fetchAds, getDashboardStats } from '../services/sync/snapchat-ads.service';

export async function listAds(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const { adSquadId } = req.params;
    const ads = await fetchAds(userId, adSquadId);
    return res.json({ data: ads, total: ads.length });
  } catch (error) {
    next(error);
  }
}

export async function listCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const q = req.query.q?.toString() || '';
    const status = req.query.status?.toString();
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);

    const campaigns = await fetchCampaigns(userId);
    let filtered = Array.isArray(campaigns) ? campaigns : [];

    if (q) {
      const ql = q.toLowerCase();
      filtered = filtered.filter((c: any) => (c.name || '').toLowerCase().includes(ql));
    }
    if (status) {
      filtered = filtered.filter((c: any) => c.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return res.json({ data, total });
  } catch (error) {
    next(error);
  }
}

export async function listAdSquads(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const { campaignId } = req.params;
    const squads = await fetchAdSquads(userId, campaignId);
    return res.json({ data: squads, total: squads.length });
  } catch (error) {
    next(error);
  }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const startDate = req.query.startDate?.toString();
    const endDate = req.query.endDate?.toString();
    const campaignId = req.query.campaignId?.toString();
    const data = await getDashboardStats(userId, startDate, endDate, campaignId);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}