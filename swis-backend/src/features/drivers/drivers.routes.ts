import { Router } from 'express';
import { driversController } from './drivers.controller';
import { authMiddleware } from '@shared/middlewares/auth.middleware';
import { requirePermission } from '@shared/middlewares/rbac.middleware';
import { validateRequest } from '@shared/middlewares/validate-request.middleware';
import { asyncHandler } from '@shared/utils/async-handler';
import {
  createDriverSchema,
  createViolationSchema,
  idParamSchema,
  listDriversQuerySchema,
  updateDriverSchema,
} from './drivers.dto';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission('drivers.read'),
  validateRequest({ query: listDriversQuerySchema }),
  asyncHandler(driversController.list),
);

router.get(
  '/:id',
  requirePermission('drivers.read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(driversController.getById),
);

router.post(
  '/',
  requirePermission('drivers.create'),
  validateRequest({ body: createDriverSchema }),
  asyncHandler(driversController.create),
);

router.patch(
  '/:id',
  requirePermission('drivers.update'),
  validateRequest({ params: idParamSchema, body: updateDriverSchema }),
  asyncHandler(driversController.update),
);

router.delete(
  '/:id',
  requirePermission('drivers.delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(driversController.remove),
);

router.get(
  '/:id/violations',
  requirePermission('drivers.read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(driversController.listViolations),
);

router.post(
  '/:id/violations',
  requirePermission('drivers.update'),
  validateRequest({ params: idParamSchema, body: createViolationSchema }),
  asyncHandler(driversController.addViolation),
);

export { router as driversRoutes };
