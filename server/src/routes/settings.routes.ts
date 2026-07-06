import { Router } from 'express';
import { changePassword, getSettings, updateProfile, updateSettings } from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);

export default router;
