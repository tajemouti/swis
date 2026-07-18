import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env';
import { UnauthorizedError, ValidationError } from '@shared/domain/errors/app-error';
import { authRepository } from './auth.repository';
import { AuthTokens, ChangePasswordDto, LoginDto, SafeUser } from './auth.dto';
import { AuthenticatedUser } from '@shared/types/express';

const REFRESH_TOKEN_TTL_MS = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return value * unitMs;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function toSafeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { name: string };
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
  };
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  roleId: string;
  role: { name: string; rolePermissions: { permission: { name: string } }[] };
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roleName: user.role.name as any,
    permissions: user.role.rolePermissions.map((rp) => rp.permission.name),
  };
}

class AuthService {
  private signAccessToken(user: AuthenticatedUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.roleName,
      permissions: user.permissions,
    };
    const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await authRepository.createRefreshToken(userId, tokenHash, expiresAt);
    return token;
  }

  async login(dto: LoginDto, ipAddress?: string): Promise<{ tokens: AuthTokens; user: SafeUser }> {
    const user = await authRepository.findUserByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const authenticatedUser = toAuthenticatedUser(user);
    const accessToken = this.signAccessToken(authenticatedUser);
    const refreshToken = await this.issueRefreshToken(user.id);

    await authRepository.updateLastLogin(user.id);
    await authRepository.createAuditLog({
      userId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      ipAddress,
    });

    return { tokens: { accessToken, refreshToken }, user: toSafeUser(user) };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }

    // Rotation: revoke the used token immediately, then issue a new one.
    await authRepository.revokeRefreshToken(stored.id);

    const user = await authRepository.findUserById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User is no longer active');
    }

    const authenticatedUser = toAuthenticatedUser(user);
    const accessToken = this.signAccessToken(authenticatedUser);
    const newRefreshToken = await this.issueRefreshToken(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);
    if (stored) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }

    const matches = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!matches) {
      throw new ValidationError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await authRepository.updatePassword(userId, newHash);
    // Force re-login everywhere after a password change.
    await authRepository.revokeAllUserTokens(userId);
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
      return {
        id: payload.sub as string,
        email: payload.email as string,
        roleId: '',
        roleName: payload.role,
        permissions: payload.permissions ?? [],
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }
}

export const authService = new AuthService();
