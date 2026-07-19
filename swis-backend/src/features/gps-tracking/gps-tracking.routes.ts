import { Router } from 'express';
import { gpsTrackingController } from './gps-tracking.controller';
import { authMiddleware } from '@shared/middlewares/auth.middleware';
import { requirePermission } from '@shared/middlewares/rbac.middleware';
import { asyncHandler } from '@shared/utils/async-handler';

const router = Router();

router.use(authMiddleware);

router.get('/live', requirePermission('vehicles.read'), asyncHandler(gpsTrackingController.getLive));

export { router as gpsTrackingRoutes };
