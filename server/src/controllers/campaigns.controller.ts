import { Request, Response, NextFunction } from 'express';
import { fetchCampaigns, getDashboardStats } from '../services/sync/snapchat-ads.service';

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
      filtered = filtered.filter((c: any) => (c.name || '').toString().toLowerCase().includes(ql));
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

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const data = await getDashboardStats(userId);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}
