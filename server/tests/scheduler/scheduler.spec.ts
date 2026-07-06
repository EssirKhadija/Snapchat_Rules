import cron from 'node-cron';
import { startSyncScheduler } from '../../src/services/sync/scheduler.service';
import * as syncQueue from '../../src/queues/sync.queue';
import logger from '../../src/utils/logger';

jest.mock('node-cron');
jest.mock('../../src/queues/sync.queue');
jest.mock('../../src/utils/logger');

describe('Scheduler Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startSyncScheduler', () => {
    it('should initialize cron scheduler with correct expression', () => {
      const mockSchedule = jest.fn();
      (cron.schedule as jest.Mock).mockReturnValue(mockSchedule);

      const userId = 'user-123';
      startSyncScheduler(userId);

      expect(cron.schedule).toHaveBeenCalledWith(
        '* * * * *',
        expect.any(Function),
        expect.objectContaining({ scheduled: true, timezone: 'UTC' }),
      );
    });

    it('should enqueue sync job on cron trigger', async () => {
      const mockSchedule = jest.fn();
      let cronCallback: any = null;

      (cron.schedule as jest.Mock).mockImplementation((expr, callback) => {
        cronCallback = callback;
        return mockSchedule;
      });

      const userId = 'user-123';
      startSyncScheduler(userId);

      if (cronCallback) {
        await cronCallback();
      }

      expect(syncQueue.enqueueSync).toHaveBeenCalledWith(userId);
    });

    it('should log scheduler start', () => {
      const mockSchedule = jest.fn();
      (cron.schedule as jest.Mock).mockReturnValue(mockSchedule);

      const userId = 'user-123';
      startSyncScheduler(userId);

      expect(logger.info).toHaveBeenCalledWith('Starting scheduler', expect.any(Object));
    });

    it('should handle enqueue errors gracefully', async () => {
      const mockSchedule = jest.fn();
      let cronCallback: any = null;

      (cron.schedule as jest.Mock).mockImplementation((expr, callback) => {
        cronCallback = callback;
        return mockSchedule;
      });

      (syncQueue.enqueueSync as jest.Mock).mockRejectedValue(new Error('Enqueue failed'));

      const userId = 'user-123';
      startSyncScheduler(userId);

      if (cronCallback) {
        await cronCallback();
      }

      expect(logger.error).toHaveBeenCalledWith('Scheduled sync enqueue failed', expect.any(Object));
    });
  });

  describe('Scheduler frequency variations', () => {
    it('should support every minute execution', () => {
      (cron.schedule as jest.Mock).mockReturnValue(jest.fn());

      startSyncScheduler('user-123');

      expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function), expect.any(Object));
    });

    it('should support every 5 minutes execution', () => {
      process.env.SYNC_CRON_EXPRESSION = '*/5 * * * *';
      (cron.schedule as jest.Mock).mockReturnValue(jest.fn());

      startSyncScheduler('user-123');

      expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function), expect.any(Object));
    });

    it('should support hourly execution', () => {
      process.env.SYNC_CRON_EXPRESSION = '0 * * * *';
      (cron.schedule as jest.Mock).mockReturnValue(jest.fn());

      startSyncScheduler('user-123');

      expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function), expect.any(Object));
    });
  });
});
