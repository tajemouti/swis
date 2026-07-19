import { Router } from 'express';
import { routesController } from './routes.controller';
import { authMiddleware } from '@shared/middlewares/auth.middleware';
import { requirePermission } from '@shared/middlewares/rbac.middleware';
import { validateRequest } from '@shared/middlewares/validate-request.middleware';
import { asyncHandler } from '@shared/utils/async-handler';
import {
  createRouteSchema,
  idParamSchema,
  listRoutesQuerySchema,
  routeStopParamsSchema,
  updateRouteSchema,
  updateRouteStatusSchema,
  updateStopSchema,
} from './routes.dto';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission('routes.read'),
  validateRequest({ query: listRoutesQuerySchema }),
  asyncHandler(routesController.list),
);

router.get(
  '/:id',
  requirePermission('routes.read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(routesController.getById),
);

router.post(
  '/',
  requirePermission('routes.create'),
  validateRequest({ body: createRouteSchema }),
  asyncHandler(routesController.create),
);

router.patch(
  '/:id',
  requirePermission('routes.update'),
  validateRequest({ params: idParamSchema, body: updateRouteSchema }),
  asyncHandler(routesController.update),
);

router.delete(
  '/:id',
  requirePermission('routes.delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(routesController.remove),
);

router.patch(
  '/:id/status',
  requirePermission('routes.update'),
  validateRequest({ params: idParamSchema, body: updateRouteStatusSchema }),
  asyncHandler(routesController.updateStatus),
);

router.patch(
  '/:id/stops/:stopId',
  requirePermission('routes.update'),
  validateRequest({ params: routeStopParamsSchema, body: updateStopSchema }),
  asyncHandler(routesController.updateStopStatus),
);

export { router as routesManagementRoutes };
