import http from 'http';
import { createApp } from './app';
import { env } from '@config/env';
import { prisma } from '@config/database';
import { logger } from '@shared/utils/logger';
import { initSocketServer } from '@config/socket';
import { gpsSimulatorService } from '@features/gps-tracking/gps-simulator.service';

const app = createApp();
const httpServer = http.createServer(app);

initSocketServer(httpServer);

const server = httpServer.listen(env.PORT, () => {
  logger.info(`SWIS backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  gpsSimulatorService.start();
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  gpsSimulatorService.stop();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
