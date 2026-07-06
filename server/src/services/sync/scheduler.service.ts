import cron from 'node-cron';
import { SYNC_CRON_EXPRESSION } from '../../config';
import { enqueueSync } from '../../queues/sync.queue';
import logger from '../../utils/logger';

export function startSyncScheduler(userId: string) {
  logger.info('Starting scheduler', { expression: SYNC_CRON_EXPRESSION });

  return cron.schedule(
    SYNC_CRON_EXPRESSION,
    async () => {
      logger.info('Cron triggered sync enqueue', { userId });
      try {
        await enqueueSync(userId);
        logger.info('Scheduled sync job enqueued', { userId });
      } catch (error) {
        logger.error('Scheduled sync enqueue failed', { error, userId });
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    },
  );
}
