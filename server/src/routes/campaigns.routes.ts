import { Router } from 'express';
import multer from 'multer';
import { listCampaigns, stats, listAdSquads, listAds, bulkLaunch } from '../controllers/campaigns.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, listCampaigns);
router.get('/stats', authenticate, stats);
router.get('/:campaignId/adsquads', authenticate, listAdSquads);
router.get('/adsquads/:adSquadId/ads', authenticate, listAds);
router.post('/bulk-launch', authenticate, upload.single('file'), bulkLaunch);

export default router;