import { Router } from 'express';
import { containersController } from './containers.controller';
import { authMiddleware } from '@shared/middlewares/auth.middleware';
import { requirePermission } from '@shared/middlewares/rbac.middleware';
import { validateRequest } from '@shared/middlewares/validate-request.middleware';
import { asyncHandler } from '@shared/utils/async-handler';
import {
  createContainerSchema,
  idParamSchema,
  listContainersQuerySchema,
  updateContainerSchema,
} from './containers.dto';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  requirePermission('containers.read'),
  validateRequest({ query: listContainersQuerySchema }),
  asyncHandler(containersController.list),
);

router.get(
  '/:id',
  requirePermission('containers.read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(containersController.getById),
);

router.post(
  '/',
  requirePermission('containers.create'),
  validateRequest({ body: createContainerSchema }),
  asyncHandler(containersController.create),
);

router.patch(
  '/:id',
  requirePermission('containers.update'),
  validateRequest({ params: idParamSchema, body: updateContainerSchema }),
  asyncHandler(containersController.update),
);

router.delete(
  '/:id',
  requirePermission('containers.delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(containersController.remove),
);

export { router as containersRoutes };
