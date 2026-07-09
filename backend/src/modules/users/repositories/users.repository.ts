import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByTenant(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  /**
   * Inclui usuários removidos de propósito: o e-mail permanece único no
   * banco mesmo após a exclusão lógica, então o cadastro/login precisam
   * enxergar o registro para dar a mensagem de erro correta.
   */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /** Exclusão lógica — preserva o histórico de CRM e auditoria do usuário. */
  softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
