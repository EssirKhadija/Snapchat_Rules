import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { loginValidator, refreshValidator, registerValidator } from '../validators/auth.validator';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', registerValidator, validateRequest, AuthController.register);
router.post('/login', loginValidator, validateRequest, AuthController.login);
router.post('/refresh', refreshValidator, validateRequest, AuthController.refresh);
router.post('/logout', refreshValidator, validateRequest, AuthController.logout);

// example protected route
router.get('/me', authenticate, (req, res) => {
  // user attached by middleware
  return res.json({ userId: (req as any).userId });
});

export default router;
