import prisma from '../prisma/client';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { REFRESH_TOKEN_EXPIRES_IN } from '../config';
import ms from 'ms';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<Tokens | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return null;

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id });

  // Persist refresh token
  const expiresMs = ms(REFRESH_TOKEN_EXPIRES_IN || '7d');
  const expiresAt = new Date(Date.now() + expiresMs);

  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  return { accessToken, refreshToken };
}

export async function refresh(oldRefreshToken: string): Promise<Tokens | null> {
  try {
    const payload = verifyRefreshToken<{ userId: string }>(oldRefreshToken);
    const db = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
    if (!db || db.revoked) return null;
    if (db.expiresAt && db.expiresAt < new Date()) return null;

    // create new tokens
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id });

    const expiresMs = ms(REFRESH_TOKEN_EXPIRES_IN || '7d');
    const expiresAt = new Date(Date.now() + expiresMs);

    // revoke old and store new
    await prisma.refreshToken.update({ where: { id: db.id }, data: { revoked: true } });
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    return { accessToken, refreshToken };
  } catch (e) {
    return null;
  }
}

export async function logout(refreshToken: string) {
  // revoke refresh token if present
  await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
}

export async function createUser(email: string, password: string, fullName?: string) {
  const hashed = await hashPassword(password);
  return prisma.user.create({ data: { email, passwordHash: hashed, fullName } });
}
