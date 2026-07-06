import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import logger from '../utils/logger';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const tokens = await AuthService.login(email, password);
    if (!tokens) return res.status(401).json({ message: 'Invalid credentials' });
    return res.json(tokens);
  } catch (err) {
    logger.error('Auth login error', { err });
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refresh(refreshToken);
    if (!tokens) return res.status(401).json({ message: 'Invalid refresh token' });
    return res.json(tokens);
  } catch (err) {
    logger.error('Auth refresh error', { err });
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);
    return res.json({ message: 'Logged out' });
  } catch (err) {
    logger.error('Auth logout error', { err });
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName } = req.body;
    const user = await AuthService.createUser(email, password, fullName);
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    logger.error('Auth register error', { err });
    next(err);
  }
}
