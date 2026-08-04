import { Request, Response, NextFunction } from 'express';
import { fetchCampaigns, fetchAdSquads, fetchAds, fetchCampaignsWithStats, fetchAdSquadsWithStats, getDashboardStats } from '../services/sync/snapchat-ads.service';
import multer from 'multer';
import { bulkLaunchCampaign } from '../services/sync/bulk-launch.service';

const upload = multer({ storage: multer.memoryStorage() });

export async function bulkLaunch(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    let template, row;

    // Multipart (avec fichier) ou JSON (avec URL)
    if (req.file) {
      template = JSON.parse(req.body.template);
      row = JSON.parse(req.body.row);
    } else {
      template = req.body.template;
      row = req.body.row;
    }

    const result = await bulkLaunchCampaign(userId, template, row, req.file?.buffer);
    return res.json(result);
  } catch (error: any) {
    console.error('Bulk launch error:', error.response?.data ?? error.message);
    next(error);
  }
}
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
    const startDate = req.query.startDate?.toString();
    const endDate = req.query.endDate?.toString();

    // Utilise fetchCampaignsWithStats pour avoir les métriques
    const campaigns = await fetchCampaignsWithStats(userId, startDate, endDate);
    let filtered = Array.isArray(campaigns) ? campaigns : [];

    if (q) filtered = filtered.filter((c: any) => c.name?.toLowerCase().includes(q.toLowerCase()));
    if (status) filtered = filtered.filter((c: any) => c.status === status);

    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);
    return res.json({ data, total });
  } catch (error) {
    next(error);
  }
}


export async function listAdSquads(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const { campaignId } = req.params;
    const startDate = req.query.startDate?.toString();
    const endDate = req.query.endDate?.toString();
    const squads = await fetchAdSquadsWithStats(userId, campaignId, startDate, endDate);
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