import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import snapchatRoutes from './routes/snapchat.routes';
import syncRoutes from './routes/sync.routes';
import campaignsRoutes from './routes/campaigns.routes';
import rulesRoutes from './routes/rules.routes';
import logsRoutes from './routes/logs.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middlewares/error.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/snapchat', snapchatRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/campaigns', campaignsRoutes);
app.use('/api/v1/rules', rulesRoutes);
app.use('/api/v1/logs', logsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;
