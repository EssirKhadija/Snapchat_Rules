import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma/client';

jest.mock('../../src/prisma/client');

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyJ9.mock_signature';

describe('Logs API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/logs', () => {
    it('should retrieve execution logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          ruleId: 'rule-1',
          userId: 'user-123',
          targetType: 'campaign',
          targetId: 'campaign-1',
          targetName: 'Campaign 1',
          matched: true,
          simulated: false,
          durationMs: 150,
          executedAt: new Date(),
          createdAt: new Date(),
          actions: [],
          result: {},
          rule: { id: 'rule-1', name: 'Rule 1' },
        },
      ];

      (prisma.$transaction as jest.Mock).mockResolvedValue([mockLogs, 1]);

      const response = await request(app)
        .get('/api/v1/logs?page=1&pageSize=20')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('total', 1);
    });

    it('should filter logs by matched status', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const response = await request(app)
        .get('/api/v1/logs?matched=true')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
    });

    it('should search logs by campaign name', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const response = await request(app)
        .get('/api/v1/logs?search=Campaign')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/logs');

      expect(response.status).toBe(401);
    });
  });
});
