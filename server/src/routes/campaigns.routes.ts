import { Router } from 'express';
import { listCampaigns, stats, listAdSquads, listAds } from '../controllers/campaigns.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', authenticate, listCampaigns);
router.get('/stats', authenticate, stats);
router.get('/:campaignId/adsquads', authenticate, listAdSquads);
router.get('/adsquads/:adSquadId/ads', authenticate, listAds);

export default router;