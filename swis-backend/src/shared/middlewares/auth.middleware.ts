import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '@shared/domain/errors/app-error';
import { authService } from '@features/auth/auth.service';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);
  const user = authService.verifyAccessToken(token);
  req.user = user;
  next();
}
