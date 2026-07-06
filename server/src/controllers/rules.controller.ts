import { Request, Response, NextFunction } from 'express';
import * as rulesService from '../services/rules/rules.service';
import logger from '../utils/logger';

export async function listRules(req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await rulesService.getRules((req as any).userId);
    res.json(rules);
  } catch (error) {
    logger.error('List rules failed', { error });
    next(error);
  }
}

export async function createRule(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body;
    const rule = await rulesService.createRule((req as any).userId, payload);
    res.status(201).json(rule);
  } catch (error) {
    logger.error('Create rule failed', { error });
    next(error);
  }
}

export async function runRules(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await rulesService.executeRules((req as any).userId);
    res.json(result);
  } catch (error) {
    logger.error('Run rules failed', { error });
    next(error);
  }
}

export async function simulateRules(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await rulesService.simulateRules((req as any).userId);
    res.json(result);
  } catch (error) {
    logger.error('Simulate rules failed', { error });
    next(error);
  }
}

export async function listRuleLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.query.limit ?? 50);
    const logs = await rulesService.getRuleLogs((req as any).userId, limit);
    res.json(logs);
  } catch (error) {
    logger.error('List rule logs failed', { error });
    next(error);
  }
}
