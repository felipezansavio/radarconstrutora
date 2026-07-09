import { Injectable } from '@nestjs/common';
import { Prisma, TaskType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface FindManyTasksOptions {
  tenantId: string;
  from?: Date;
  to?: Date;
  leadId?: string;
  assigneeId?: string;
  type?: TaskType;
  completed?: boolean;
}

const taskInclude = {
  assignee: { select: { id: true, name: true } },
  lead: {
    select: {
      id: true,
      company: { select: { id: true, name: true } },
      development: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(options: FindManyTasksOptions) {
    const where: Prisma.TaskWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      leadId: options.leadId,
      assigneeId: options.assigneeId,
      type: options.type,
      completedAt:
        options.completed === undefined
          ? undefined
          : options.completed
            ? { not: null }
            : null,
      dueAt:
        options.from || options.to
          ? { gte: options.from, lte: options.to }
          : undefined,
    };

    return this.prisma.task.findMany({
      where,
      orderBy: { dueAt: 'asc' },
      include: taskInclude,
    });
  }

  findById(id: string) {
    return this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: taskInclude,
    });
  }

  create(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({ data, include: taskInclude });
  }

  update(id: string, data: Prisma.TaskUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
  }

  /** Exclusão lógica — preserva o histórico de auditoria da tarefa. */
  softDelete(id: string) {
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
