import { Request, Response, NextFunction } from 'express';
import { enqueueSync } from '../queues/sync.queue';
import { syncAllData } from '../services/sync/sync.service';
import logger from '../utils/logger';

export async function triggerSync(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    await enqueueSync(userId);
    res.json({ message: 'Sync queued' });
  } catch (error) {
    logger.error('Sync queue error', { error });
    next(error);
  }
}

export async function syncNow(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const result = await syncAllData(userId);
    res.json(result);
  } catch (error) {
    logger.error('Sync now error', { error });
    next(error);
  }
}
