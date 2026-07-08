import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationsRepository } from './repositories/notifications.repository';

export interface NotifyInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  /**
   * Cria uma notificação interna. Usado por outros módulos (Leads, CRM)
   * para avisar usuários sobre eventos relevantes.
   */
  notify(input: NotifyInput) {
    return this.notificationsRepository.create({
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
      tenant: { connect: { id: input.tenantId } },
      user: { connect: { id: input.userId } },
    });
  }

  findAllForUser(userId: string, onlyUnread = false) {
    return this.notificationsRepository.findManyForUser(userId, onlyUnread);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta notificação',
      );
    }

    return this.notificationsRepository.markAsRead(id);
  }
}
