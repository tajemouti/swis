import { Router } from 'express';
import { vehiclesController } from './vehicles.controller';
import { authMiddleware } from '@shared/middlewares/auth.middleware';
import { requirePermission } from '@shared/middlewares/rbac.middleware';
import { validateRequest } from '@shared/middlewares/validate-request.middleware';
import { asyncHandler } from '@shared/utils/async-handler';
import {
  createVehicleSchema,
  createVehicleTypeSchema,
  idParamSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
} from './vehicles.dto';

const router = Router();

router.use(authMiddleware);

router.get(
  '/vehicle-types',
  requirePermission('vehicles.read'),
  asyncHandler(vehiclesController.listTypes),
);

router.post(
  '/vehicle-types',
  requirePermission('vehicles.create'),
  validateRequest({ body: createVehicleTypeSchema }),
  asyncHandler(vehiclesController.createType),
);

router.get(
  '/',
  requirePermission('vehicles.read'),
  validateRequest({ query: listVehiclesQuerySchema }),
  asyncHandler(vehiclesController.list),
);

router.get(
  '/:id',
  requirePermission('vehicles.read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(vehiclesController.getById),
);

router.post(
  '/',
  requirePermission('vehicles.create'),
  validateRequest({ body: createVehicleSchema }),
  asyncHandler(vehiclesController.create),
);

router.patch(
  '/:id',
  requirePermission('vehicles.update'),
  validateRequest({ params: idParamSchema, body: updateVehicleSchema }),
  asyncHandler(vehiclesController.update),
);

router.delete(
  '/:id',
  requirePermission('vehicles.delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(vehiclesController.remove),
);

export { router as vehiclesRoutes };
