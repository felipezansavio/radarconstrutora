import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { LeadsRepository } from '../leads/repositories/leads.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksRepository } from './repositories/tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  findAll(query: QueryTasksDto, currentUser: AuthenticatedUser) {
    return this.tasksRepository.findMany({
      tenantId: currentUser.tenantId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      leadId: query.leadId,
      assigneeId: query.assigneeId,
      type: query.type,
      completed: query.completed,
    });
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const task = await this.tasksRepository.findById(id);

    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return task;
  }

  private async assertLeadBelongsToTenant(leadId: string, tenantId: string) {
    const lead = await this.leadsRepository.findById(leadId);
    if (!lead || lead.tenantId !== tenantId) {
      throw new NotFoundException('Lead não encontrado');
    }
  }

  private async assertAssigneeBelongsToTenant(
    assigneeId: string,
    tenantId: string,
  ) {
    const user = await this.usersRepository.findById(assigneeId);
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('Usuário responsável não encontrado');
    }
  }

  async create(dto: CreateTaskDto, currentUser: AuthenticatedUser) {
    if (dto.leadId) {
      await this.assertLeadBelongsToTenant(dto.leadId, currentUser.tenantId);
    }

    const assigneeId = dto.assigneeId ?? currentUser.userId;
    await this.assertAssigneeBelongsToTenant(assigneeId, currentUser.tenantId);

    return this.tasksRepository.create({
      tenant: { connect: { id: currentUser.tenantId } },
      lead: dto.leadId ? { connect: { id: dto.leadId } } : undefined,
      assignee: { connect: { id: assigneeId } },
      type: dto.type,
      title: dto.title,
      notes: dto.notes,
      dueAt: new Date(dto.dueAt),
    });
  }

  async update(id: string, dto: UpdateTaskDto, currentUser: AuthenticatedUser) {
    await this.findOne(id, currentUser);

    if (dto.assigneeId) {
      await this.assertAssigneeBelongsToTenant(
        dto.assigneeId,
        currentUser.tenantId,
      );
    }

    return this.tasksRepository.update(id, {
      title: dto.title,
      type: dto.type,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      notes: dto.notes,
      assignee: dto.assigneeId
        ? { connect: { id: dto.assigneeId } }
        : undefined,
      completedAt:
        dto.completed === undefined
          ? undefined
          : dto.completed
            ? new Date()
            : null,
    });
  }

  async remove(id: string, currentUser: AuthenticatedUser) {
    await this.findOne(id, currentUser);
    return this.tasksRepository.delete(id);
  }
}
