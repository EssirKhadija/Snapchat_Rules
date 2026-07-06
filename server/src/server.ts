import app from './app';
import { PORT } from './config';
import logger from './utils/logger';
import prisma from './prisma/client';
import { startSyncScheduler } from './services/sync/scheduler.service';

const port = PORT || 4000;

async function bootstrap() {
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });

  /*const user = await prisma.user.findFirst();
  if (user) {
    startSyncScheduler(user.id);
    logger.info('Sync scheduler started for default user', { userId: user.id });
  } else {
    logger.warn('No user found; sync scheduler not started');
  }*/
}

bootstrap().catch(err => {
  logger.error('Server bootstrap error', { err });
  process.exit(1);
});
