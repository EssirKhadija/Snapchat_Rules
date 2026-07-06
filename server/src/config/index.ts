import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'access_secret';
export const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret';
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const SNAPCHAT_CLIENT_ID = process.env.SNAPCHAT_CLIENT_ID || '';
export const SNAPCHAT_CLIENT_SECRET = process.env.SNAPCHAT_CLIENT_SECRET || '';
export const SNAPCHAT_REDIRECT_URI = process.env.SNAPCHAT_REDIRECT_URI || '';
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'snaprules-encryption-secret';
export const SYNC_CRON_EXPRESSION = process.env.SYNC_CRON_EXPRESSION || '* * * * *';
