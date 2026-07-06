import { Request, Response, NextFunction } from 'express';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  connectSnapchat,
  disconnectSnapchat,
  getSnapchatAccount,
  refreshSnapchatToken
} from '../services/snapchat.service';
import logger from '../utils/logger';

export async function authorize(req: Request, res: Response, next: NextFunction) {
  try {
    const state = req.query.state?.toString() || 'default';
    const url = getAuthorizationUrl(state);
    res.json({ url });
  } catch (error) {
    logger.error('Snapchat authorize error', { error });
    next(error);
  }
}

export async function callback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code?.toString();
    const userId = (req as any).userId;
    if (!code) return res.status(400).json({ message: 'Missing authorization code' });
    const tokens = await exchangeCodeForTokens(code);
    await connectSnapchat(userId, tokens);
    return res.json({ message: 'Snapchat account connected' });
  } catch (error) {
    logger.error('Snapchat callback error', { error });
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await getSnapchatAccount((req as any).userId);
    if (!account) return res.status(404).json({ message: 'Snapchat account not found' });
    const data = await refreshSnapchatToken(account.externalAccountId);
    if (!data) return res.status(400).json({ message: 'Unable to refresh Snapchat token' });
    return res.json(data);
  } catch (error) {
    logger.error('Snapchat refresh error', { error });
    next(error);
  }
}

export async function disconnect(req: Request, res: Response, next: NextFunction) {
  try {
    await disconnectSnapchat((req as any).userId);
    return res.json({ message: 'Disconnected Snapchat account' });
  } catch (error) {
    logger.error('Snapchat disconnect error', { error });
    next(error);
  }
}

export async function details(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await getSnapchatAccount((req as any).userId);
    if (!account) return res.status(404).json({ message: 'Snapchat account not found' });
    return res.json({
      externalAccountId: account.externalAccountId,
      displayName: account.displayName,
      status: account.status,
      tokenExpiresAt: account.tokenExpiresAt
    });
  } catch (error) {
    logger.error('Snapchat details error', { error });
    next(error);
  }
}
