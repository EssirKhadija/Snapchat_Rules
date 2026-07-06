import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../services/settings/settings.service';
import logger from '../utils/logger';

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getSettings((req as any).userId);
    res.json(settings);
  } catch (error) {
    logger.error('Get settings failed', { error });
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.updateSettings((req as any).userId, req.body);
    res.json(settings);
  } catch (error) {
    logger.error('Update settings failed', { error });
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await settingsService.updateProfile((req as any).userId, req.body);
    res.json(profile);
  } catch (error) {
    logger.error('Update profile failed', { error });
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await settingsService.changePassword((req as any).userId, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  } catch (error) {
    logger.error('Change password failed', { error });
    next(error);
  }
}
