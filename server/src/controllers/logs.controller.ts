import { Request, Response, NextFunction } from 'express';
import { getLogs } from '../services/logs/logs.service';
import logger from '../utils/logger';

export async function listLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = {
      search: req.query.search as string | undefined,
      matched: req.query.matched === 'true' ? true : req.query.matched === 'false' ? false : undefined,
      simulated: req.query.simulated === 'true' ? true : req.query.simulated === 'false' ? false : undefined,
      ruleId: req.query.ruleId as string | undefined,
      targetId: req.query.targetId as string | undefined,
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 20),
    };

    const result = await getLogs((req as any).userId, query);
    res.json(result);
  } catch (error) {
    logger.error('List logs failed', { error });
    next(error);
  }
}
