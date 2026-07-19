import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from '@config/env';
import { generalRateLimiter } from '@shared/middlewares/rate-limit.middleware';
import { errorHandlerMiddleware } from '@shared/middlewares/error-handler.middleware';
import { authRoutes } from '@features/auth/auth.routes';
import { vehiclesRoutes } from '@features/vehicles/vehicles.routes';
import { driversRoutes } from '@features/drivers/drivers.routes';
import { gpsTrackingRoutes } from '@features/gps-tracking/gps-tracking.routes';
import { containersRoutes } from '@features/containers/containers.routes';
import { routesManagementRoutes } from '@features/routes-management/routes.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(generalRateLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/vehicles', vehiclesRoutes);
  app.use('/api/v1/drivers', driversRoutes);
  app.use('/api/v1/tracking', gpsTrackingRoutes);
  app.use('/api/v1/containers', containersRoutes);
  app.use('/api/v1/routes', routesManagementRoutes);

  // 404 handler for unmatched routes
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use(errorHandlerMiddleware);

  return app;
}
