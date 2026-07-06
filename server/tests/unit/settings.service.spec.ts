import * as settingsService from '../../src/services/settings/settings.service';
import prisma from '../../src/prisma/client';
import bcrypt from 'bcrypt';

jest.mock('../../src/prisma/client');
jest.mock('bcrypt');

describe('Settings Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should retrieve existing settings', async () => {
      const userId = 'user-123';
      const mockSettings = {
        id: 'settings-1',
        userId,
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en',
        inAppNotifications: true,
        emailNotifications: true,
        webhookNotifications: false,
        schedulerFrequency: '* * * * *',
        appName: 'SnapRules',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);

      const result = await settingsService.getSettings(userId);

      expect(result).toEqual(mockSettings);
      expect(prisma.userSettings.findUnique).toHaveBeenCalledWith({ where: { userId } });
    });

    it('should create default settings if not found', async () => {
      const userId = 'user-123';
      const defaultSettings = {
        id: 'settings-1',
        userId,
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        inAppNotifications: true,
        emailNotifications: true,
        webhookNotifications: false,
        schedulerFrequency: '* * * * *',
        appName: 'SnapRules',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userSettings.create as jest.Mock).mockResolvedValue(defaultSettings);

      const result = await settingsService.getSettings(userId);

      expect(result).toEqual(defaultSettings);
      expect(prisma.userSettings.create).toHaveBeenCalledWith({ data: { userId } });
    });
  });

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      const userId = 'user-123';
      const payload = { timezone: 'Europe/London', currency: 'GBP' };
      const updatedSettings = {
        id: 'settings-1',
        userId,
        timezone: 'Europe/London',
        currency: 'GBP',
        language: 'en',
        inAppNotifications: true,
        emailNotifications: true,
        webhookNotifications: false,
        schedulerFrequency: '* * * * *',
        appName: 'SnapRules',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.userSettings.upsert as jest.Mock).mockResolvedValue(updatedSettings);
      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(updatedSettings);

      const result = await settingsService.updateSettings(userId, payload);

      expect(result.timezone).toBe('Europe/London');
      expect(result.currency).toBe('GBP');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-123';
      const currentPassword = 'oldPassword123';
      const newPassword = 'newPassword123';
      const currentHash = 'hashed_old_password';
      const newHash = 'hashed_new_password';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: currentHash,
        fullName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHash);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: newHash,
      });

      const result = await settingsService.changePassword(userId, currentPassword, newPassword);

      expect(result.success).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, currentHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
    });

    it('should throw error on incorrect current password', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        settingsService.changePassword(userId, 'wrongPassword', 'newPassword123'),
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
