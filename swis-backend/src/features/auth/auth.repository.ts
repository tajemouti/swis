import { prisma } from '@config/database';

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
  }

  findUserById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
  }

  updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });
  }

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  createAuditLog(params: {
    userId: string | null;
    action: string;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        ipAddress: params.ipAddress,
      },
    });
  }
}

export const authRepository = new AuthRepository();
