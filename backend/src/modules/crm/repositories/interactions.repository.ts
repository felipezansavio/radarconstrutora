import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class InteractionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByLead(leadId: string) {
    return this.prisma.interaction.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  create(data: Prisma.InteractionCreateInput) {
    return this.prisma.interaction.create({
      data,
      include: { author: { select: { id: true, name: true } } },
    });
  }
}
