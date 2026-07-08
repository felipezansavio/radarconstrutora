import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { LeadsRepository } from '../leads/repositories/leads.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionsRepository } from './repositories/interactions.repository';

@Injectable()
export class CrmService {
  constructor(
    private readonly interactionsRepository: InteractionsRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async assertLeadBelongsToTenant(leadId: string, tenantId: string) {
    const lead = await this.leadsRepository.findById(leadId);

    if (!lead || lead.tenantId !== tenantId) {
      throw new NotFoundException('Lead não encontrado');
    }

    return lead;
  }

  async findAllForLead(leadId: string, currentUser: AuthenticatedUser) {
    await this.assertLeadBelongsToTenant(leadId, currentUser.tenantId);
    return this.interactionsRepository.findManyByLead(leadId);
  }

  async create(
    leadId: string,
    dto: CreateInteractionDto,
    currentUser: AuthenticatedUser,
  ) {
    const lead = await this.assertLeadBelongsToTenant(
      leadId,
      currentUser.tenantId,
    );

    const interaction = await this.interactionsRepository.create({
      lead: { connect: { id: leadId } },
      author: { connect: { id: currentUser.userId } },
      type: dto.type,
      message: dto.message,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    });

    if (lead.ownerId && lead.ownerId !== currentUser.userId) {
      await this.notificationsService.notify({
        tenantId: currentUser.tenantId,
        userId: lead.ownerId,
        type: 'INTERACTION_CREATED',
        title: 'Nova interação registrada no seu lead',
        message: dto.message,
        metadata: { leadId, interactionId: interaction.id },
      });
    }

    return interaction;
  }
}
