import prisma from '../../prisma/client';
import bcrypt from 'bcrypt';

export interface SettingsPayload {
  timezone?: string;
  currency?: string;
  language?: string;
  inAppNotifications?: boolean;
  emailNotifications?: boolean;
  webhookNotifications?: boolean;
  schedulerFrequency?: string;
  appName?: string;
}

export async function getSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
      },
    });
  }
  return settings;
}

export async function updateSettings(userId: string, payload: SettingsPayload) {
  await prisma.userSettings.upsert({
    where: { userId },
    update: payload,
    create: { userId, ...payload },
  });

  return getSettings(userId);
}

export async function updateProfile(userId: string, payload: { fullName?: string; email?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const emailTaken = payload.email && payload.email !== user.email
    ? await prisma.user.findUnique({ where: { email: payload.email } })
    : null;
  if (emailTaken) throw new Error('Email already in use');

  return prisma.user.update({
    where: { id: userId },
    data: {
      fullName: payload.fullName ?? user.fullName,
      email: payload.email ?? user.email,
    },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}
