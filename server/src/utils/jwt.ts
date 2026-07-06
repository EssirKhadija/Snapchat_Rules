import jwt from 'jsonwebtoken';
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
} from '../config';

export function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, JWT_REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken<T = any>(token: string) {
  return jwt.verify(token, JWT_ACCESS_TOKEN_SECRET) as T;
}

export function verifyRefreshToken<T = any>(token: string) {
  return jwt.verify(token, JWT_REFRESH_TOKEN_SECRET) as T;
}
