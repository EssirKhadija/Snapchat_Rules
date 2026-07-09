import { Router } from 'express';
import { listCampaigns, stats } from '../controllers/campaigns.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, listCampaigns);
router.get('/stats', authenticate, stats);

export default router;
