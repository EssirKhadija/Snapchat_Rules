import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import { createClient } from 'redis';
import { REDIS_URL } from '../config';
import { syncAllData } from '../services/sync/sync.service';
import logger from '../utils/logger';

const connection = createClient({ url: REDIS_URL });
const queueName = 'snapchat-sync';

export const syncQueue = new Queue(queueName, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
new QueueScheduler(queueName, { connection });

const worker = new Worker(
  queueName,
  async (job: Job) => {
    const userId = job.data.userId as string;
    logger.info('Processing sync workflow job', { jobId: job.id, userId, attemptsMade: job.attemptsMade });
    return syncAllData(userId);
  },
  {
    connection,
    lockDuration: 120000,
    concurrency: 1,
  },
);

worker.on('completed', job => {
  logger.info('Sync workflow job completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('Sync workflow job failed', {
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    failedReason: err?.message,
    stack: err?.stack,
  });
});

export async function enqueueSync(userId: string) {
  await syncQueue.add('syncAll', { userId }, { removeOnComplete: true, removeOnFail: false });
}
