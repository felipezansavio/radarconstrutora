import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface RecordAuditLogInput {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface QueryAuditLogsOptions {
  tenantId: string;
  entity?: string;
  action?: string;
  userId?: string;
  skip: number;
  take: number;
}

/**
 * Registro de auditoria (Parte 12): quem fez o quê, quando e de onde.
 * Gravar um log nunca deve derrubar a operação que o originou — falhas
 * aqui só são registradas em log de aplicação.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: input.tenantId ?? undefined,
          userId: input.userId ?? undefined,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? undefined,
          oldValue: (input.oldValue as Prisma.InputJsonValue) ?? undefined,
          newValue: (input.newValue as Prisma.InputJsonValue) ?? undefined,
          ipAddress: input.ipAddress ?? undefined,
          userAgent: input.userAgent ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao registrar log de auditoria (${input.action}/${input.entity}): ${(error as Error).message}`,
      );
    }
  }

  async findAllForTenant(options: QueryAuditLogsOptions) {
    const where: Prisma.AuditLogWhereInput = {
      tenantId: options.tenantId,
      entity: options.entity,
      action: options.action,
      userId: options.userId,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }
}
