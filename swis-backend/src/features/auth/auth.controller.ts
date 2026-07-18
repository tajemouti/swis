import { Request, Response } from 'express';
import { authService } from './auth.service';
import { authRepository } from './auth.repository';
import { UnauthorizedError } from '@shared/domain/errors/app-error';
import { isProduction } from '@config/env';

const REFRESH_COOKIE_NAME = 'swis_refresh_token';

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  async login(req: Request, res: Response) {
    const { tokens, user } = await authService.login(req.body, req.ip);
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
    res.status(200).json({
      success: true,
      data: { accessToken: tokens.accessToken, user },
    });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }
    const tokens = await authService.refresh(refreshToken);
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
    res.status(200).json({ success: true, data: { accessToken: tokens.accessToken } });
  },

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    res.status(200).json({ success: true, data: { message: 'Logged out' } });
  },

  async me(req: Request, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await authRepository.findUserById(req.user.id);
    if (!user) {
      throw new UnauthorizedError();
    }
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions: user.role.rolePermissions.map(
          (rp: { permission: { name: string } }) => rp.permission.name,
        ),
      },
    });
  },

  async changePassword(req: Request, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    await authService.changePassword(req.user.id, req.body);
    res.status(200).json({ success: true, data: { message: 'Password updated' } });
  },
};
