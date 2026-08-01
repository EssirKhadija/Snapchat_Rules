import { Request, Response, NextFunction } from 'express';
import {
  getAuthorizationUrl,
  disconnectSnapchat,
  getSnapchatAccount,
  getValidAccessToken,
  getPendingSnapchatAccounts,
  selectAdAccount,
  clearPendingSnapchatState,
  exchangeAndGetAdAccounts,
} from '../services/snapchat.service';
import { FRONTEND_URL } from '../config';
import logger from '../utils/logger';

// GET /api/v1/snapchat/authorize
// Génère l'URL d'autorisation Snapchat et la retourne au frontend.
// Le userId est passé en "state" pour être récupéré dans le callback.
export async function authorize(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId — make sure you are authenticated' });
    }
    const url = getAuthorizationUrl(userId);
    return res.json({ url });
  } catch (error) {
    logger.error('Snapchat authorize error', { error });
    next(error);
  }
}

// GET /api/v1/snapchat/callback
// Reçoit le code OAuth de Snapchat et le userId (passé en state).
// Appelle directement connectSnapchat qui gère tout en interne :
//   exchangeCodeForTokens → fetchOrganization → fetchAdAccount → Prisma upsert
export async function callback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code?.toString();
    const userId = req.query.state?.toString();
    const error = req.query.error?.toString();

    // Snapchat peut renvoyer une erreur explicite dans la query string
    if (error) {
      logger.error('Snapchat OAuth error returned in callback', { error });
      return res.status(400).json({ message: `Snapchat OAuth error: ${error}` });
    }

    if (!userId) {
      return res.status(400).json({ message: 'Missing state (userId) in callback' });
    }
    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code in callback' });
    }

    const { adAccounts } = await exchangeAndGetAdAccounts(userId, code);
    if (adAccounts.length === 0) {
      return res.status(400).json({ message: 'No Ad Account found' });
    }

    if (adAccounts.length === 1) {
      const first = adAccounts[0];
      await selectAdAccount(userId, first.id, first.organizationId, first.name);
      return res.redirect(`${FRONTEND_URL}/dashboard/accounts`);
    }

    return res.redirect(`${FRONTEND_URL}/dashboard/accounts`);
  } catch (error: any) {
    // Log détaillé pour débugger les erreurs Snapchat API
    logger.error('Snapchat callback error', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    next(error);
  }
}

// POST /api/v1/snapchat/select
// Sélectionne l'Ad Account choisi par l'utilisateur après une connexion OAuth réussie.
export async function select(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const { adAccountId, organizationId, displayName } = req.body;
    if (!adAccountId || !organizationId || !displayName) {
      return res.status(400).json({ message: 'Missing adAccountId, organizationId, or displayName' });
    }

    await selectAdAccount(userId, adAccountId, organizationId, displayName);
    return res.json({ message: 'Snapchat account connected successfully' });
  } catch (error) {
    logger.error('Snapchat select error', { error });
    next(error);
  }
}

// GET /api/v1/snapchat/me
// Retourne les infos du compte Snapchat connecté pour l'utilisateur courant.
export async function details(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await getSnapchatAccount((req as any).userId);
    if (!account) {
      return res.status(404).json({ message: 'No Snapchat account connected' });
    }
    return res.json({
      externalAccountId: account.externalAccountId,
      organizationId: account.organizationId,
      displayName: account.displayName,
      status: account.status,
      tokenExpiresAt: account.tokenExpiresAt,
    });
  } catch (error) {
    logger.error('Snapchat details error', { error });
    next(error);
  }
}

// GET /api/v1/snapchat/pending
// Retourne les Ad Accounts trouvés pendant la phase OAuth avant sélection.
export async function pending(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const accounts = await getPendingSnapchatAccounts(userId);
    if (!accounts) {
      return res.status(404).json({ message: 'No pending Snapchat connection found' });
    }
    return res.json({ accounts });
  } catch (error) {
    logger.error('Snapchat pending error', { error });
    next(error);
  }
}

// POST /api/v1/snapchat/refresh
// Force un refresh du token Snapchat pour l'utilisateur courant.
// En temps normal, getValidAccessToken() dans le service le fait automatiquement.
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const account = await getSnapchatAccount(userId);
    if (!account) {
      return res.status(404).json({ message: 'No Snapchat account connected' });
    }
    // getValidAccessToken rafraîchit le token si nécessaire et retourne un token valide
    const accessToken = await getValidAccessToken(userId);
    return res.json({ message: 'Token refreshed', valid: !!accessToken });
  } catch (error) {
    logger.error('Snapchat refresh error', { error });
    next(error);
  }
}

// DELETE /api/v1/snapchat/disconnect
// Supprime le compte Snapchat lié à l'utilisateur courant.
export async function disconnect(req: Request, res: Response, next: NextFunction) {
  try {
    await disconnectSnapchat((req as any).userId);
    return res.json({ message: 'Snapchat account disconnected' });
  } catch (error) {
    logger.error('Snapchat disconnect error', { error });
    next(error);
  }
}