import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restringe o acesso à rota aos perfis informados. Deve ser usado em
 * conjunto com o RolesGuard (registrado globalmente).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
