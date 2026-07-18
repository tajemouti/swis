import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '@shared/middlewares/auth.middleware';
import { validateRequest } from '@shared/middlewares/validate-request.middleware';
import { authRateLimiter } from '@shared/middlewares/rate-limit.middleware';
import { asyncHandler } from '@shared/utils/async-handler';
import { changePasswordSchema, loginSchema } from './auth.dto';

const router = Router();

router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  asyncHandler(authController.login),
);

router.post('/refresh', authRateLimiter, asyncHandler(authController.refresh));

router.post('/logout', asyncHandler(authController.logout));

router.get('/me', authMiddleware, asyncHandler(authController.me));

router.post(
  '/change-password',
  authMiddleware,
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);

export { router as authRoutes };
