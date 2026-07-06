import { Router } from 'express';
import { triggerSync, syncNow } from '../controllers/sync.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/queue', authenticate, triggerSync);
router.post('/now', authenticate, syncNow);

export default router;
