import { Router } from 'express';
import { listLogs } from '../controllers/logs.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, listLogs);

export default router;
