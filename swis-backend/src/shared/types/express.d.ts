import { RoleName } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roleId: string;
  roleName: RoleName;
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
