import { Router } from 'express';
import * as RulesController from '../controllers/rules.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { createRuleValidator } from '../validators/rules.validator';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();

router.get('/', authenticate, RulesController.listRules);
router.post('/', authenticate, createRuleValidator, validateRequest, RulesController.createRule);
router.post('/run', authenticate, RulesController.runRules);
router.post('/simulate', authenticate, RulesController.simulateRules);
router.get('/logs', authenticate, RulesController.listRuleLogs);

export default router;
