import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma/client';
import bcrypt from 'bcrypt';

jest.mock('../../src/prisma/client');
jest.mock('bcrypt');

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyJ9.mock_signature';

describe('Settings API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/settings', () => {
    it('should retrieve user settings', async () => {
      const mockSettings = {
        id: 'settings-1',
        userId: 'user-123',
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

      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timezone', 'UTC');
    });
  });

  describe('PUT /api/v1/settings', () => {
    it('should update user settings', async () => {
      const updatedSettings = {
        id: 'settings-1',
        userId: 'user-123',
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

      (prisma.userSettings.upsert as jest.Mock).mockResolvedValue(updatedSettings);
      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ timezone: 'America/New_York' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timezone', 'America/New_York');
    });
  });

  describe('PUT /api/v1/settings/profile', () => {
    it('should update user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newemail@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/v1/settings/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ fullName: 'Updated Name' });

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/v1/settings/password', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_old_password',
        fullName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed_new_password',
      });

      const response = await request(app)
        .put('/api/v1/settings/password')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 401 for incorrect current password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .put('/api/v1/settings/password')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
