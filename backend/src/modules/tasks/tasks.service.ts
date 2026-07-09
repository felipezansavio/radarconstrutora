import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { LeadsRepository } from '../leads/repositories/leads.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksRepository } from './repositories/tasks.repository';

/** Perfis com visão completa das tarefas da empresa (não só as próprias). */
const FULL_VISIBILITY_ROLES = ['ADMIN', 'GESTOR'];

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly auditService: AuditService,
  ) {}

  findAll(query: QueryTasksDto, currentUser: AuthenticatedUser) {
    // Um vendedor só enxerga as próprias tarefas — mesmo que tente
    // filtrar por assigneeId de outra pessoa, o filtro é sobrescrito.
    const assigneeId = FULL_VISIBILITY_ROLES.includes(currentUser.role)
      ? query.assigneeId
      : currentUser.userId;

    return this.tasksRepository.findMany({
      tenantId: currentUser.tenantId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      leadId: query.leadId,
      assigneeId,
      type: query.type,
      completed: query.completed,
    });
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const task = await this.tasksRepository.findById(id);

    if (!task || task.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    this.assertCanAccessTask(task.assigneeId, currentUser);

    return task;
  }

  private assertCanAccessTask(
    assigneeId: string | null,
    currentUser: AuthenticatedUser,
  ) {
    if (
      !FULL_VISIBILITY_ROLES.includes(currentUser.role) &&
      assigneeId !== currentUser.userId
    ) {
      throw new ForbiddenException(
        'Você só pode acessar tarefas atribuídas a você',
      );
    }
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

    if (
      !FULL_VISIBILITY_ROLES.includes(currentUser.role) &&
      assigneeId !== currentUser.userId
    ) {
      throw new ForbiddenException(
        'Você só pode criar tarefas atribuídas a você mesmo',
      );
    }

    await this.assertAssigneeBelongsToTenant(assigneeId, currentUser.tenantId);

    const task = await this.tasksRepository.create({
      tenant: { connect: { id: currentUser.tenantId } },
      lead: dto.leadId ? { connect: { id: dto.leadId } } : undefined,
      assignee: { connect: { id: assigneeId } },
      type: dto.type,
      title: dto.title,
      notes: dto.notes,
      dueAt: new Date(dto.dueAt),
    });

    await this.auditService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: task.id,
      newValue: { title: task.title, assigneeId, dueAt: task.dueAt },
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, currentUser: AuthenticatedUser) {
    const task = await this.findOne(id, currentUser);

    if (dto.assigneeId && !FULL_VISIBILITY_ROLES.includes(currentUser.role)) {
      throw new ForbiddenException(
        'Apenas administradores e gestores podem reatribuir tarefas',
      );
    }

    if (dto.assigneeId) {
      await this.assertAssigneeBelongsToTenant(
        dto.assigneeId,
        currentUser.tenantId,
      );
    }

    const updated = await this.tasksRepository.update(id, {
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

    await this.auditService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      action: 'TASK_UPDATED',
      entity: 'Task',
      entityId: id,
      oldValue: {
        title: task.title,
        assigneeId: task.assigneeId,
        completedAt: task.completedAt,
      },
      newValue: {
        title: updated.title,
        assigneeId: updated.assigneeId,
        completedAt: updated.completedAt,
      },
    });

    return updated;
  }

  async remove(id: string, currentUser: AuthenticatedUser) {
    const task = await this.findOne(id, currentUser);
    await this.tasksRepository.softDelete(id);

    await this.auditService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      action: 'TASK_DELETED',
      entity: 'Task',
      entityId: id,
      oldValue: { title: task.title, assigneeId: task.assigneeId },
    });
  }
}
