import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma/client';

jest.mock('../../src/prisma/client');

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyJ9.mock_signature';

describe('Rules API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/rules', () => {
    it('should list user rules', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          userId: 'user-123',
          name: 'High Spend Rule',
          description: 'Pause campaigns with high spend',
          enabled: true,
          priority: 1,
          conditions: [],
          actions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          cooldownMinutes: 0,
          lastExecutedAt: null,
        },
      ];

      (prisma.rule.findMany as jest.Mock).mockResolvedValue(mockRules);

      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRules);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/rules');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/rules', () => {
    it('should create a new rule', async () => {
      const rulePayload = {
        name: 'Test Rule',
        enabled: true,
        conditions: [],
        actions: [],
      };

      const mockCreatedRule = {
        id: 'rule-1',
        userId: 'user-123',
        ...rulePayload,
        priority: 0,
        description: '',
        cooldownMinutes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastExecutedAt: null,
      };

      (prisma.rule.create as jest.Mock).mockResolvedValue(mockCreatedRule);

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(rulePayload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('POST /api/v1/rules/run', () => {
    it('should execute rules', async () => {
      const mockResult = {
        runAt: new Date(),
        rulesEvaluated: 1,
        campaignsEvaluated: 5,
        summaries: [],
      };

      (prisma.rule.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.campaign.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/rules/run')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rulesEvaluated');
    });
  });

  describe('POST /api/v1/rules/simulate', () => {
    it('should simulate rule execution', async () => {
      const mockResult = {
        runAt: new Date(),
        rulesEvaluated: 1,
        campaignsEvaluated: 5,
        summaries: [],
      };

      (prisma.rule.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.campaign.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/rules/simulate')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rulesEvaluated');
    });
  });
});
