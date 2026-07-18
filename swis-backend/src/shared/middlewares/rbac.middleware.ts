import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '@shared/domain/errors/app-error';

/**
 * Usage: router.post('/vehicles', authMiddleware, requirePermission('vehicles.create'), handler)
 * Requires ALL listed permissions to pass (AND semantics). For OR semantics, chain
 * separate route definitions instead — explicit is safer than a hidden mode flag.
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const hasAll = requiredPermissions.every((perm) => req.user!.permissions.includes(perm));
    if (!hasAll) {
      throw new ForbiddenError();
    }

    next();
  };
}
