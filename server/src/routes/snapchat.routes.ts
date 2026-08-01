import { Router } from 'express';
import * as SnapchatController from '../controllers/snapchat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /snapchat/authorize:
 *   get:
 *     summary: Get Snapchat authorization URL
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorization URL
 */
router.get('/authorize', authenticate, SnapchatController.authorize);
/**
 * @openapi
 * /snapchat/callback:
 *   get:
 *     summary: Handle Snapchat OAuth callback
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Snapchat account connected
 */
router.get('/callback', SnapchatController.callback);
/**
 * @openapi
 * /snapchat/refresh:
 *   post:
 *     summary: Refresh Snapchat access token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Snapchat token refreshed
 */
router.post('/refresh', authenticate, SnapchatController.refresh);

/**
 * @openapi
 * /snapchat/pending:
 *   get:
 *     summary: Get pending Snapchat Ad Accounts for selection
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending Snapchat Ad Accounts
 */
router.get('/pending', authenticate, SnapchatController.pending);

/**
 * @openapi
 * /snapchat/select:
 *   post:
 *     summary: Select the Snapchat Ad Account to connect
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adAccountId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Snapchat account connected
 */
router.post('/select', authenticate, SnapchatController.select);

/**
 * @openapi
 * /snapchat/disconnect:
 *   post:
 *     summary: Disconnect Snapchat account from SnapRules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Snapchat account disconnected
 */
router.post('/disconnect', authenticate, SnapchatController.disconnect);
router.delete('/disconnect', authenticate, SnapchatController.disconnect);
/**
 * /snapchat/me:
 *   get:
 *     summary: Get connected Snapchat account details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Snapchat account details
 */
router.get('/me', authenticate, SnapchatController.details);

export default router;
