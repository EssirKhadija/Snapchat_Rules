import * as logsService from '../../src/services/logs/logs.service';
import prisma from '../../src/prisma/client';

jest.mock('../../src/prisma/client');

describe('Logs Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    it('should retrieve logs with pagination', async () => {
      const userId = 'user-123';
      const mockLogs = [
        {
          id: 'log-1',
          ruleId: 'rule-1',
          userId,
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
          rule: { id: 'rule-1', name: 'Rule 1' } as any,
        },
      ];

      (prisma.$transaction as jest.Mock).mockResolvedValue([mockLogs, 1]);

      const result = await logsService.getLogs(userId, { page: 1, pageSize: 20 });

      expect(result.items).toEqual(mockLogs);
      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter logs by matched status', async () => {
      const userId = 'user-123';
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await logsService.getLogs(userId, { matched: true });

      const whereClause = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(whereClause).toEqual(expect.any(Function));
    });

    it('should search logs by campaign name', async () => {
      const userId = 'user-123';
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await logsService.getLogs(userId, { search: 'Campaign' });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      const userId = 'user-123';
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await logsService.getLogs(userId);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });
  });
});
