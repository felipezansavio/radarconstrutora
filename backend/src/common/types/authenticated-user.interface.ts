import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  tenantId: string;
  role: UserRole;
}
