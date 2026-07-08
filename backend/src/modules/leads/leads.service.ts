import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPaginatedResult } from '../../common/dto/paginated-result.dto';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { BuildersRepository } from '../builders/repositories/builders.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectsRepository } from '../projects/repositories/projects.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsRepository } from './repositories/leads.repository';

@Injectable()
export class LeadsService {
  constructor(
    private readonly leadsRepository: LeadsRepository,
    private readonly buildersRepository: BuildersRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: QueryLeadsDto, currentUser: AuthenticatedUser) {
    const { page, pageSize, ...filters } = query;

    const { data, total } = await this.leadsRepository.findMany({
      ...filters,
      tenantId: currentUser.tenantId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const lead = await this.leadsRepository.findById(id);

    if (!lead || lead.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Lead não encontrado');
    }

    return lead;
  }

  private async assertOwnerBelongsToTenant(ownerId: string, tenantId: string) {
    const owner = await this.usersRepository.findById(ownerId);

    if (!owner || owner.tenantId !== tenantId) {
      throw new NotFoundException('Usuário responsável não encontrado');
    }
  }

  async create(dto: CreateLeadDto, currentUser: AuthenticatedUser) {
    let companyId = dto.companyId;

    if (dto.developmentId) {
      const development = await this.projectsRepository.findById(
        dto.developmentId,
      );

      if (!development) {
        throw new NotFoundException('Empreendimento não encontrado');
      }

      companyId = companyId ?? development.companyId;
    }

    if (companyId) {
      const builder = await this.buildersRepository.findById(companyId);
      if (!builder) {
        throw new NotFoundException('Construtora não encontrada');
      }
    }

    const ownerId = dto.ownerId ?? currentUser.userId;
    await this.assertOwnerBelongsToTenant(ownerId, currentUser.tenantId);

    const lead = await this.leadsRepository.create({
      tenant: { connect: { id: currentUser.tenantId } },
      company: companyId ? { connect: { id: companyId } } : undefined,
      development: dto.developmentId
        ? { connect: { id: dto.developmentId } }
        : undefined,
      owner: { connect: { id: ownerId } },
      temperature: dto.temperature,
      notes: dto.notes,
    });

    await this.notificationsService.notify({
      tenantId: currentUser.tenantId,
      userId: ownerId,
      type: 'LEAD_CREATED',
      title: 'Novo lead atribuído a você',
      message: lead.company?.name ?? lead.development?.name ?? undefined,
      metadata: { leadId: lead.id },
    });

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, currentUser: AuthenticatedUser) {
    const lead = await this.findOne(id, currentUser);

    if (dto.ownerId) {
      await this.assertOwnerBelongsToTenant(dto.ownerId, currentUser.tenantId);
    }

    const updated = await this.leadsRepository.update(id, {
      temperature: dto.temperature,
      commercialStatus: dto.commercialStatus,
      notes: dto.notes,
      owner: dto.ownerId ? { connect: { id: dto.ownerId } } : undefined,
    });

    if (
      dto.commercialStatus &&
      dto.commercialStatus !== lead.commercialStatus
    ) {
      await this.notificationsService.notify({
        tenantId: currentUser.tenantId,
        userId: updated.ownerId ?? currentUser.userId,
        type: 'LEAD_STATUS_CHANGED',
        title: 'Status do lead atualizado',
        message: `Novo status: ${dto.commercialStatus}`,
        metadata: { leadId: id },
      });
    }

    if (dto.ownerId && dto.ownerId !== lead.ownerId) {
      await this.notificationsService.notify({
        tenantId: currentUser.tenantId,
        userId: dto.ownerId,
        type: 'LEAD_ASSIGNED',
        title: 'Um lead foi atribuído a você',
        metadata: { leadId: id },
      });
    }

    return updated;
  }
}
